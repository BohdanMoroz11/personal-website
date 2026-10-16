import { describe, expect, it } from "vitest";
import {
  blockedRecord,
  blockingPeers,
  decideBlockedWake,
  encodeBlockedRecord,
  latestBlockedVerdict,
  majorTarget,
} from "../../scripts/major-dep-blocked-state.mjs";

const sha = "a".repeat(40);
const owner = "BohdanMoroz11";
const base = {
  dependencies: { astro: "^7.2.2" },
  devDependencies: {
    typescript: "^6.0.3",
    "@astrojs/check": "^0.9.10",
    "typescript-eslint": "^8.68.0",
    "@vitest/coverage-v8": "^5.0.1",
  },
};
const atVerdict = {
  dependencies: { astro: "^7.2.2" },
  devDependencies: { ...base.devDependencies, typescript: "^7.0.2" },
};
const lock = (version: string) => ({ packages: { "node_modules/typescript": { version } } });
const record = {
  version: 1,
  verdictSha: sha,
  verdictId: "comment-1",
  target: { name: "typescript", spec: "^7.0.2", version: "7.0.2", lockedVersion: "6.0.3" },
  blockers: [
    { name: "@astrojs/check", version: "0.9.10", peerRange: "^5.0.0 || ^6.0.0" },
    { name: "typescript-eslint", version: "8.68.0", peerRange: ">=4.8.4 <6.1.0" },
  ],
};
const peers = {
  "@astrojs/check": { version: "0.9.10", peerDependencies: { typescript: "^5 || ^6" } },
  "typescript-eslint": {
    version: "8.71.2",
    peerDependencies: { typescript: ">=4.8.4 <6.1.0" },
  },
};

describe("blocked major target from PR #48", () => {
  it("identifies TypeScript even if unrelated direct dependencies changed", () => {
    expect(majorTarget(base, atVerdict)).toEqual({
      name: "typescript",
      spec: "^7.0.2",
      version: "7.0.2",
    });
    expect(
      majorTarget(base, {
        ...atVerdict,
        dependencies: { astro: "^7.2.4" },
        devDependencies: {
          ...atVerdict.devDependencies,
          "@vitest/coverage-v8": "^5.0.3",
          "new-tool": "^1.0.0",
        },
      }).name,
    ).toBe("typescript");
  });

  it("records only latest direct dependents whose peer range excludes the target", () => {
    expect(
      blockingPeers(record.target, {
        ...peers,
        astro: { version: "7.4.0", peerDependencies: { "@astrojs/markdown-remark": "^7" } },
      }),
    ).toEqual([
      { name: "@astrojs/check", version: "0.9.10", peerRange: "^5 || ^6" },
      { name: "typescript-eslint", version: "8.71.2", peerRange: ">=4.8.4 <6.1.0" },
    ]);
  });

  it("stays blocked across a rebase and unrelated Astro, Vitest, or blocker patch updates", () => {
    const head = {
      dependencies: { astro: "^7.2.4" },
      devDependencies: {
        ...atVerdict.devDependencies,
        "@vitest/coverage-v8": "^5.0.3",
        "typescript-eslint": "^8.71.0",
      },
    };
    expect(decideBlockedWake(record, head, lock("6.0.4"), peers).wake).toBe(false);
  });

  it("wakes for a changed target specifier or a newly resolved target lockfile entry", () => {
    expect(
      decideBlockedWake(
        record,
        { ...atVerdict, devDependencies: { ...atVerdict.devDependencies, typescript: "^7.1.0" } },
        lock("6.0.3"),
        peers,
      ),
    ).toEqual({ wake: true, reason: "target specifier changed" });
    expect(decideBlockedWake(record, atVerdict, lock("7.0.2"), peers)).toEqual({
      wake: true,
      reason: "target lockfile entry now resolves",
    });
  });

  it("waits until every recorded upstream blocker supports the target", () => {
    const oneFixed = {
      ...peers,
      "@astrojs/check": { version: "0.10.0", peerDependencies: { typescript: "^6 || ^7" } },
    };
    expect(decideBlockedWake(record, atVerdict, lock("6.0.3"), oneFixed).wake).toBe(false);
    const allFixed = {
      ...oneFixed,
      "typescript-eslint": { version: "9.0.0", peerDependencies: { typescript: "^7" } },
    };
    expect(decideBlockedWake(record, atVerdict, lock("6.0.3"), allFixed)).toEqual({
      wake: true,
      reason: "all recorded peer blockers are now compatible",
    });
  });

  it("treats removal of every recorded blocker as a reason to reconsider", () => {
    const head = { devDependencies: { typescript: "^7.0.2" } };
    expect(decideBlockedWake(record, head, lock("6.0.3"), {})).toEqual({
      wake: true,
      reason: "all recorded peer blockers are now compatible",
    });
  });

  it("refuses to wake when a registry lookup fails", () => {
    expect(() => decideBlockedWake(record, atVerdict, lock("6.0.3"), {})).toThrow(
      "Missing registry metadata for @astrojs/check",
    );
  });
});

describe("durable BLOCKED verdict", () => {
  it("reads a versioned state record for the matching verdict from the trusted commenter", () => {
    const comments = [
      {
        id: "comment-1",
        author: { login: owner },
        body: `<!-- dep-verdict:BLOCKED:${sha} -->\nBlocked.`,
      },
      { author: { login: owner }, body: `${encodeBlockedRecord(record)}\nSnapshot.` },
    ];
    const verdict = { sha, id: "comment-1", index: 0 };
    expect(latestBlockedVerdict(comments, owner)).toEqual(verdict);
    expect(blockedRecord(comments, owner, verdict)).toEqual(record);
    expect(blockedRecord(comments, "another-user", verdict)).toBeNull();
    comments.push({
      id: "comment-2",
      author: { login: owner },
      body: `<!-- dep-verdict:BLOCKED:${sha} -->\nRechecked after an upstream release.`,
    });
    expect(blockedRecord(comments, owner, { sha, id: "comment-2", index: 2 })).toBeNull();
  });

  it("accepts a retry-agent BLOCKED verdict in the same format", () => {
    const comments = [
      { author: { login: owner }, body: `<!-- dep-verdict:CLEAN:${sha} -->` },
      { author: { login: owner }, body: `<!-- ci-retry-attempt -->\nCI fix attempted.` },
      {
        id: "retry-verdict",
        author: { login: owner },
        body: `<!-- dep-verdict:BLOCKED:${sha} -->\nPeer conflict.`,
      },
    ];
    expect(latestBlockedVerdict(comments, owner)).toEqual({ sha, id: "retry-verdict", index: 2 });
  });
});
