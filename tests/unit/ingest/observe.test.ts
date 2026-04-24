import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observe } from "../../../src/ingest/observe.js";
import { ValidationError, NotFoundError, IdentityMismatchError } from "../../../src/types/errors.js";
import { validateQuestionData } from "../../../src/internal/validation/validateQuestionData.js";
import type { QuestionData } from "../../../src/ingest/types.js";

vi.mock("../../../src/internal/http/client.js", () => ({
  gatewayPost: vi.fn(),
}));

import { gatewayPost } from "../../../src/internal/http/client.js";
const mockPost = vi.mocked(gatewayPost);

beforeEach(() => {
  process.env["SENECA_SDK_GATEWAY_URL"] = "https://example.netlify.app/.netlify/functions/seneca-sdk-gateway";
  process.env["SENECA_LIMB_NAME"] = "vector";
  process.env["SENECA_LIMB_KEY"] = "test-key-abc";
  process.env["SENECA_SDK_VERSION"] = "0";
});

afterEach(() => {
  vi.clearAllMocks();
});

const validObs = {
  observation: "Student answered a question correctly.",
  category: "behavioral" as const,
  confidence: 0.5,
};

const validQuestionData: QuestionData = {
  questionId: "q-abc-123",
  isCorrect: true,
  timeSpentSeconds: 42,
  wasFlagged: false,
  numberOfChanges: 2,
  positionInSession: 5,
  skippedFirstTime: false,
};

describe("observe", () => {
  it("returns senecaUserId and memoryIds on success", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-abc", memoryIds: ["mem-1"] });

    const result = await observe({ limbUserId: "limb-1", observations: [validObs] });

    expect(result.senecaUserId).toBe("user-abc");
    expect(result.memoryIds).toEqual(["mem-1"]);
    expect(mockPost).toHaveBeenCalledWith("ingest", "observe", {
      limbUserId: "limb-1",
      observations: [validObs],
    });
  });

  it("throws ValidationError when limbUserId is missing", async () => {
    await expect(
      observe({ limbUserId: "", observations: [validObs] }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when observations is empty", async () => {
    await expect(
      observe({ limbUserId: "limb-1", observations: [] }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when observations exceeds 10 items", async () => {
    const tooMany = Array(11).fill(validObs);
    await expect(
      observe({ limbUserId: "limb-1", observations: tooMany }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when confidence is NaN", async () => {
    await expect(
      observe({
        limbUserId: "limb-1",
        observations: [{ ...validObs, confidence: NaN }],
      }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when confidence is Infinity", async () => {
    await expect(
      observe({
        limbUserId: "limb-1",
        observations: [{ ...validObs, confidence: Infinity }],
      }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when confidence is out of range", async () => {
    await expect(
      observe({
        limbUserId: "limb-1",
        observations: [{ ...validObs, confidence: 1.5 }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("surfaces NotFoundError from gateway when no bridge exists", async () => {
    mockPost.mockRejectedValueOnce(
      new NotFoundError("No active bridge found for this limb user"),
    );
    await expect(
      observe({ limbUserId: "unlinked-user", observations: [validObs] }),
    ).rejects.toThrow(NotFoundError);
  });

  // ── questionData happy path ────────────────────────────────────────────────

  it("accepts a full valid questionData payload", async () => {
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-abc", memoryIds: ["mem-2"] });
    const obsWithQD = { ...validObs, questionData: validQuestionData };

    const result = await observe({ limbUserId: "limb-1", observations: [obsWithQD] });

    expect(result.senecaUserId).toBe("user-abc");
    expect(mockPost).toHaveBeenCalledWith("ingest", "observe", {
      limbUserId: "limb-1",
      observations: [obsWithQD],
    });
  });

  // ── questionData missing required fields ──────────────────────────────────

  it("throws ValidationError when questionData.questionId is missing", async () => {
    expect(() =>
      validateQuestionData({ ...validQuestionData, questionId: "" }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.isCorrect is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, isCorrect: undefined }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.timeSpentSeconds is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, timeSpentSeconds: undefined }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.wasFlagged is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, wasFlagged: undefined }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.numberOfChanges is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, numberOfChanges: undefined }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.positionInSession is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, positionInSession: undefined }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when questionData.skippedFirstTime is missing", async () => {
    expect(() =>
      // @ts-expect-error intentionally bad input
      validateQuestionData({ ...validQuestionData, skippedFirstTime: undefined }, 0),
    ).toThrow(ValidationError);
  });

  // ── positionInSession range checks ────────────────────────────────────────

  it("throws ValidationError when positionInSession is 0 (below range)", async () => {
    expect(() =>
      validateQuestionData({ ...validQuestionData, positionInSession: 0 }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when positionInSession is 201 (above range)", async () => {
    expect(() =>
      validateQuestionData({ ...validQuestionData, positionInSession: 201 }, 0),
    ).toThrow(ValidationError);
  });

  it("throws ValidationError when positionInSession is non-integer (1.5)", async () => {
    expect(() =>
      validateQuestionData({ ...validQuestionData, positionInSession: 1.5 }, 0),
    ).toThrow(ValidationError);
  });

  // ── gateway IDENTITY_MISMATCH → IdentityMismatchError ─────────────────────

  it("throws IdentityMismatchError when gateway returns IDENTITY_MISMATCH", async () => {
    mockPost.mockRejectedValueOnce(
      new IdentityMismatchError("User identity does not match linked bridge"),
    );
    await expect(
      observe({ limbUserId: "limb-1", observations: [validObs] }),
    ).rejects.toThrow(IdentityMismatchError);
  });
});
