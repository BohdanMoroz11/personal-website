import { describe, expect, it } from "vitest";
import { decideRetry } from "../../scripts/major-dep-retry-state.mjs";

const owner = "maintainer";
const sha = (letter: string) => letter.repeat(40);
const comment = (body: string, author = owner) => ({ body, author: { login: author } });
const verdict = (kind: string, head: string) =>
  comment(`<!-- dep-verdict:${kind}:${head} -->\nReview complete.`);
const attempt = (runId: string, head: string) =>
  comment(`<!-- ci-retry-attempt -->\n<!-- ci-retry-state:${runId}:${head} -->\nFix reported.`);

function decide(overrides: Record<string, unknown> = {}) {
  return decideRetry({
    comments: [verdict("CLEAN", sha("a"))],
    owner,
    labels: ["dep:major-review"],
    currentSha: sha("a"),
    eventSha: sha("a"),
    runId: "101",
    ...overrides,
  });
}

describe("major dependency CI retry eligibility", () => {
  it("waits when CI fails before the initial review completes", () => {
    expect(decide({ comments: [] })).toEqual({ reason: "initial review has not finished" });
  });

  it("starts after a CLEAN or MIGRATED verdict for the final head", () => {
    expect(decide()).toEqual({ attempt: 1, reviewSha: sha("a") });
    expect(
      decide({
        comments: [verdict("MIGRATED", sha("b"))],
        currentSha: sha("b"),
        eventSha: sha("b"),
      }),
    ).toEqual({
      attempt: 1,
      reviewSha: sha("b"),
    });
  });

  it("does not retry BLOCKED, NEEDS-HUMAN, or labeled blocked bumps", () => {
    expect(decide({ comments: [verdict("BLOCKED", sha("a"))] }).reason).toBe(
      "review verdict is BLOCKED",
    );
    expect(decide({ comments: [verdict("NEEDS-HUMAN", sha("a"))] }).reason).toBe(
      "review verdict is NEEDS-HUMAN",
    );
    expect(decide({ labels: ["dep:major-review", "dep:blocked"] }).reason).toBe("blocked bump");
  });

  it("rejects CI events for an earlier head and unreported head changes", () => {
    expect(decide({ currentSha: sha("b") }).reason).toBe("stale CI run");
    expect(decide({ currentSha: sha("b"), eventSha: sha("b") }).reason).toBe(
      "head changed after last agent report",
    );
  });

  it("continues a reported retry chain and rejects duplicate CI events", () => {
    const comments = [verdict("CLEAN", sha("a")), attempt("101", sha("b"))];
    expect(decide({ comments, currentSha: sha("b"), eventSha: sha("b"), runId: "102" })).toEqual({
      attempt: 2,
      reviewSha: sha("a"),
    });
    expect(decide({ comments, currentSha: sha("b"), eventSha: sha("b") }).reason).toBe(
      "CI run already handled",
    );
  });

  it("stops after three attempts and resets the cap on a new review", () => {
    const comments = [
      verdict("CLEAN", sha("a")),
      attempt("101", sha("b")),
      attempt("102", sha("c")),
      attempt("103", sha("d")),
    ];
    expect(
      decide({ comments, currentSha: sha("d"), eventSha: sha("d"), runId: "104" }).reason,
    ).toBe("retry limit reached");
    expect(
      decide({
        comments: [...comments, verdict("CLEAN", sha("e"))],
        currentSha: sha("e"),
        eventSha: sha("e"),
        runId: "105",
      }),
    ).toEqual({ attempt: 1, reviewSha: sha("e") });
  });

  it("ignores verdict markers posted by other users", () => {
    expect(
      decide({ comments: [comment(`<!-- dep-verdict:CLEAN:${sha("a")} -->`, "someone-else")] })
        .reason,
    ).toBe("initial review has not finished");
  });
});
