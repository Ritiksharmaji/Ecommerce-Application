// AWS Lambda entry point (handler: index.handler in the bundled lambda.zip).
// Build with `npm run build:lambda`. Configuration comes from the function's environment variables.
import serverless from "serverless-http";
import type { Context } from "aws-lambda";
import app from "./app.js";
import { ensureReady } from "./config/startup.js";

const expressHandler = serverless(app, {
    // serverless-http hands Express a request that already looks fully read (a fake socket with
    // readable=false and req.body pre-set), so Express 5's body parsers skip it and req.body stays
    // empty. Mark it unread so express.json(), express.raw() (Stripe) and multer parse it normally.
    request: (req: any) => {
        req.socket.readable = true;
        req.body = undefined;
        // The fake socket has no event methods; Express helpers that wait on it would crash
        const noop = () => req.socket;
        for (const m of ["on", "once", "off", "addListener", "removeListener"]) req.socket[m] ??= noop;
    },
});

export const handler = async (event: any, context: Context) => {
    // Return as soon as the response is ready; keep the MongoDB connection open for the next request
    context.callbackWaitsForEmptyEventLoop = false;
    await ensureReady();
    return expressHandler(event, context);
};
