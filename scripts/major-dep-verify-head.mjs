import { execFileSync } from "node:child_process";
import { validateMajorPr } from "./major-dep-trust.mjs";

const [number, expectedSha, expectedBranch] = process.argv.slice(2);
const repo = process.env.GITHUB_REPOSITORY;
if (!repo || !number || !expectedSha || !expectedBranch) {
  throw new Error("Usage: major-dep-verify-head.mjs <PR> <SHA> <branch>");
}
const pr = JSON.parse(
  execFileSync("gh", ["api", `repos/${repo}/pulls/${number}`], { encoding: "utf8" }),
);
const reason = validateMajorPr(pr, {
  repository: repo,
  expectedSha,
  expectedBranch,
});
if (reason) {
  console.error(`::error::Major dependency head check rejected PR #${number}: ${reason}.`);
  process.exit(1);
}
console.log(`PR #${number} remains trusted at ${expectedSha}.`);
