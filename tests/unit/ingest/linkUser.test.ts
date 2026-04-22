import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { linkUser } from "../../../src/ingest/linkUser.js";
import {
  ValidationError,
  UnauthorizedError,
  TokenExpiredError,
  TokenSpentError,
  ConflictError,
} from "../../../src/types/errors.js";

// ─── Gateway mock ─────────────────────────────────────────────────────────────

vi.mock("../../../src/internal/http/client.js", () => ({
  gatewayPost: vi.fn(),
}));

import { gatewayPost } from "../../../src/internal/http/client.js";
const mockPost = vi.mocked(gatewayPost);

// ─── Env setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  process.env["SENECA_SDK_GATEWAY_URL"] = "https://example.netlify.app/.netlify/functions/seneca-sdk-gateway";
  process.env["SENECA_LIMB_NAME"] = "vector";
  process.env["SENECA_LIMB_KEY"] = "test-key-abc";
  process.env["SENECA_SDK_VERSION"] = "0";
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("linkUser", () => {
  it("returns senecaUserId and linkedAt on success", async () => {
    const linkedAt = new Date().toISOString();
    mockPost.mockResolvedValueOnce({ senecaUserId: "user-uuid-123", linkedAt });

    const result = await linkUser({
      senecaLinkToken: "token-abc",
      limbUserId: "limb-user-1",
    });

    expect(result.senecaUserId).toBe("user-uuid-123");
    expect(result.linkedAt).toBe(linkedAt);
    expect(mockPost).toHaveBeenCalledWith("ingest", "linkUser", {
      senecaLinkToken: "token-abc",
      limbUserId: "limb-user-1",
    });
  });

  it("throws ValidationError when senecaLinkToken is missing", async () => {
    await expect(
      linkUser({ senecaLinkToken: "", limbUserId: "limb-user-1" }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("throws ValidationError when limbUserId is missing", async () => {
    await expect(
      linkUser({ senecaLinkToken: "token-abc", limbUserId: "" }),
    ).rejects.toThrow(ValidationError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("surfaces TokenExpiredError from gateway", async () => {
    mockPost.mockRejectedValueOnce(new TokenExpiredError());
    await expect(
      linkUser({ senecaLinkToken: "stale-token", limbUserId: "limb-user-1" }),
    ).rejects.toThrow(TokenExpiredError);
  });

  it("surfaces ConflictError from gateway when limb user already bridged to different account", async () => {
    mockPost.mockRejectedValueOnce(
      new ConflictError("This limb user is already linked to a different Seneca account"),
    );
    await expect(
      linkUser({ senecaLinkToken: "token-abc", limbUserId: "limb-user-taken" }),
    ).rejects.toThrow(ConflictError);
  });
});
