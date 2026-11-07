const VERDICT = /^<!-- dep-verdict:(CLEAN|MIGRATED|BLOCKED|NEEDS-HUMAN):([0-9a-f]{40}) -->/;
const ATTEMPT = /^<!-- ci-retry-attempt -->\r?\n<!-- ci-retry-state:([0-9]+):([0-9a-f]{40}) -->/;

export function latestVerdict(comments, author) {
  const authors = Array.isArray(author) ? author : [author];
  for (let index = comments.length - 1; index >= 0; index--) {
    const comment = comments[index];
    if (!authors.includes(comment.author?.login)) continue;
    const match = VERDICT.exec(comment.body);
    if (match) return { index, verdict: match[1], sha: match[2] };
  }
  return null;
}

export function attemptsAfterVerdict(comments, verdictIndex, author) {
  const authors = Array.isArray(author) ? author : [author];
  return comments.slice(verdictIndex + 1).flatMap((comment) => {
    if (!authors.includes(comment.author?.login)) return [];
    const match = ATTEMPT.exec(comment.body);
    return match ? [{ runId: match[1], sha: match[2] }] : [];
  });
}

export function decideRetry({
  comments,
  owner,
  labels,
  currentSha,
  eventSha,
  runId,
  maxAttempts = 3,
}) {
  if (currentSha !== eventSha) return { reason: "stale CI run" };
  if (!labels.includes("dep:major-review")) return { reason: "not a major-review PR" };
  if (labels.includes("dep:blocked")) return { reason: "blocked bump" };

  const review = latestVerdict(comments, owner);
  if (!review) return { reason: "initial review has not finished" };
  if (review.verdict !== "CLEAN" && review.verdict !== "MIGRATED") {
    return { reason: `review verdict is ${review.verdict}` };
  }

  const attempts = attemptsAfterVerdict(comments, review.index, owner);
  const previousSha = attempts.at(-1)?.sha ?? review.sha;
  if (currentSha !== previousSha) return { reason: "head changed after last agent report" };
  if (attempts.some((attempt) => attempt.runId === runId)) {
    return { reason: "CI run already handled" };
  }
  if (attempts.length >= maxAttempts) return { reason: "retry limit reached" };

  return {
    attempt: attempts.length + 1,
    reviewSha: review.sha,
  };
}
