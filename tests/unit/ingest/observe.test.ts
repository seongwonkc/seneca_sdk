import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observe } from "../../../src/ingest/observe.js";
import { ValidationError, NotFoundError } from "../../../src/types/errors.js";

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
});
