/**
 * GOOGLE GEMINI provider (default - free tier from Google AI Studio).
 *
 * Needs GEMINI_API_KEY in .env (https://aistudio.google.com/apikey).
 * Optional GEMINI_MODELS: comma-separated models to try in order (default below). Free-tier models are
 * sometimes busy (HTTP 503) or rate-limited (429); we retry once, then move to the next model.
 *
 * Gemini's message format:
 *   history = [{ role: "user" | "model", parts: [...] }]
 *   the model asks for a tool with a  { functionCall: { id?, name, args } }  part
 *   we answer with a                  { functionResponse: { id?, name, response } }  part (role "user")
 */
import { ApiError, GoogleGenAI, FinishReason, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { MAX_ITERATIONS, SYSTEM_PROMPT } from "../prompt.js";
import { TOOL_DEFINITIONS, type ProductCard } from "../tools.js";
import { collectPendingResults, finishResult, runToolCalls, type ToolCall } from "../toolRunner.js";
import type { AIProvider, AgentResult, ToolResult } from "../types.js";

const DEFAULT_MODELS = "gemini-flash-lite-latest,gemini-3.8-flash,gemini-3.5-flash,gemini-flash-latest";
const models = () => (process.env.GEMINI_MODELS || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
/** Temporary problems worth retrying / trying another model for. */
const RETRYABLE = new Set([404, 429, 500, 503]); // 404 = model not offered to this key
/** 1 = move straight to the next model when one is busy (fastest for users). */
const ATTEMPTS_PER_MODEL = 1;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Our shared tool list in Gemini's format (JSON Schema goes in parametersJsonSchema). */
const FUNCTION_DECLARATIONS: FunctionDeclaration[] = TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.parameters,
}));

let client: GoogleGenAI | null = null;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

/** Calls Gemini, retrying once per model and falling back to the next model when one is busy. */
async function generate(contents: Content[]) {
    let lastError: unknown;
    for (const model of models()) {
        for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
            try {
                return await getClient().models.generateContent({
                    model,
                    contents,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
                    },
                });
            } catch (err) {
                if (!(err instanceof ApiError) || !RETRYABLE.has(err.status)) throw err;
                lastError = err;
                console.warn(`[assistant] ${model} unavailable (${err.status}), ${attempt + 1 < ATTEMPTS_PER_MODEL ? "retrying" : "trying next model"}`);
                if (attempt + 1 < ATTEMPTS_PER_MODEL) await sleep(700);
            }
        }
    }
    throw lastError;
}

/** Gemini may omit a call id; we then make one up (prefix "gen:") and leave it out of the response. */
const GENERATED = "gen:";

/** One tool result as a Gemini functionResponse part. */
function toFunctionResponse(result: ToolResult): Part {
    return {
        functionResponse: {
            name: result.name,
            ...(result.id.startsWith(GENERATED) ? {} : { id: result.id }),
            response: result.isError ? { error: result.content } : { output: result.content },
        },
    };
}

export const geminiProvider: AIProvider = {
    name: "gemini",

    buildUserTurn(pending, actionResults, text, contextNote): Content {
        const parts: Part[] = collectPendingResults(pending, actionResults).map(toFunctionResponse);
        if (text) parts.push({ text: `${contextNote}\n${text}` });
        return { role: "user", parts };
    },

    async run(history, ctx): Promise<AgentResult> {
        const contents = history as Content[];
        const replyParts: string[] = [];
        const products: ProductCard[] = [];

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            // 1. Ask Gemini what to do next.
            const response = await generate(contents);

            // 2. Save its reply exactly as returned (keeps any thought signatures the next request needs).
            const candidate = response.candidates?.[0];
            const modelContent = candidate?.content;
            if (modelContent?.parts?.length) contents.push({ ...modelContent, role: "model" });
            for (const part of modelContent?.parts ?? []) {
                if (part.text && !part.thought && part.text.trim()) replyParts.push(part.text.trim());
            }

            if (candidate?.finishReason === FinishReason.SAFETY || candidate?.finishReason === FinishReason.PROHIBITED_CONTENT) {
                return { ...finishResult(["Sorry, I can't help with that. I can help you shop on Shopvra."], products), actions: [], pending: null };
            }

            // 3. No tool calls -> the answer is complete.
            const calls: ToolCall[] = (response.functionCalls ?? []).map((call, index) => ({
                id: call.id || `${GENERATED}${Date.now()}-${index}`,
                name: call.name ?? "",
                input: (call.args ?? {}) as Record<string, unknown>,
            }));
            if (calls.length === 0) return { ...finishResult(replyParts, products), actions: [], pending: null };

            // 4. Run the tools (shared logic for every provider).
            const batch = await runToolCalls(calls, ctx);
            products.push(...batch.products);

            // 5. App actions needed? Pause the chat and let the app perform them.
            if (batch.clientActions.length) {
                return {
                    ...finishResult(replyParts, products),
                    actions: batch.clientActions,
                    pending: { clientActions: batch.clientActions, serverResults: batch.serverResults },
                };
            }

            // 6. Otherwise send all results back in one message and loop.
            contents.push({ role: "user", parts: batch.serverResults.map(toFunctionResponse) });
        }

        return { ...finishResult([...replyParts, "Sorry, that took too many steps - could you rephrase?"], products), actions: [], pending: null };
    },
};
