import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUserModel } from "../../../src/query/getUserModel.js";
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

const mockUserModel = {
  senecaUserId:       "user-uuid-123",
  phase:              1 as const,
  agtOrientation:     0.2,
  agtConfidence:      0.5,
  baselineDirective:  "Focus on building conceptual understanding before drilling practice problems.",
  totalSessions:      7,
  language:           "en" as const,
  activeMemories: [
    { category: "behavioral", observation: "Student rushes under time pressure.", confidence: 0.65 },
  ],
};

describe("getUserModel", () => {
  it("returns UserModel on success", async () => {
    mockPost.mockResolvedValueOnce(mockUserModel);

    const result = await getUserModel({ limbUserId: "limb-user-1" });

    expect(result.senecaUserId).toBe("user-uuid-123");
    expect(result.baselineDirective).toBeTruthy();
    expect(Array.isArray(result.activeMemories)).toBe(true);
    expect(mockPost).toHaveBeenCalledWith("query", "getUserModel", { limbUserId: "limb-user-1" });
  });

  it("returns null baselineDirective when user has few memories", async () => {
    mockPost.mockResolvedValueOnce({ ...mockUserModel, baselineDirective: null });
    const result = await getUserModel({ limbUserId: "new-user" });
    expect(result.baselineDirective).toBeNull();
  });

  it("throws ValidationError when limbUserId is missing", async () => {
    await expect(getUserModel({ limbUserId: "" })).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("surfaces NotFoundError when no bridge exists", async () => {
    mockPost.mockRejectedValueOnce(new NotFoundError("No active bridge found for this limb user"));
    await expect(getUserModel({ limbUserId: "unlinked-user" })).rejects.toThrow(NotFoundError);
  });

  it("surfaces RateLimitedError from gateway", async () => {
    mockPost.mockRejectedValueOnce(new RateLimitedError());
    await expect(getUserModel({ limbUserId: "limb-user-1" })).rejects.toThrow(RateLimitedError);
  });
});
