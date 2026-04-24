import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitedError,
  TokenExpiredError,
  TokenSpentError,
  IdentityMismatchError,
  SenecaError,
} from "../../types/errors.js";

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error("Missing required env var: " + key);
  return val;
}

interface GatewayErrorEnvelope {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

function throwForErrorCode(code: string, message: string, statusCode: number): never {
  switch (code) {
    case "UNAUTHORIZED":  throw new UnauthorizedError(message);
    case "TOKEN_EXPIRED": throw new TokenExpiredError();
    case "TOKEN_SPENT":   throw new TokenSpentError();
    case "NOT_FOUND":     throw new NotFoundError(message);
    case "BRIDGE_EXISTS":       throw new ConflictError(message);
    case "IDENTITY_MISMATCH":   throw new IdentityMismatchError(message);
    case "VALIDATION":          throw new ValidationError(message);
    case "RATE_LIMITED":        throw new RateLimitedError(message);
    default:              throw new SenecaError(message, code, statusCode);
  }
}

export async function gatewayPost<T>(
  surface: string,
  method: string,
  body: unknown,
): Promise<T> {
  const gatewayUrl  = getEnv("SENECA_SDK_GATEWAY_URL");
  const limbName    = getEnv("SENECA_LIMB_NAME");
  const limbKey     = getEnv("SENECA_LIMB_KEY");
  const specVersion = process.env["SENECA_SDK_VERSION"] ?? "0";

  const url = gatewayUrl + "/" + surface + "/" + method;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-seneca-spec-version": specVersion,
      "x-limb-name": limbName,
      "x-limb-key": limbKey,
    },
    body: JSON.stringify(body),
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new SenecaError(
      "Gateway returned non-JSON response (HTTP " + res.status + ")",
      "INTERNAL",
      res.status,
    );
  }

  if (!res.ok) {
    const envelope = parsed as GatewayErrorEnvelope;
    const { code, message, statusCode } = envelope?.error ?? {
      code: "INTERNAL",
      message: "HTTP " + res.status,
      statusCode: res.status,
    };
    throwForErrorCode(code, message, statusCode);
  }

  return parsed as T;
}
