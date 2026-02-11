import { describe, expect, it } from "vitest";

import { canTransitionStatus } from "../../src/modules/tickets/domain/policies/status-transition.policy";

describe("status transition policy", () => {
  it("allows agent from NEW to IN_PROGRESS", () => {
    expect(canTransitionStatus("NEW", "IN_PROGRESS", "AGENT")).toBe(true);
  });

  it("blocks agent from CLOSED to IN_PROGRESS", () => {
    expect(canTransitionStatus("CLOSED", "IN_PROGRESS", "AGENT")).toBe(false);
  });

  it("allows manager override for any transition", () => {
    expect(canTransitionStatus("CLOSED", "IN_PROGRESS", "MANAGER")).toBe(true);
  });
});
