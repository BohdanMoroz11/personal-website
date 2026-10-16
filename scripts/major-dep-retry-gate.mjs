import { execFileSync } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";
import { decideRetry } from "./major-dep-retry-state.mjs";
import { trustedCommentAuthors, validateMajorPr } from "./major-dep-trust.mjs";

const repo = process.env.GITHUB_REPOSITORY;
const authors = trustedCommentAuthors(repo, process.env.DEP_AGENT_APP_SLUG);
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const eventName = process.env.GITHUB_EVENT_NAME;

function gh(...args) {
  return JSON.parse(execFileSync("gh", args, { encoding: "utf8" }));
}

function output(values) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(""),
  );
}

function skip(reason) {
  console.log(`Skipping retry: ${reason}.`);
  output({ skip: true });
}

let prNumber;
let expectedSha;
let expectedBranch;
let runId;

if (eventName === "workflow_run") {
  const run = event.workflow_run;
  if (run.conclusion !== "failure" || !run.head_branch.startsWith("renovate/")) {
    skip("not a failed Renovate CI run");
    process.exit(0);
  }
  expectedSha = run.head_sha;
  expectedBranch = run.head_branch;
  runId = String(run.id);
  const prs = gh("api", `repos/${repo}/commits/${expectedSha}/pulls`);
  prNumber = prs.find((pr) => pr.state === "open" && pr.head?.ref === expectedBranch)?.number;
} else if (eventName === "workflow_dispatch") {
  ({
    pr_number: prNumber,
    head_sha: expectedSha,
    head_branch: expectedBranch,
    ci_run_id: runId,
  } = event.inputs);
  const run = gh("api", `repos/${repo}/actions/runs/${runId}`);
  if (
    run.name !== "CI" ||
    run.conclusion !== "failure" ||
    run.head_sha !== expectedSha ||
    run.head_branch !== expectedBranch
  ) {
    skip("dispatch does not identify a failed CI run for this head");
    process.exit(0);
  }
} else {
  throw new Error(`Unsupported event: ${eventName}`);
}

if (!prNumber) {
  skip("no matching open PR");
  process.exit(0);
}
if (!expectedBranch.startsWith("renovate/")) {
  skip("not a Renovate branch");
  process.exit(0);
}

const restPr = gh("api", `repos/${repo}/pulls/${prNumber}`);
const trustReason = validateMajorPr(restPr, {
  repository: repo,
  expectedSha,
  expectedBranch,
});
if (trustReason) {
  skip(`untrusted PR: ${trustReason}`);
  process.exit(0);
}

const pr = gh(
  "pr",
  "view",
  String(prNumber),
  "--repo",
  repo,
  "--json",
  "state,headRefName,headRefOid,labels,comments",
);
if (pr.state !== "OPEN" || pr.headRefName !== expectedBranch) {
  skip("PR is closed or now points to a different branch");
  process.exit(0);
}

const decision = decideRetry({
  comments: pr.comments,
  owner: authors,
  labels: pr.labels.map((label) => label.name),
  currentSha: pr.headRefOid,
  eventSha: expectedSha,
  runId: String(runId),
});

if (!decision.attempt) {
  skip(decision.reason);
  process.exit(0);
}

console.log(`CI retry attempt ${decision.attempt} for PR #${prNumber} at ${expectedSha}.`);
output({
  skip: false,
  pr_number: prNumber,
  head_sha: expectedSha,
  head_branch: expectedBranch,
  run_id: runId,
  attempt: decision.attempt,
  review_sha: decision.reviewSha,
});
