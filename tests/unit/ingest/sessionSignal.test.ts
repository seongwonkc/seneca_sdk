import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sessionSignal } from "../../../src/ingest/sessionSignal.js";
import { ValidationError, NotFoundError, RateLimitedError } from "../../../src/types/errors.js";

vi.mock("../../../src/internal/http/client.js", () => ({
  gatewayPost: vi.fn(),
}));

import { gatewayPost } from "../../../src/internal/http/client.js";
const mockPost = vi.mocked(gatewayPost);

beforeEach(() => {
  process.env["SENECA_SDK_GATEWAY_URL"] = "https://example.netlify.app/.netlify/functions/seneca-sdk-gateway";
  process.env["SENECA_LIMB_NAME"] = "vector";
  process.env["SENECA_LIMB_KEY"] = "test-key";
  process.env["SENECA_SDK_VERSION"] = "0";
});

afterEach(() => { vi.clearAllMocks(); });

const validSession = {
  sessionRef:       "session-abc-123",
  startedAt:        "2026-04-23T10:00:00Z",
  endedAt:          "2026-04-23T10:45:00Z",
  durationMinutes:  45,
  engagementScore:  0.72,
  topics:           ["algebra", "linear equations"],
  performanceDelta: 0.12,
  context:          "SAT practice test",
};

describe("sessionSignal", () => {
  it("returns senecaUserId and sessionId on success", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-123", sessionId: "sess-uuid-456" });

    const result = await sessionSignal({ limbUserId: "limb-user-1", session: validSession });

    expect(result.senecaUserId).toBe("user-123");
    expect(result.sessionId).toBe("sess-uuid-456");
    expect(mockPost).toHaveBeenCalledWith("ingest", "sessionSignal", {
      limbUserId: "limb-user-1",
      session: validSession,
    });
  });

  it("throws ValidationError when limbUserId is missing", async () => {
    await expect(
      sessionSignal({ limbUserId: "", session: validSession }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when session is missing", async () => {
    await expect(
      // @ts-expect-error intentionally passing bad input
      sessionSignal({ limbUserId: "limb-1", session: null }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when sessionRef is missing", async () => {
    await expect(
      sessionSignal({ limbUserId: "limb-1", session: { ...validSession, sessionRef: "" } }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("surfaces NotFoundError when no bridge exists", async () => {
    mockPost.mockRejectedValueOnce(new NotFoundError("No active bridge found"));
    await expect(
      sessionSignal({ limbUserId: "unlinked", session: validSession }),
    ).rejects.toThrow(NotFoundError);
  });

  it("surfaces RateLimitedError from gateway", async () => {
    mockPost.mockRejectedValueOnce(new RateLimitedError());
    await expect(
      sessionSignal({ limbUserId: "limb-1", session: validSession }),
    ).rejects.toThrow(RateLimitedError);
  });

  // ── new SessionSignalData fields ──────────────────────────────────────────

  it("accepts session with sectionsCompleted as string array", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-1", sessionId: "sess-1" });
    const session = { ...validSession, sectionsCompleted: ["rw1", "math"] };

    await expect(
      sessionSignal({ limbUserId: "limb-1", session }),
    ).resolves.toBeDefined();

    expect(mockPost).toHaveBeenCalledWith("ingest", "sessionSignal", {
      limbUserId: "limb-1",
      session,
    });
  });

  it("accepts session with all new optional fields present", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-1", sessionId: "sess-1" });
    const session = {
      ...validSession,
      totalQuestionsAttempted: 44,
      totalCorrect: 38,
      sectionsCompleted: ["rw1", "rw2", "math"],
      completedFullSession: true,
      firstQuartileAvgSeconds: 62,
      lastQuartileAvgSeconds: 48,
    };

    await expect(
      sessionSignal({ limbUserId: "limb-1", session }),
    ).resolves.toBeDefined();

    expect(mockPost).toHaveBeenCalledWith("ingest", "sessionSignal", {
      limbUserId: "limb-1",
      session,
    });
  });

  it("accepts session with none of the new optional fields (backward compat)", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-1", sessionId: "sess-1" });

    await expect(
      sessionSignal({ limbUserId: "limb-1", session: validSession }),
    ).resolves.toBeDefined();

    expect(mockPost).toHaveBeenCalledWith("ingest", "sessionSignal", {
      limbUserId: "limb-1",
      session: validSession,
    });
  });
});
