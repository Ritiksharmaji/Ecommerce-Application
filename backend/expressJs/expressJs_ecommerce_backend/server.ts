// Local / server entry point: `npm start` (tsx) or `node dist/server.js` after `npm run build`.
// AWS Lambda uses lambda.ts instead.
import "dotenv/config";
import app from "./app.js";
import { ensureReady } from "./config/startup.js";

try {
    await ensureReady();
} catch {
    process.exit(1);
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
