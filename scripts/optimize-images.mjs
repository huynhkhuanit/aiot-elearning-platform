/**
 * Image optimization for static assets in /public.
 *
 * Reduces:
 *   - codesense-ai-logo.png  365KB → ~5–15KB (PNG keep + WebP)
 *   - not_found_img.jpg 1.2MB → ~50–80KB
 *   - favicon.ico 360KB → ~5–10KB (multi-size 16/32/48)
 *
 * Run once: node scripts/optimize-images.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");

function fmtKB(bytes) {
    return (bytes / 1024).toFixed(1) + " KB";
}

async function optimizePng(srcRel, opts = {}) {
    const src = path.join(PUBLIC, srcRel);
    const before = (await fs.stat(src)).size;
    const buf = await fs.readFile(src);
    const out = await sharp(buf)
        .resize({
            width: opts.maxWidth ?? null,
            height: opts.maxHeight ?? null,
            withoutEnlargement: true,
            fit: "inside",
        })
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toBuffer();
    if (out.length < before) {
        await fs.writeFile(src, out);
        console.log(
            `[png] ${srcRel}: ${fmtKB(before)} → ${fmtKB(out.length)} (saved ${fmtKB(before - out.length)})`,
        );
    } else {
        console.log(`[png] ${srcRel}: skip — output ${fmtKB(out.length)} ≥ ${fmtKB(before)}`);
    }

    // Also generate a WebP sibling for use in markup if desired
    const webpName = srcRel.replace(/\.png$/i, ".webp");
    const webpDest = path.join(PUBLIC, webpName);
    const webp = await sharp(buf)
        .resize({
            width: opts.maxWidth ?? null,
            height: opts.maxHeight ?? null,
            withoutEnlargement: true,
            fit: "inside",
        })
        .webp({ quality: 85, effort: 6 })
        .toBuffer();
    await fs.writeFile(webpDest, webp);
    console.log(`[webp] ${webpName}: ${fmtKB(webp.length)}`);
}

async function optimizeJpg(srcRel, opts = {}) {
    const src = path.join(PUBLIC, srcRel);
    const before = (await fs.stat(src)).size;
    const buf = await fs.readFile(src);
    const out = await sharp(buf)
        .resize({
            width: opts.maxWidth ?? 1600,
            height: opts.maxHeight ?? null,
            withoutEnlargement: true,
            fit: "inside",
        })
        .jpeg({ quality: 78, mozjpeg: true, progressive: true })
        .toBuffer();
    if (out.length < before) {
        await fs.writeFile(src, out);
        console.log(
            `[jpg] ${srcRel}: ${fmtKB(before)} → ${fmtKB(out.length)} (saved ${fmtKB(before - out.length)})`,
        );
    } else {
        console.log(`[jpg] ${srcRel}: skip — output ${fmtKB(out.length)} ≥ ${fmtKB(before)}`);
    }

    // Also generate a WebP sibling
    const webpName = srcRel.replace(/\.jpe?g$/i, ".webp");
    const webpDest = path.join(PUBLIC, webpName);
    const webp = await sharp(buf)
        .resize({
            width: opts.maxWidth ?? 1600,
            height: opts.maxHeight ?? null,
            withoutEnlargement: true,
            fit: "inside",
        })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();
    await fs.writeFile(webpDest, webp);
    console.log(`[webp] ${webpName}: ${fmtKB(webp.length)}`);
}

async function optimizeFavicon() {
    // Use Next.js native `app/icon.png` convention instead of ICO
    // (Turbopack has stricter ICO decoder than webpack). Next will
    // auto-generate multi-size meta tags from this single PNG.
    const logo = path.join(PUBLIC, "assets", "img", "codesense-ai-logo.png");
    const iconDest = path.join(APP, "icon.png");
    const oldFavicon = path.join(APP, "favicon.ico");

    const buf = await fs.readFile(logo);
    const png = await sharp(buf)
        .resize(64, 64, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .png({ compressionLevel: 9, palette: false, force: true })
        .toBuffer();
    await fs.writeFile(iconDest, png);
    console.log(`[icon] app/icon.png: ${fmtKB(png.length)}`);

    // Remove the legacy big favicon.ico if it exists.
    try {
        const before = (await fs.stat(oldFavicon)).size;
        if (before > 50 * 1024) {
            await fs.unlink(oldFavicon);
            console.log(
                `[ico] removed legacy favicon.ico (was ${fmtKB(before)})`,
            );
        }
    } catch {
        // file already gone — nothing to do
    }
}

/**
 * Minimal ICO builder for embedded PNG entries.
 * Spec: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(entries) {
    const headerSize = 6;
    const dirEntrySize = 16;
    const totalDir = headerSize + dirEntrySize * entries.length;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type 1 = icon
    header.writeUInt16LE(entries.length, 4);

    const dir = Buffer.alloc(dirEntrySize * entries.length);
    let offset = totalDir;
    entries.forEach((e, i) => {
        const o = i * dirEntrySize;
        dir.writeUInt8(e.size === 256 ? 0 : e.size, o + 0); // width
        dir.writeUInt8(e.size === 256 ? 0 : e.size, o + 1); // height
        dir.writeUInt8(0, o + 2); // colors
        dir.writeUInt8(0, o + 3); // reserved
        dir.writeUInt16LE(1, o + 4); // planes
        dir.writeUInt16LE(32, o + 6); // bpp
        dir.writeUInt32LE(e.data.length, o + 8); // size
        dir.writeUInt32LE(offset, o + 12); // offset
        offset += e.data.length;
    });

    return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function main() {
    console.log("--- optimize-images ---");
    await optimizePng("assets/img/codesense-ai-logo.png", {
        maxWidth: 256,
        maxHeight: 256,
    });
    await optimizeJpg("assets/img/not_found_img.jpg", { maxWidth: 1200 });
    await optimizeFavicon();
    console.log("--- done ---");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
