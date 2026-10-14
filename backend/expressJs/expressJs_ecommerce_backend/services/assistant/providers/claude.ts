/**
 * ANTHROPIC CLAUDE provider (backup - paid API, needs credits).
 *
 * Turn it on with  AI_PROVIDER=claude  and  ANTHROPIC_API_KEY=sk-ant-...  in .env
 * (https://console.anthropic.com -> API Keys; buy credits under Billing).
 *
 * Claude's message format:
 *   history = [{ role: "user" | "assistant", content: [...] }]
 *   the model asks for a tool with a  { type: "tool_use", id, name, input }  block
 *   we answer with a                  { type: "tool_result", tool_use_id, content }  block (role "user")
 */
import Anthropic from "@anthropic-ai/sdk";
import { MAX_ITERATIONS, SYSTEM_PROMPT } from "../prompt.js";
import { TOOL_DEFINITIONS, type ProductCard } from "../tools.js";
import { collectPendingResults, finishResult, runToolCalls, type ToolCall } from "../toolRunner.js";
import type { AIProvider, AgentResult, ToolResult } from "../types.js";

const MODEL = "claude-opus-5-5";

/** Our shared tool list in Claude's format; strict = arguments always match the schema. */
const TOOLS: Anthropic.Beta.BetaTool[] = TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
    strict: true,
}));

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic()); // reads ANTHROPIC_API_KEY

/** One tool result as a Claude tool_result block. */
function toToolResult(result: ToolResult): Anthropic.Beta.BetaToolResultBlockParam {
    return { type: "tool_result", tool_use_id: result.id, content: result.content, ...(result.isError ? { is_error: true } : {}) };
}

export const claudeProvider: AIProvider = {
    name: "claude",

    buildUserTurn(pending, actionResults, text, contextNote): Anthropic.Beta.BetaMessageParam {
        const content: Anthropic.Beta.BetaContentBlockParam[] = collectPendingResults(pending, actionResults).map(toToolResult);
        if (text) content.push({ type: "text", text: `${contextNote}\n${text}` });
        return { role: "user", content };
    },

    async run(history, ctx): Promise<AgentResult> {
        const messages = history as Anthropic.Beta.BetaMessageParam[];
        const replyParts: string[] = [];
        const products: ProductCard[] = [];

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            // 1. Ask Claude what to do next. Low effort = quick chat replies; the cached system prompt
            //    + tools make repeat requests cheaper; "default" fallbacks retry a refused request.
            const response = await getClient().beta.messages.create({
                model: MODEL,
                max_tokens: 16000,
                betas: ["server-side-fallback-2026-07-01"],
                fallbacks: "default",
                output_config: { effort: "low" },
                system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
                tools: TOOLS,
                messages,
            });

            // 2. Save its reply exactly as returned (Claude requires the history to be passed back unchanged).
            if (response.content.length) messages.push({ role: "assistant", content: response.content });
            for (const block of response.content) {
                if (block.type === "text" && block.text.trim()) replyParts.push(block.text.trim());
            }

            if (response.stop_reason === "refusal") {
                return { ...finishResult(["Sorry, I can't help with that. I can help you shop on Shopvra."], products), actions: [], pending: null };
            }

            // 3. No tool calls -> the answer is complete.
            const calls: ToolCall[] = response.content
                .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
                .map((b) => ({ id: b.id, name: b.name, input: b.input as Record<string, unknown> }));
            if (response.stop_reason !== "tool_use" || calls.length === 0) {
                return { ...finishResult(replyParts, products), actions: [], pending: null };
            }

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

            // 6. Otherwise send all results back in ONE user message and loop.
            messages.push({ role: "user", content: batch.serverResults.map(toToolResult) });
        }

        return { ...finishResult([...replyParts, "Sorry, that took too many steps - could you rephrase?"], products), actions: [], pending: null };
    },
};
