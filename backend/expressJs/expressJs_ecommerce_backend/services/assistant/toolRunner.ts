import { CLIENT_ACTIONS, checkClientAction, runServerTool, type ProductCard } from "./tools.js";
import type { ClientAction, ToolContext, ToolResult } from "./types.js";

/** One tool call from the AI, already converted to a provider-neutral shape. */
export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ToolBatchOutcome {
    /** Finished results (server tools + rejected client actions). */
    serverResults: ToolResult[];
    /** Valid client actions the app must perform. */
    clientActions: ClientAction[];
    /** Products found in this batch, shown to the user as cards. */
    products: ProductCard[];
}

/**
 * Runs every tool call of one AI turn:
 *   - server tools run now (database lookups);
 *   - client actions are validated and handed to the app (invalid ones become an error result the AI sees).
 * Used by both providers, so tool behaviour is identical for Gemini and Claude.
 */
export async function runToolCalls(calls: ToolCall[], ctx: ToolContext): Promise<ToolBatchOutcome> {
    const serverResults: ToolResult[] = [];
    const clientActions: ClientAction[] = [];
    const products: ProductCard[] = [];

    for (const call of calls) {
        if (CLIENT_ACTIONS.has(call.name)) {
            const problem = checkClientAction(call.name, call.input, ctx);
            if (problem) serverResults.push({ id: call.id, name: call.name, content: problem, isError: true });
            else clientActions.push({ id: call.id, name: call.name, input: call.input });
            continue;
        }
        try {
            const outcome = await runServerTool(call.name, call.input, ctx);
            if (outcome.products) products.push(...outcome.products);
            serverResults.push({ id: call.id, name: call.name, content: outcome.content, isError: !!outcome.isError });
        } catch (err) {
            console.error(`[assistant] tool ${call.name} failed:`, err);
            serverResults.push({ id: call.id, name: call.name, content: "Tool failed, try again later.", isError: true });
        }
    }
    return { serverResults, clientActions, products };
}

/** Results for every pending call: server results + the app's outcome for each client action. */
export function collectPendingResults(
    pending: { clientActions: ClientAction[]; serverResults: ToolResult[] } | null,
    actionResults: { id: string; ok: boolean; result: string }[]
): ToolResult[] {
    if (!pending) return [];
    return [
        ...pending.serverResults,
        ...pending.clientActions.map((action) => {
            const r = actionResults.find((a) => a.id === action.id);
            return {
                id: action.id,
                name: action.name,
                content: r ? String(r.result).slice(0, 2000) : "The user did not complete this action.",
                isError: r ? !r.ok : false,
            };
        }),
    ];
}

/** Merges product cards (no duplicates, max 8) and joins reply text. */
export function finishResult(replyParts: string[], products: ProductCard[]) {
    const unique = new Map(products.map((p) => [p.id, p]));
    return { reply: replyParts.join("\n\n").trim(), products: [...unique.values()].slice(0, 8) };
}
