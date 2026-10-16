const RENOVATE_ACTOR = "renovate[bot]";

export function trustedCommentAuthors(repository, appSlug) {
  const owner = repository?.split("/")[0];
  return [owner, appSlug && `${appSlug}[bot]`].filter(Boolean);
}

export function validateMajorPr(pr, { repository, expectedSha, expectedBranch } = {}) {
  if (!repository || !pr || pr.state !== "open") return "PR is missing or closed";
  if (pr.base?.repo?.full_name !== repository) return "PR targets a different repository";
  if (pr.base?.ref !== "main") return "PR does not target main";
  if (pr.head?.repo?.full_name !== repository) return "PR head is outside this repository";
  if (pr.user?.login !== RENOVATE_ACTOR) return "PR was not opened by Renovate";
  if (!pr.head?.ref?.startsWith("renovate/")) return "PR branch is not a Renovate branch";
  if (!pr.labels?.some((label) => label.name === "dep:major-review")) {
    return "PR lacks the major-review label";
  }
  if (!/^[0-9a-f]{40}$/.test(pr.head?.sha ?? "")) return "PR head SHA is invalid";
  if (expectedSha && pr.head.sha !== expectedSha) return "PR head changed since the event";
  if (expectedBranch && pr.head.ref !== expectedBranch) return "PR branch changed since the event";
  return null;
}
