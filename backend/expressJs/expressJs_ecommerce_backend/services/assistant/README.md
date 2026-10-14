# Shopvra Shopping Assistant (AI chat)

The chat bubble in the mobile app and on shopvra.space talks to **one backend endpoint**:
`POST /api/chat`. Behind it, an AI model reads the user's message, uses our **tools** to look things
up or ask the app to do something, and replies.

## Which AI?

| `AI_PROVIDER` in `.env` | File | Key needed | Cost |
|---|---|---|---|
| `gemini` *(default)* | `providers/gemini.ts` | `GEMINI_API_KEY` ([aistudio.google.com](https://aistudio.google.com/apikey)) | Free tier (rate-limited) |
| `claude` | `providers/claude.ts` | `ANTHROPIC_API_KEY` ([console.anthropic.com](https://console.anthropic.com)) | Paid credits |

Switch by changing `AI_PROVIDER` and restarting (on Lambda: change the environment variable). The
apps don't change. Optional: `GEMINI_MODELS` - models to try in order when one is busy (default `gemini-flash-lite-latest,gemini-3.8-flash,gemini-3.5-flash,gemini-flash-latest`).

## Files

```
services/assistant/
├── index.ts         picks the provider from AI_PROVIDER
├── types.ts         shared shapes + the AIProvider "contract" both providers implement
├── prompt.ts        the assistant's instructions (same for both AIs)
├── tools.ts         the tool list (JSON Schema) + what each server tool does
├── toolRunner.ts    runs one batch of tool calls (same for both AIs)
└── providers/
    ├── gemini.ts    Google Gemini - converts tools/messages to Gemini's format
    └── claude.ts    Anthropic Claude - converts tools/messages to Claude's format
controllers/chatController.ts   the HTTP endpoint (load chat -> run AI -> save -> reply)
models/ChatSession.ts           saved conversations (deleted after 7 days)
```

## The tools

**Server tools** - run on the backend, read-only, only for the signed-in user:

| Tool | Does |
|---|---|
| `search_products` | search the catalogue (text, category, max price, sort) |
| `get_product_details` | one product's description, sizes, stock, rating |
| `get_cart` | the user's cart and total |
| `get_saved_addresses` | the user's addresses |
| `get_orders` | the user's last 10 orders |

**Client actions** - the app performs them, then tells the backend what happened:

| Tool | The app... |
|---|---|
| `navigate` | opens a screen/page (product, cart, orders, sign-in, ...) |
| `add_to_cart` | adds the product to the cart (works for guests too) |
| `show_address_form` | shows an address form in the chat; Save creates the address |
| `confirm_order` | shows the order summary; Confirm places it (card -> Stripe's secure page) |

## One chat turn, step by step

```
app  ──POST /api/chat {message}──►  controller
                                     │ load/create ChatSession
                                     ▼
                                  provider.run()  ◄──────────────┐
                                     │ ask the AI                │
                                     ▼                           │
                       AI wants tools? ── no ──► reply to app    │
                                     │ yes                       │
                                     ▼                           │
                     toolRunner: server tools run now ───────────┘ (results sent back to the AI)
                                     │
                         client actions? ── yes ──► reply {actions} to app, chat PAUSES
                                                     app does them, then
app  ──POST /api/chat {actionResults}──► chat RESUMES with those results
```

## Safety rules built in
- No tool takes a user id, so the AI can only ever see/change the signed-in user's own data.
- All tool inputs are validated; ids are checked; search text is regex-escaped.
- The AI never handles card details - card payment always happens on Stripe's hosted page.
- Max 40 messages per chat and 6 AI round-trips per request (cost/quota guard).
- API keys live only on the backend (`.env` locally, Lambda environment variables in production).
