// يرندر إطارات ثابتة من نقاط محددة للفحص البصري السريع.
//   node scripts/stills.mjs            → النقاط الافتراضية
//   node scripts/stills.mjs 30 400 900 → إطارات بعينها
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out/stills");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = process.env.REMOTION_BROWSER || null;
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "Promo", browserExecutable });

const frames = process.argv.slice(2).map(Number);
const list = frames.length
  ? frames
  : [20, 60, 125, 160, 200, 330, 450, 520, 600, 690, 790, 860, 950, 1030, 1100, 1180, composition.durationInFrames - 1];

for (const frame of list) {
  const output = path.join(outDir, `${process.env.COMP || "Promo"}-f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, browserExecutable, chromiumOptions: { gl: process.env.GL || "angle" } });
  console.log(output);
}
