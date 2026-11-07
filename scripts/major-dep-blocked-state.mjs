import { Buffer } from "node:buffer";
import semver from "semver";

const VERDICT = /^<!-- dep-verdict:BLOCKED:([0-9a-f]{40}) -->/;
const STATE = /^<!-- dep-blocked-state:v1:([0-9a-f]{40}):([A-Za-z0-9_-]+) -->/;

export function dependencies(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
}

export function majorTarget(base, head) {
  const before = dependencies(base);
  const after = dependencies(head);
  const targets = Object.entries(after).flatMap(([name, spec]) => {
    if (!before[name]) return [];
    try {
      const old = semver.minVersion(before[name]);
      const next = semver.minVersion(spec);
      return old && next && next.major > old.major ? [{ name, spec, version: next.version }] : [];
    } catch {
      return []; // A non-semver specifier cannot identify this npm major target.
    }
  });
  if (targets.length !== 1) {
    throw new Error(`Expected one major dependency target, found ${targets.length}`);
  }
  return targets[0];
}

export function lockedVersion(lock, name) {
  return lock?.packages?.[`node_modules/${name}`]?.version ?? null;
}

export function latestBlockedVerdict(comments, owner) {
  const authors = Array.isArray(owner) ? owner : [owner];
  for (let index = comments.length - 1; index >= 0; index--) {
    const comment = comments[index];
    if (!authors.includes(comment.author?.login)) continue;
    const match = VERDICT.exec(comment.body);
    if (match) return { sha: match[1], id: comment.id, index };
  }
  return null;
}

export function blockedRecord(comments, owner, verdict) {
  const authors = Array.isArray(owner) ? owner : [owner];
  for (let index = comments.length - 1; index >= 0; index--) {
    const comment = comments[index];
    if (!authors.includes(comment.author?.login)) continue;
    const match = STATE.exec(comment.body);
    if (!match || match[1] !== verdict.sha) continue;
    try {
      const record = JSON.parse(Buffer.from(match[2], "base64url").toString("utf8"));
      if (
        record.version === 1 &&
        record.verdictSha === verdict.sha &&
        typeof record.verdictId === "string" &&
        record.verdictId === verdict.id &&
        typeof record.target?.name === "string" &&
        typeof record.target?.spec === "string" &&
        semver.valid(record.target?.version) &&
        Array.isArray(record.blockers) &&
        record.blockers.every(
          (blocker) =>
            typeof blocker.name === "string" &&
            typeof blocker.version === "string" &&
            typeof blocker.peerRange === "string",
        )
      ) {
        return record;
      }
    } catch {
      // A malformed comment is not durable state. Continue to an older valid record.
    }
  }
  return null;
}

export function encodeBlockedRecord(record) {
  return `<!-- dep-blocked-state:v1:${record.verdictSha}:${Buffer.from(JSON.stringify(record)).toString("base64url")} -->`;
}

export function blockingPeers(target, metadata) {
  return Object.entries(metadata).flatMap(([name, info]) => {
    const peerRange = info.peerDependencies?.[target.name];
    return peerRange && !semver.satisfies(target.version, peerRange, { includePrerelease: true })
      ? [{ name, version: info.version, peerRange }]
      : [];
  });
}

export function decideBlockedWake(record, headPkg, headLock, currentPeers) {
  const spec = dependencies(headPkg)[record.target.name];
  if (spec !== record.target.spec) return { wake: true, reason: "target specifier changed" };

  const locked = lockedVersion(headLock, record.target.name);
  if (
    locked !== record.target.lockedVersion &&
    semver.valid(locked) &&
    semver.satisfies(locked, spec, { includePrerelease: true })
  ) {
    return { wake: true, reason: "target lockfile entry now resolves" };
  }

  const deps = dependencies(headPkg);
  const remaining = record.blockers.filter((blocker) => {
    if (!deps[blocker.name]) return false;
    const peer = currentPeers[blocker.name]?.peerDependencies?.[record.target.name];
    if (currentPeers[blocker.name] === undefined) {
      throw new Error(`Missing registry metadata for ${blocker.name}`);
    }
    return peer && !semver.satisfies(record.target.version, peer, { includePrerelease: true });
  });
  return remaining.length === 0
    ? { wake: true, reason: "all recorded peer blockers are now compatible" }
    : {
        wake: false,
        reason: `${remaining.map((blocker) => blocker.name).join(", ")} still block the target`,
      };
}
