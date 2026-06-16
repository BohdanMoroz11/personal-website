#!/usr/bin/env node
/**
 * CI guard for the committed `public/cv.pdf`.
 *
 * The PDF is a checked-in artifact (the Alpine Docker build that deploys the
 * site has no Chromium, so it can't regenerate it). This guard makes sure that
 * artifact is a valid, single-page PDF and is still in sync with the source it
 * was rendered from — catching the "edited the CV, forgot to re-run the
 * generator" drift.
 *
 * Fix a failure with:  npm run cv:pdf
 * then commit public/cv.pdf + scripts/cv-pdf.hash.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { computeCvSourceHash, CV_HASH_FILE } from "./cv-sources.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PDF = resolve(root, "public/cv.pdf");

function fail(msg) {
  console.error(`✗ cv:check — ${msg}`);
  console.error("  → run `npm run cv:pdf`, then commit public/cv.pdf + scripts/cv-pdf.hash");
  process.exit(1);
}

if (!existsSync(PDF)) fail("public/cv.pdf is missing");

const buf = readFileSync(PDF);
if (buf.byteLength < 1000) fail(`public/cv.pdf is suspiciously small (${buf.byteLength} bytes)`);
if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") fail("public/cv.pdf is not a PDF");

const count = buf.toString("latin1").match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/);
if (!count) fail("could not read a page count from public/cv.pdf");
if (count[1] !== "1") fail(`CV should be a single page, found ${count[1]} — trim the content`);

if (!existsSync(CV_HASH_FILE)) fail("scripts/cv-pdf.hash is missing");
const stored = readFileSync(CV_HASH_FILE, "utf8").trim();
if (stored !== computeCvSourceHash()) fail("CV sources changed since the PDF was last generated");

console.log("✓ cv:check — public/cv.pdf is a valid single-page PDF and up to date");
