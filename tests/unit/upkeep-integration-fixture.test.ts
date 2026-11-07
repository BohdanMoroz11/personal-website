import { expect, it } from "vitest";
import { sum } from "../../scripts/upkeep-integration-fixture.mjs";

it("adds the two fixture operands", () => {
  expect(sum(2, 3)).toBe(5);
});
