// Renders every icon asset from the master SVGs in this folder.
//   node scripts/icon/render.mjs
// Requires: sharp (already a dependency) + ImageMagick `magick` on PATH (for .ico).
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const pub = join(root, "public");
const icons = join(pub, "icons");
const tmp = join(here, ".tmp");
mkdirSync(icons, { recursive: true });
mkdirSync(tmp, { recursive: true });

const roundedSvg = join(here, "icon.svg");
const fullSvg = join(here, "icon-fullbleed.svg");
const ogSvg = join(here, "og.svg");

// Rasterize a 100x100 SVG crisply by rendering at a high DPI, not by upscaling.
const rasterSquare = (src, px) =>
  sharp(src, { density: Math.ceil((72 * px) / 100) })
    .resize(px, px)
    .png()
    .toBuffer();

// Downscale a high-res master buffer to a target size (high-quality).
const save = (buf, size, file) =>
  sharp(buf).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// icon.svg is transparent + theme-adaptive; rasterizers render its LIGHT colors.
// For the static PNG/ICO favicons we flatten onto white so they have a solid tile.
const roundedMaster = await rasterSquare(roundedSvg, 1024);
const roundedWhite = await sharp(roundedMaster)
  .flatten({ background: "#ffffff" })
  .png()
  .toBuffer();
const fullMaster = await rasterSquare(fullSvg, 1024);

// purpose:any + general PNG icons (white tile)
await save(roundedWhite, 512, join(icons, "icon-512.png"));
await save(roundedWhite, 192, join(icons, "icon-192.png"));

// Multi-resolution favicon.ico (16/32/48) assembled by ImageMagick
const f16 = join(tmp, "f16.png");
const f32 = join(tmp, "f32.png");
const f48 = join(tmp, "f48.png");
await save(roundedWhite, 16, f16);
await save(roundedWhite, 32, f32);
await save(roundedWhite, 48, f48);
execFileSync("magick", [f16, f32, f48, join(pub, "favicon.ico")]);

// maskable (Android) + apple-touch icons (full-bleed white, opaque)
await save(fullMaster, 512, join(icons, "icon-maskable-512.png"));
await save(fullMaster, 192, join(icons, "icon-maskable-192.png"));
await save(fullMaster, 180, join(icons, "icon-apple-180.png"));
await save(fullMaster, 180, join(pub, "apple-touch-icon.png"));

// Open Graph / Twitter card image (1200x630)
await sharp(ogSvg, { density: 96 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(join(pub, "og-image.png"));

// Ship the transparent, theme-adaptive SVG favicon
copyFileSync(roundedSvg, join(pub, "icon.svg"));

rmSync(tmp, { recursive: true, force: true });
console.log("Icon assets written to public/ and public/icons/");
