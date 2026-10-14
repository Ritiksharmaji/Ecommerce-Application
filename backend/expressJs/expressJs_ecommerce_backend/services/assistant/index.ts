/**
 * Picks the AI provider for the shopping assistant.
 *
 *   AI_PROVIDER=gemini  (default)  -> providers/gemini.ts, needs GEMINI_API_KEY   (free tier)
 *   AI_PROVIDER=claude             -> providers/claude.ts, needs ANTHROPIC_API_KEY (paid)
 *
 * Switching is just changing AI_PROVIDER in .env (and on Lambda) and restarting - the app doesn't change.
 */
import { claudeProvider } from "./providers/claude.js";
import { geminiProvider } from "./providers/gemini.js";
import type { AIProvider } from "./types.js";

const PROVIDERS = { gemini: geminiProvider, claude: claudeProvider } as const;
const REQUIRED_KEY = { gemini: "GEMINI_API_KEY", claude: "ANTHROPIC_API_KEY" } as const;

type ProviderName = keyof typeof PROVIDERS;

/** The configured provider, or null when its API key is missing. */
export function getProvider(): AIProvider | null {
    const name = (process.env.AI_PROVIDER || "gemini").toLowerCase() as ProviderName;
    if (!(name in PROVIDERS)) {
        console.error(`[assistant] Unknown AI_PROVIDER "${name}" (use gemini or claude)`);
        return null;
    }
    if (!process.env[REQUIRED_KEY[name]]) return null;
    return PROVIDERS[name];
}

export type { AIProvider, ActionResult, AgentResult, ClientAction } from "./types.js";
