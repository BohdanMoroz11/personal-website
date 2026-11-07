import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { validateMajorPr } from "./major-dep-trust.mjs";

const repo = process.env.GITHUB_REPOSITORY;
const eventName = process.env.GITHUB_EVENT_NAME;
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const number =
  eventName === "workflow_dispatch" ? event.inputs?.pr_number : event.pull_request?.number;
const eventSha = eventName === "pull_request_target" ? event.pull_request?.head?.sha : undefined;
const eventBranch = eventName === "pull_request_target" ? event.pull_request?.head?.ref : undefined;
if (
  !repo ||
  !/^[1-9][0-9]*$/.test(String(number)) ||
  !["pull_request_target", "workflow_dispatch"].includes(eventName)
) {
  throw new Error("Unsupported major-review event or missing PR number");
}

const pr = JSON.parse(
  execFileSync("gh", ["api", `repos/${repo}/pulls/${number}`], { encoding: "utf8" }),
);
const reason = validateMajorPr(pr, {
  repository: repo,
  expectedSha: eventSha,
  expectedBranch: eventBranch,
});
if (reason) {
  console.error(`::error::Major dependency preflight rejected PR #${number}: ${reason}.`);
  process.exit(1);
}

appendFileSync(
  process.env.GITHUB_OUTPUT,
  `number=${number}\nhead_ref=${pr.head.ref}\nhead_sha=${pr.head.sha}\nstarted_at=${new Date().toISOString().slice(0, 19)}Z\n`,
);
console.log(`Trusted Renovate PR #${number} at ${pr.head.sha}.`);
