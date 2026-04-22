import { describe, it, expect } from "vitest";
import { SDK_VERSION } from "../../src/version.js";

describe("SDK_VERSION", () => {
  it("is a non-negative integer", () => {
    expect(Number.isInteger(SDK_VERSION)).toBe(true);
    expect(SDK_VERSION).toBeGreaterThanOrEqual(0);
  });
});
