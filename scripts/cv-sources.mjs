import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Source files the generated `public/cv.pdf` is rendered from. If any of these
 * change, the committed PDF is stale and `npm run cv:pdf` must be re-run.
 * Over-triggering (e.g. on a comment-only edit) is intentional: a needless
 * regen is cheap, shipping a stale PDF is not.
 */
export const CV_SOURCE_FILES = [
  "src/cv/data.ts",
  "src/pages/cv.astro",
  "src/layouts/CvLayout.astro",
  "src/styles/cv.css",
];

/** Fingerprint written by `build-cv.mjs`, verified by `check-cv-fresh.mjs`. */
export const CV_HASH_FILE = resolve(root, "scripts/cv-pdf.hash");

/** SHA-256 over the CV source files — order-stable and path-tagged. */
export function computeCvSourceHash() {
  const hash = createHash("sha256");
  for (const rel of CV_SOURCE_FILES) {
    hash.update(rel + "\0");
    hash.update(readFileSync(resolve(root, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
