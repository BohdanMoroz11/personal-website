import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  blockedRecord,
  blockingPeers,
  decideBlockedWake,
  dependencies,
  encodeBlockedRecord,
  latestBlockedVerdict,
  lockedVersion,
  majorTarget,
} from "./major-dep-blocked-state.mjs";
import { latestVerdict } from "./major-dep-retry-state.mjs";

const run = promisify(execFile);
const [mode, number, expectedSha] = process.argv.slice(2);
const repo = process.env.GITHUB_REPOSITORY;
const owner = repo?.split("/")[0];
if (!repo || !number || !["capture", "scan", "inspect"].includes(mode)) {
  throw new Error(
    "Usage: major-dep-blocked-controller.mjs <capture|scan|inspect> <PR> [expected-head-sha]",
  );
}

async function command(file, args) {
  const env = file === "npm" ? { ...process.env, GH_TOKEN: "" } : process.env;
  const { stdout } = await run(file, args, { maxBuffer: 4 * 1024 * 1024, env });
  return stdout.trim();
}

async function gh(...args) {
  return command("gh", args);
}

async function prView() {
  return JSON.parse(
    await gh(
      "pr",
      "view",
      number,
      "--repo",
      repo,
      "--json",
      "state,headRefOid,baseRefOid,labels,comments",
    ),
  );
}

async function fileAt(name, sha) {
  const content = await gh(
    "api",
    `repos/${repo}/contents/${name}?ref=${sha}`,
    "-H",
    "Accept: application/vnd.github.raw",
  );
  return JSON.parse(content);
}

async function metadata(name) {
  const raw = await command("npm", [
    "view",
    `${name}@latest`,
    "version",
    "peerDependencies",
    "--json",
  ]);
  return JSON.parse(raw);
}

async function metadataFor(names) {
  const result = {};
  // Limit concurrent registry requests so a blocked PR does not create a burst.
  for (let start = 0; start < names.length; start += 6) {
    const entries = await Promise.all(
      names.slice(start, start + 6).map(async (name) => [name, await metadata(name)]),
    );
    Object.assign(result, Object.fromEntries(entries));
  }
  return result;
}

async function capture(pr, verdict, allowEmpty) {
  const existing = blockedRecord(pr.comments, owner, verdict);
  if (existing) return existing;

  const [basePkg, verdictPkg, verdictLock] = await Promise.all([
    fileAt("package.json", pr.baseRefOid),
    fileAt("package.json", verdict.sha),
    fileAt("package-lock.json", verdict.sha),
  ]);
  const target = majorTarget(basePkg, verdictPkg);
  target.lockedVersion = lockedVersion(verdictLock, target.name);
  const names = Object.keys(dependencies(verdictPkg)).filter((name) => name !== target.name);
  const blockers = blockingPeers(target, await metadataFor(names));
  if (!allowEmpty && blockers.length === 0) {
    throw new Error(`BLOCKED verdict for ${target.name} has no incompatible latest direct peer`);
  }
  const record = { version: 1, verdictSha: verdict.sha, verdictId: verdict.id, target, blockers };
  if (mode !== "inspect") {
    await gh(
      "pr",
      "comment",
      number,
      "--repo",
      repo,
      "--body",
      `${encodeBlockedRecord(record)}\nRecorded blocker snapshot for \`${target.name}@${target.spec}\`: ${blockers.length ? blockers.map((blocker) => `\`${blocker.name}@${blocker.version}\` requires \`${blocker.peerRange}\``).join("; ") : "all known peer blockers are now compatible"}.`,
    );
  }
  console.log(
    `${mode === "inspect" ? "Computed" : "Recorded"} blocked state for PR #${number} at ${verdict.sha}.`,
  );
  return record;
}

const pr = await prView();
if (pr.state !== "OPEN" || !pr.labels.some((label) => label.name === "dep:blocked")) {
  console.log(`PR #${number} is not an open blocked PR; skipping.`);
  process.exit(0);
}
if (expectedSha && pr.headRefOid !== expectedSha) {
  console.log(`PR #${number} moved from ${expectedSha} to ${pr.headRefOid}; skipping stale scan.`);
  process.exit(0);
}
const currentVerdict = latestVerdict(pr.comments, owner);
const blocked = latestBlockedVerdict(pr.comments, owner);
if (!blocked || currentVerdict?.verdict !== "BLOCKED" || currentVerdict.sha !== blocked.sha) {
  throw new Error(`PR #${number} is labeled blocked without a current BLOCKED verdict record`);
}

const record = await capture(pr, blocked, mode !== "capture");
if (mode === "capture") process.exit(0);

const [headPkg, headLock] = await Promise.all([
  fileAt("package.json", pr.headRefOid),
  fileAt("package-lock.json", pr.headRefOid),
]);
const peers = await metadataFor(
  record.blockers.map((blocker) => blocker.name).filter((name) => dependencies(headPkg)[name]),
);
const decision = decideBlockedWake(record, headPkg, headLock, peers);
if (!decision.wake) {
  console.log(`PR #${number} remains blocked: ${decision.reason}.`);
  process.exit(0);
}
const marker = `<!-- dep-wakeup:v1:${blocked.id}:${pr.headRefOid} -->`;
if (
  pr.comments.some((comment) => comment.author?.login === owner && comment.body.startsWith(marker))
) {
  console.log(`PR #${number} was already dispatched for this verdict and head.`);
  process.exit(0);
}
if (mode === "inspect") {
  console.log(`PR #${number} would wake: ${decision.reason}.`);
  process.exit(0);
}

const fresh = await prView();
if (
  fresh.headRefOid !== pr.headRefOid ||
  !fresh.labels.some((label) => label.name === "dep:blocked")
) {
  console.log(`PR #${number} changed during scan; skipping wake-up.`);
  process.exit(0);
}

// Dispatch first: if this step fails, the blocked label remains for the next scan.
await gh("workflow", "run", "major-dep-agent.yml", "--repo", repo, "-f", `pr_number=${number}`);
await gh("api", "-X", "DELETE", `repos/${repo}/issues/${number}/labels/dep:blocked`);
if (
  !fresh.comments.some(
    (comment) => comment.author?.login === owner && comment.body.startsWith(marker),
  )
) {
  await gh(
    "pr",
    "comment",
    number,
    "--repo",
    repo,
    "--body",
    `${marker}\n🔄 Rechecking the major update: ${decision.reason}.`,
  );
}
console.log(`Woke PR #${number}: ${decision.reason}.`);
