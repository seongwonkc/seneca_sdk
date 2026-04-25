import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { gatewayPost } from "../../../../src/internal/http/client.js";
import {
  SenecaError,
  UnauthorizedError,
  TokenSpentError,
  ValidationError,
} from "../../../../src/types/errors.js";

// ─── Response helpers ─────────────────────────────────────────────────────────

function errResponse(status: number, body: unknown): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

function gatewayErrorBody(code: string, message: string, statusCode: number) {
  return { error: { code, message, statusCode } };
}

// ─── Env + fetch setup ────────────────────────────────────────────────────────

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
  process.env["SENECA_SDK_GATEWAY_URL"] = "https://test.netlify.app/.netlify/functions/seneca-sdk-gateway";
  process.env["SENECA_LIMB_NAME"]       = "vector";
  process.env["SENECA_LIMB_KEY"]        = "test-key-abc";
  process.env["SENECA_SDK_VERSION"]     = "0";
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Restore any env vars tests may have cleared
  process.env["SENECA_SDK_GATEWAY_URL"] = "https://test.netlify.app/.netlify/functions/seneca-sdk-gateway";
  process.env["SENECA_LIMB_NAME"]       = "vector";
  process.env["SENECA_LIMB_KEY"]        = "test-key-abc";
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("gatewayPost — typed error mapping", () => {
  it("UNAUTHORIZED → throws UnauthorizedError with propagated gateway message", async () => {
    mockFetch.mockResolvedValueOnce(
      errResponse(401, gatewayErrorBody("UNAUTHORIZED", "invalid limb key", 401)),
    );
    const err = await gatewayPost("ingest", "linkUser", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect((err as UnauthorizedError).message).toBe("invalid limb key");
  });

  it("TOKEN_SPENT → throws TokenSpentError", async () => {
    mockFetch.mockResolvedValueOnce(
      errResponse(401, gatewayErrorBody("TOKEN_SPENT", "token already used", 401)),
    );
    const err = await gatewayPost("ingest", "linkUser", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TokenSpentError);
  });

  it("VALIDATION → throws ValidationError carrying the gateway message", async () => {
    mockFetch.mockResolvedValueOnce(
      errResponse(400, gatewayErrorBody("VALIDATION", "isCorrect required", 400)),
    );
    const err = await gatewayPost("ingest", "observe", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).message).toBe("isCorrect required");
  });

  it("fallback codes (UNSUPPORTED_VERSION, NOT_IMPLEMENTED, INTERNAL) → throw SenecaError, not a typed subclass", async () => {
    const cases = [
      { code: "UNSUPPORTED_VERSION", message: "unsupported spec version",  statusCode: 400 },
      { code: "NOT_IMPLEMENTED",     message: "method not implemented",    statusCode: 501 },
      { code: "INTERNAL",            message: "internal server error",     statusCode: 500 },
    ];
    for (const { code, message, statusCode } of cases) {
      mockFetch.mockResolvedValueOnce(
        errResponse(statusCode, gatewayErrorBody(code, message, statusCode)),
      );
      const err = await gatewayPost("ingest", "observe", {}).catch((e: unknown) => e);
      expect(err, `${code} should be a SenecaError`).toBeInstanceOf(SenecaError);
      expect((err as SenecaError).constructor, `${code} must not be a typed subclass`).toBe(SenecaError);
      expect((err as SenecaError).code, `${code} code must be preserved`).toBe(code);
    }
  });

  it("unknown error code → throws SenecaError with unrecognized code preserved on error", async () => {
    mockFetch.mockResolvedValueOnce(
      errResponse(500, gatewayErrorBody("MYSTERY_CODE", "something unexpected", 500)),
    );
    const err = await gatewayPost("ingest", "observe", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SenecaError);
    expect((err as SenecaError).constructor).toBe(SenecaError);
    expect((err as SenecaError).code).toBe("MYSTERY_CODE");
  });
});

describe("gatewayPost — non-JSON response", () => {
  it("non-JSON body → throws SenecaError with INTERNAL code and HTTP status in message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError("Unexpected token < in JSON"); },
    } as unknown as Response);
    const err = await gatewayPost("ingest", "observe", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SenecaError);
    expect((err as SenecaError).code).toBe("INTERNAL");
    expect((err as SenecaError).message).toContain("non-JSON");
    expect((err as SenecaError).message).toContain("502");
  });
});

describe("gatewayPost — missing required env var", () => {
  it("missing SENECA_SDK_GATEWAY_URL → throws Error before fetch is called", async () => {
    // Empty string triggers getEnv's `if (!val)` guard — same as absent
    process.env["SENECA_SDK_GATEWAY_URL"] = "";
    const err = await gatewayPost("ingest", "linkUser", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(SenecaError);
    expect((err as Error).message).toContain("SENECA_SDK_GATEWAY_URL");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
