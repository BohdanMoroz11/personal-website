#!/usr/bin/env node
/**
 * Render the /cv route to a real (vector, selectable-text) PDF at
 * public/cv.pdf.
 *
 * `public/cv.pdf` is a committed artifact, so the normal `astro build` (used by
 * CI/deploy) ships it without needing Playwright. Re-run this script whenever
 * the CV content or styling changes:  `npm run cv:pdf`.
 *
 * Pipeline: astro build → astro preview (serves dist/) → Chromium page.pdf().
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { computeCvSourceHash, CV_HASH_FILE } from "./cv-sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const PORT = 4329;
const URL = `http://localhost:${PORT}/cv`;
const OUT = resolve(root, "public/cv.pdf");

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: false });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
    p.on("error", rej);
  });
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.ok || r.status === 404) return;
    } catch {
      /* not up yet */
    }
    await sleep(300);
  }
  throw new Error(`Preview server did not start within ${timeoutMs}ms`);
}

let preview;
try {
  console.log("› building site…");
  await run("npx", ["astro", "build"]);

  console.log("› starting preview server…");
  preview = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  preview.on("error", (e) => {
    throw e;
  });

  await waitForServer(URL);

  console.log("› rendering /cv → public/cv.pdf …");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  // Ensure web fonts are fully loaded before snapshotting to PDF.
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await browser.close();

  // Fingerprint the sources so CI (`npm run cv:check`) can flag a stale PDF.
  writeFileSync(CV_HASH_FILE, computeCvSourceHash() + "\n");

  console.log(`✓ wrote ${OUT}`);
  console.log(`✓ wrote ${CV_HASH_FILE}`);
} finally {
  if (preview && !preview.killed) {
    preview.kill("SIGTERM");
    // Give it a moment to release the port.
    await Promise.race([once(preview, "exit"), sleep(2000)]);
  }
}
