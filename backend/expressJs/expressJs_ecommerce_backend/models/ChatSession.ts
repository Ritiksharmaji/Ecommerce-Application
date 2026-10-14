import mongoose from "mongoose";

/**
 * One shopping-assistant conversation. The full Claude message history is kept server-side (append-only,
 * content blocks stored exactly as returned) so the app never handles or edits it.
 */
const chatSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
        /** AI that owns this history ("gemini" | "claude"); each stores messages in its own format. */
        provider: { type: String, default: "claude" },
        /** Provider-format messages (Gemini Content[] or Claude MessageParam[]) - stored verbatim. */
        messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
        /** Tool calls waiting for the app (client actions) plus server results to send with them. */
        pending: {
            type: {
                clientActions: [{ _id: false, id: String, name: String, input: mongoose.Schema.Types.Mixed }],
                serverResults: [mongoose.Schema.Types.Mixed],
            },
            default: null,
        },
        turns: { type: Number, default: 0 },
    },
    { timestamps: true, minimize: false }
);

// Conversations expire 7 days after the last message.
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model("ChatSession", chatSessionSchema);
