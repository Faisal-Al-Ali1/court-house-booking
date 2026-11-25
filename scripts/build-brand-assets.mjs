import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BRAND = ROOT + "brand/";
const PUBLIC = ROOT + "public/";
const BRAND_RED = "#a32731";

mkdirSync(PUBLIC, { recursive: true });

const built = {};

async function emit(name, pipeline) {
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  writeFileSync(PUBLIC + name, data);
  built[name] = `${info.width}x${info.height}, ${Math.round(data.length / 1024)}KB`;
}

await emit(
  "logo-lockup-light.webp",
  sharp(BRAND + "lockup-light.webp").trim().resize({ width: 960 }).webp({ quality: 92 }),
);

await emit(
  "logo-lockup.webp",
  sharp(BRAND + "lockup.webp").trim().resize({ width: 960 }).webp({ quality: 92 }),
);

await emit(
  "logo-email.png",
  sharp(BRAND + "lockup.webp").trim().resize({ width: 400 }).png({ compressionLevel: 9 }),
);

await emit(
  "backdrop.webp",
  sharp(BRAND + "envelope.jpg").resize({ width: 1600 }).webp({ quality: 70 }),
);

const mark = await sharp(BRAND + "mark-light.png")
  .trim()
  .resize(320, 320, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

const icon = await sharp({
  create: { width: 512, height: 512, channels: 4, background: BRAND_RED },
})
  .composite([{ input: mark, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(ROOT + "src/app/icon.png", icon);
built["src/app/icon.png"] = `512x512, ${Math.round(icon.length / 1024)}KB`;

for (const [name, detail] of Object.entries(built)) {
  console.log(`${name}: ${detail}`);
}
