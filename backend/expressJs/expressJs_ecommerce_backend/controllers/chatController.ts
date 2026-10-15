import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiApiError } from "@google/genai";
import mongoose from "mongoose";
import { z } from "zod";
import ChatSession from "../models/ChatSession.js";
import { getProvider } from "../services/assistant/index.js";

/** Max user messages per conversation (cost / quota guard); the app offers "New chat" after that. */
const MAX_TURNS = 40;

const bodySchema = z.object({
    sessionId: z.string().optional(),
    message: z.string().trim().max(1000).optional(),
    /** Language picked in the chat (e.g. "Marathi") - used for voice; replies follow the user's own words. */
    language: z.string().trim().max(40).regex(/^[\p{L} ()-]*$/u).optional(),
    actionResults: z.array(z.object({ id: z.string(), ok: z.boolean(), result: z.string().max(2000) })).max(10).optional(),
});

/**
 * Passwords must never reach the AI provider (or our chat history). Users are asked to type them in the in-chat
 * sign-in form, but if someone writes "my password is xyz" anyway we hide the value before the AI sees it.
 */
const PASSWORD_PATTERN = /\b(password|passcode|passwd|pwd|pass)\b(\s*(?:is|:|=|-)?\s*)(\S+)/gi;
export const hidePasswords = (text: string) => text.replace(PASSWORD_PATTERN, "$1$2[hidden]");

/**
 * POST /api/chat  (optionalAuth) - one shopping-assistant turn.
 *
 * Body:     { sessionId?, message?, actionResults? }
 * Response: { sessionId, reply, actions[], products[] }
 *
 *  1. load (or start) the conversation  2. add the user's turn  3. let the AI provider run
 *  4. save the conversation             5. return the reply + any actions for the app to perform
 */
export const chat = async (req: Request, res: Response) => {
    const provider = getProvider();
    if (!provider) {
        return res.status(503).json({ success: false, message: "The shopping assistant is not configured yet." });
    }
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid request" });
    const { sessionId, language, actionResults = [] } = parsed.data;
    const message = parsed.data.message ? hidePasswords(parsed.data.message) : undefined;
    const userId: mongoose.Types.ObjectId | null = req.user?._id ?? null;

    try {
        // 1. Conversation: belongs to whoever started it; a guest chat continues after sign-in;
        //    a chat from another AI provider can't be continued (different message format).
        let session = sessionId && mongoose.Types.ObjectId.isValid(sessionId) ? await ChatSession.findById(sessionId) : null;
        if (session && session.user && (!userId || !session.user.equals(userId))) session = null;
        if (session && session.provider !== provider.name) session = null;
        if (!session) session = new ChatSession({ user: userId, provider: provider.name, messages: [] });
        else if (!session.user && userId) session.user = userId;

        if (!message && !session.pending) return res.status(400).json({ success: false, message: "Send a message" });
        if (message && session.turns >= MAX_TURNS) {
            return res.status(429).json({ success: false, message: "This chat is getting long - please start a new chat." });
        }

        // 2. User turn = results of pending app actions + the new message.
        const who = userId ? `signed in as ${req.user.name || "a customer"}` : "guest, not signed in";
        const contextNote = `(App context: ${who}${language ? `; language selected in the app: ${language}` : ""})`;
        const history = [...(session.messages as unknown[]), provider.buildUserTurn(session.pending as any, actionResults, message, contextNote)];

        // 3. AI runs (calls tools, may pause for app actions).
        const result = await provider.run(history, { userId });

        // 4. Save.
        session.messages = history;
        session.pending = result.pending as any;
        if (message) session.turns += 1;
        session.markModified("messages");
        session.markModified("pending");
        await session.save();

        // 5. Reply.
        return res.json({ success: true, sessionId: String(session._id), reply: result.reply, actions: result.actions, products: result.products });
    } catch (err) {
        const status = err instanceof Anthropic.APIError || err instanceof GeminiApiError ? err.status : undefined;
        console.error(`[assistant] ${provider.name} request failed${status ? ` (${status})` : ""}:`, err instanceof Error ? err.message : err);
        if (status === 429) return res.status(429).json({ success: false, message: "The assistant is busy - please try again in a moment." });
        if (status === 401 || status === 403) return res.status(503).json({ success: false, message: "The shopping assistant is not configured correctly." });
        return res.status(502).json({ success: false, message: "The assistant had a problem - please try again." });
    }
};
