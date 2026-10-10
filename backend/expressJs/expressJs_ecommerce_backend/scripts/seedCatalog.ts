/**
 * Seeds the Shopvra demo catalogue (scripts/data/catalog.ts) into MongoDB, with product photos on Cloudinary.
 *
 *   npx tsx scripts/seedCatalog.ts            upload images + upsert products (uses MONGODB_URI and CLOUDINARY_* from .env)
 *   npx tsx scripts/seedCatalog.ts --dry-run  only resolve image sources and print the plan
 *
 * Safe to re-run: images keep fixed Cloudinary public ids (existing ones are not re-uploaded) and products are
 * matched by name. Products from the old demo seed (images on raw.githubusercontent.com) are removed; products
 * created in the admin panel are left untouched.
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { CATALOG, type CatalogItem } from "./data/catalog.js";

const DRY_RUN = process.argv.includes("--dry-run");
const CLOUDINARY_FOLDER = "ecommerce-app/catalog";
const UPLOAD_CONCURRENCY = 4;
const WEB_ASSETS = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../frontend/webapp_ecommerce_app/src/assets"
);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const slugify = (s: string) =>
    s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** "dummy:<category>:<title>" -> image URLs, loaded once per category from the DummyJSON API. */
const dummyCache = new Map<string, Map<string, string[]>>();
async function dummyImages(category: string, title: string): Promise<string[]> {
    if (!dummyCache.has(category)) {
        const res = await fetch(`https://dummyjson.com/products/category/${category}?limit=0&select=title,images`);
        const data = (await res.json()) as { products: { title: string; images: string[] }[] };
        dummyCache.set(category, new Map(data.products.map((p) => [p.title, p.images])));
    }
    const images = dummyCache.get(category)!.get(title);
    if (!images?.length) throw new Error(`DummyJSON product not found: ${category} / ${title}`);
    return images;
}

/** Unsplash download links redirect to the image CDN; Cloudinary needs the final URL. */
async function unsplashUrl(photoId: string): Promise<string> {
    for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(`https://unsplash.com/photos/${photoId}/download?w=1200`, {
            redirect: "manual",
            headers: { "User-Agent": "Mozilla/5.0 (Shopvra catalogue seed)" },
        });
        const location = res.headers.get("location");
        if (location?.startsWith("https://images.unsplash.com/")) return location;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    throw new Error(`Unsplash photo unavailable: ${photoId}`);
}

/** Source file paths / URLs to upload for one product. */
async function resolveSources(item: CatalogItem): Promise<string[]> {
    const sources: string[] = [];
    for (const ref of item.images) {
        const [kind, ...rest] = ref.split(":");
        if (kind === "local") sources.push(path.join(WEB_ASSETS, `${rest[0]}.png`));
        else if (kind === "unsplash") sources.push(await unsplashUrl(rest[0]));
        else if (kind === "dummy") sources.push(...(await dummyImages(rest[0], rest.slice(1).join(":"))));
        else throw new Error(`Unknown image source "${ref}" (${item.name})`);
    }
    return sources;
}

/** Upload (or reuse) one image and return a delivery URL: white background, JPEG, max 1000 px, auto quality. */
async function uploadImage(source: string, publicId: string): Promise<string> {
    const result = await cloudinary.uploader.upload(source, {
        folder: CLOUDINARY_FOLDER,
        public_id: publicId,
        overwrite: false,
        unique_filename: false,
        resource_type: "image",
    });
    return result.secure_url
        .replace("/upload/", "/upload/b_white,c_limit,w_1000,q_auto/")
        .replace(/\.(png|webp|jpe?g|avif)$/i, ".jpg");
}

/** Run async tasks with limited parallelism. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: limit }, async () => {
            while (next < items.length) {
                const i = next++;
                results[i] = await fn(items[i], i);
            }
        })
    );
    return results;
}

/** Interleave categories so "latest" products are a mix, then spread creation dates over the past ~30 days. */
function withCreationDates(items: CatalogItem[]): { item: CatalogItem; createdAt: Date }[] {
    const byCategory = new Map<string, CatalogItem[]>();
    for (const item of items) byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
    const queues = [...byCategory.values()];
    const ordered: CatalogItem[] = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) ordered.push(q.shift()!);
    const now = Date.now();
    return ordered.map((item, i) => ({ item, createdAt: new Date(now - i * 6 * 60 * 60 * 1000) }));
}

async function main() {
    const counts = CATALOG.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {});
    console.log(`Catalogue: ${CATALOG.length} products`, counts);

    const names = new Set<string>();
    for (const p of CATALOG) {
        if (names.has(p.name)) throw new Error(`Duplicate product name: ${p.name}`);
        names.add(p.name);
    }

    if (!DRY_RUN) {
        if (!process.env.MONGODB_URI || !process.env.CLOUDINARY_CLOUD_NAME) throw new Error("MONGODB_URI / CLOUDINARY_* missing in .env");
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        console.log("[DB] connected");
    }

    let imageCount = 0;
    const planned = withCreationDates(CATALOG);
    await mapLimit(planned, UPLOAD_CONCURRENCY, async ({ item, createdAt }, i) => {
        const sources = await resolveSources(item);
        if (DRY_RUN) {
            console.log(`${String(i + 1).padStart(3)} [${item.category}] ${item.name} - ${sources.length} image(s)`);
            return;
        }
        const slug = slugify(item.name);
        const images: string[] = [];
        for (const [n, src] of sources.entries()) images.push(await uploadImage(src, `${slug}-${n + 1}`));
        imageCount += images.length;

        await Product.findOneAndUpdate(
            { name: item.name },
            {
                $set: {
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    ...(item.comparePrice ? { comparePrice: item.comparePrice } : {}),
                    images,
                    sizes: item.sizes,
                    category: item.category,
                    stock: item.stock,
                    ratings: { average: item.rating[0], count: item.rating[1] },
                    isFeatured: !!item.featured,
                    isActive: true,
                    createdAt,
                    updatedAt: new Date(),
                },
                ...(item.comparePrice ? {} : { $unset: { comparePrice: 1 } }),
            },
            { upsert: true, timestamps: false, strict: false }
        );
        console.log(`${String(i + 1).padStart(3)}/${planned.length} ✓ [${item.category}] ${item.name} (${images.length} img)`);
    });

    if (!DRY_RUN) {
        const removed = await Product.deleteMany({ images: { $elemMatch: { $regex: "raw\\.githubusercontent\\.com" } } });
        const total = await Product.countDocuments();
        console.log(`\nDone: ${CATALOG.length} products upserted, ${imageCount} images, ${removed.deletedCount} old demo products removed.`);
        console.log(`Products in database now: ${total}`);
        await mongoose.disconnect();
    }
}

main().catch(async (err) => {
    console.error("Seed failed:", err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
