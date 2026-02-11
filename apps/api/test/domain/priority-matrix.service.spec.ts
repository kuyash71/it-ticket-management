import { describe, expect, it } from "vitest";

import { calculatePriority } from "../../src/modules/tickets/domain/services/priority-matrix.service";

describe("priority matrix", () => {
  it("returns CRITICAL for high impact + high urgency", () => {
    expect(calculatePriority("HIGH", "HIGH")).toBe("CRITICAL");
  });

  it("returns LOW for low impact + medium urgency", () => {
    expect(calculatePriority("MEDIUM", "LOW")).toBe("LOW");
  });
});
