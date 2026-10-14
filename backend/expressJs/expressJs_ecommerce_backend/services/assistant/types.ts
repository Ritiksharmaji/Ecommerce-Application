/**
 * Shared types for the shopping assistant - used by every AI provider.
 *
 * Vocabulary:
 *   tool call      the AI asking to use one of our tools (search_products, navigate, ...)
 *   server tool    a tool we run right here on the backend (read-only database lookups)
 *   client action  a tool the APP must perform (navigate, add to cart, show a form, confirm an order);
 *                  the chat turn pauses until the app sends back what happened
 */
import type mongoose from "mongoose";
import type { ProductCard } from "./tools.js";

/** Who is chatting. No tool accepts a user id, so the AI can only ever touch this user's data. */
export interface ToolContext {
    userId: mongoose.Types.ObjectId | null;
}

/** A tool call the app has to perform. */
export interface ClientAction {
    /** Id the app echoes back with its result. */
    id: string;
    name: string;
    input: Record<string, unknown>;
}

/** The outcome of one tool call, in a provider-neutral form. */
export interface ToolResult {
    id: string;
    name: string;
    content: string;
    isError: boolean;
}

/** Saved with the chat while the app performs client actions. */
export interface Pending {
    clientActions: ClientAction[];
    /** Results of server tools from the same AI turn; sent together with the app's results. */
    serverResults: ToolResult[];
}

/** What the app reports for one client action. */
export interface ActionResult {
    id: string;
    ok: boolean;
    result: string;
}

/** What one chat request returns to the app. */
export interface AgentResult {
    reply: string;
    actions: ClientAction[];
    products: ProductCard[];
    pending: Pending | null;
}

/**
 * The contract every AI provider implements. The conversation history is stored in the provider's own
 * message format (Claude and Gemini format messages differently), so a chat started with one provider
 * cannot continue on another - the controller starts a fresh chat when AI_PROVIDER changes.
 */
export interface AIProvider {
    readonly name: "gemini" | "claude";
    /** Builds the next "user" message: results of pending tool calls + the user's new text. */
    buildUserTurn(pending: Pending | null, actionResults: ActionResult[], text: string | undefined, contextNote: string): unknown;
    /** Continues the conversation (history ends with the new user turn); appends new turns to `history`. */
    run(history: unknown[], ctx: ToolContext): Promise<AgentResult>;
}
