import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * Tests for the fingerprint algorithm used in computeBaselineDirective.
 * The actual computation runs server-side in the gateway, so we test
 * the algorithm in isolation here to verify determinism.
 */

function computeFingerprint(memoryIds: string[]): string {
  const ids = memoryIds.join(",");
  return crypto.createHash("sha256").update(ids).digest("hex");
}

describe("baseline directive fingerprint", () => {
  it("is deterministic for the same IDs in the same order", () => {
    const ids = ["uuid-a", "uuid-b", "uuid-c"];
    expect(computeFingerprint(ids)).toBe(computeFingerprint(ids));
  });

  it("produces a 64-character hex string", () => {
    const fp = computeFingerprint(["uuid-a", "uuid-b"]);
    expect(fp).toHaveLength(64);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it("changes when IDs change", () => {
    const fp1 = computeFingerprint(["uuid-a", "uuid-b"]);
    const fp2 = computeFingerprint(["uuid-a", "uuid-c"]);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when order changes", () => {
    const fp1 = computeFingerprint(["uuid-a", "uuid-b"]);
    const fp2 = computeFingerprint(["uuid-b", "uuid-a"]);
    expect(fp1).not.toBe(fp2);
  });

  it("is stable across calls (no randomness)", () => {
    const ids = ["uuid-x", "uuid-y", "uuid-z"];
    const runs = Array.from({ length: 10 }, () => computeFingerprint(ids));
    const allSame = runs.every(fp => fp === runs[0]);
    expect(allSame).toBe(true);
  });
});
