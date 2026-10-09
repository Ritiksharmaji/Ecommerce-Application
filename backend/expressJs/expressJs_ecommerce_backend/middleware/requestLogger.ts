import { Request, Response, NextFunction } from "express";

// Fields whose values are never printed in full
const SECRET_KEYS = ["password", "token", "secret"];

// Describes a password without revealing it: length, first/last char, and anything
// a phone keyboard might have changed (spaces, capitals, non-ASCII characters).
export const describePassword = (pw: unknown) => {
    if (typeof pw !== "string") return `<${typeof pw}>`;
    const masked = pw.length <= 2 ? "*".repeat(pw.length) : pw[0] + "*".repeat(pw.length - 2) + pw[pw.length - 1];
    const notes = [];
    if (pw !== pw.trim()) notes.push("HAS LEADING/TRAILING SPACE");
    if (/[^\x20-\x7E]/.test(pw)) notes.push("HAS NON-ASCII CHARS (smart quotes/autocorrect?)");
    return `"${masked}" (length ${pw.length}${notes.length ? ", " + notes.join(", ") : ""})`;
};

const sanitize = (body: any) => {
    if (!body || typeof body !== "object" || Buffer.isBuffer(body)) return body;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
        out[k] = SECRET_KEYS.some((s) => k.toLowerCase().includes(s)) ? (k === "password" ? describePassword(v) : "<hidden>") : v;
    }
    return out;
};

// Logs every request: method, path, status, duration, caller and (sanitized) JSON body.
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
        const body = req.body && Object.keys(req.body).length ? " body=" + JSON.stringify(sanitize(req.body)) : "";
        const who = req.user ? ` user=${req.user.email}(${req.user.role})` : "";
        console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - start}ms from ${req.ip}${who}${body}`);
    });
    next();
};
