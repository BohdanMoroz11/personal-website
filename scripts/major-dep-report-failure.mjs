import { execFileSync } from "node:child_process";
import { trustedCommentAuthors, validateMajorPr } from "./major-dep-trust.mjs";

const [number, runId, kind] = process.argv.slice(2);
const repo = process.env.GITHUB_REPOSITORY;
if (
  !repo ||
  !/^[1-9][0-9]*$/.test(number) ||
  !/^[1-9][0-9]*$/.test(runId) ||
  !["review", "retry"].includes(kind)
) {
  throw new Error("Usage: major-dep-report-failure.mjs <PR> <run-id> <review|retry>");
}

function gh(...args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

const pr = JSON.parse(gh("api", `repos/${repo}/pulls/${number}`));
const reason = validateMajorPr(pr, { repository: repo });
if (reason) {
  console.log(`Skipping failure comment for untrusted PR #${number}: ${reason}.`);
  process.exit(0);
}

const marker = `<!-- dep-agent-workflow-failed:${runId} -->`;
const comments = JSON.parse(
  gh("pr", "view", number, "--repo", repo, "--json", "comments"),
).comments;
const trusted = [
  "github-actions[bot]",
  ...trustedCommentAuthors(repo, process.env.DEP_AGENT_APP_SLUG),
];
if (
  comments.some(
    (comment) =>
      trusted.includes(comment.author?.login) &&
      (comment.body.startsWith(marker) || comment.body.includes(`/actions/runs/${runId}`)),
  )
) {
  console.log(`Failure for run ${runId} was already reported.`);
  process.exit(0);
}

gh(
  "pr",
  "comment",
  number,
  "--repo",
  repo,
  "--body",
  `${marker}\n⚠️ @${repo.split("/")[0]} — the dependency ${kind} workflow failed before completing its checks. See [run ${runId}](${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo}/actions/runs/${runId}).`,
);
