// Bundles lambda.ts and all dependencies into one file and zips it for AWS Lambda.
// Usage: npm run build:lambda  ->  lambda.zip (upload it; handler = index.handler, runtime Node.js 22.x)
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { rmSync, mkdirSync, statSync } from "node:fs";

const outDir = "dist-lambda";
rmSync(outDir, { recursive: true, force: true });
rmSync("lambda.zip", { force: true });
mkdirSync(outDir);

await build({
    entryPoints: ["lambda.ts"],
    outfile: `${outDir}/index.mjs`,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    minify: true,
    sourcemap: false,
    // Some dependencies are CommonJS and call require(); give the ESM bundle a require()
    banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
    // Optional MongoDB driver add-ons that this app doesn't use
    external: [
        "kerberos", "snappy", "@mongodb-js/zstd", "mongodb-client-encryption", "@aws-sdk/credential-providers",
        "gcp-metadata", "socks", "aws4",
    ],
    logLevel: "warning",
});

execFileSync("zip", ["-q", "-j", "lambda.zip", `${outDir}/index.mjs`]);
const kb = Math.round(statSync("lambda.zip").size / 1024);
console.log(`lambda.zip ready (${kb} KB). Upload it to Lambda; handler: index.handler, runtime: Node.js 22.x`);
