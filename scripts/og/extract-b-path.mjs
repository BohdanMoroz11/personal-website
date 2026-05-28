// One-shot: extract a Chakra Petch glyph as an SVG path so the favicon can embed
// the real shape (favicons can't reliably load web fonts).
//
// Requires temp deps:  npm install --no-save opentype.js wawoff2
// Then:                node scripts/og/extract-b-path.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";

const __dirname = dirname(fileURLToPath(import.meta.url));
const woff2Path = resolve(
  __dirname,
  "../../node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-700-normal.woff2",
);

const woff2Buf = readFileSync(woff2Path);
const ttfBuf = await wawoff2.decompress(woff2Buf);
const font = opentype.parse(ttfBuf.buffer.slice(ttfBuf.byteOffset, ttfBuf.byteOffset + ttfBuf.byteLength));

// Render the B at a known font-size; we'll fit it into the favicon viewBox later.
const fontSize = 100;
const glyph = font.charToGlyph("B");
const path = glyph.getPath(0, 0, fontSize);
const bbox = path.getBoundingBox();

console.log("bbox:", bbox);
console.log("path d:");
console.log(path.toPathData(2));
