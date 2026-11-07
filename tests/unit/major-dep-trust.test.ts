import { describe, expect, it } from "vitest";
import { trustedCommentAuthors, validateMajorPr } from "../../scripts/major-dep-trust.mjs";

const repository = "BohdanMoroz11/personal-website";
const sha = "a".repeat(40);
const pr = {
  state: "open",
  user: { login: "renovate[bot]" },
  base: { repo: { full_name: repository }, ref: "main" },
  head: { repo: { full_name: repository }, ref: "renovate/typescript-7.x", sha },
  labels: [{ name: "dep:major-review" }],
};
const check = (changes = {}) =>
  validateMajorPr(
    { ...pr, ...changes },
    { repository, expectedSha: sha, expectedBranch: pr.head.ref },
  );

describe("major dependency privileged preflight", () => {
  it("accepts the existing same-repository Renovate PR", () => {
    expect(check()).toBeNull();
  });

  it("rejects a fork even when it carries the right label and branch name", () => {
    expect(check({ head: { ...pr.head, repo: { full_name: "someone/website" } } })).toBe(
      "PR head is outside this repository",
    );
  });

  it("rejects a PR that was not opened by Renovate", () => {
    expect(check({ user: { login: "someone" } })).toBe("PR was not opened by Renovate");
  });

  it("rejects a PR aimed at a different base branch", () => {
    expect(check({ base: { ...pr.base, ref: "preview" } })).toBe("PR does not target main");
  });

  it("rejects an unlabelled or falsely named branch", () => {
    expect(check({ labels: [] })).toBe("PR lacks the major-review label");
    expect(check({ head: { ...pr.head, ref: "feature/foo" } })).toBe(
      "PR branch is not a Renovate branch",
    );
  });

  it("rejects a head that moved after the event or inspected SHA", () => {
    expect(check({ head: { ...pr.head, sha: "b".repeat(40) } })).toBe(
      "PR head changed since the event",
    );
  });

  it("keeps legacy owner and dedicated App comments distinct from arbitrary bots", () => {
    expect(trustedCommentAuthors(repository, "dep-agent")).toEqual([
      "BohdanMoroz11",
      "dep-agent[bot]",
    ]);
  });
});
