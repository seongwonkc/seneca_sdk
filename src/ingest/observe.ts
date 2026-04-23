import type { ObserveParams, ObserveResult } from "./types.js";
import { gatewayPost } from "../internal/http/client.js";
import { ValidationError } from "../types/errors.js";

/**
 * Write one or more behavioral observations about a linked limb user.
 * Fire-and-forget from the limb perspective -- the SDK handles durability.
 *
 * Confidence is clamped to 0.7 max server-side. Values above that are
 * reserved for Seneca internal corroboration process.
 *
 * Throws:
 *  - ValidationError   if params fail client-side checks
 *  - NotFoundError     if limbUserId has no active bridge
 *  - RateLimitedError  if the limb has exceeded its request quota
 */
export async function observe(params: ObserveParams): Promise<ObserveResult> {
  const { limbUserId, observations } = params;

  if (!limbUserId || typeof limbUserId !== "string") {
    throw new ValidationError("limbUserId is required and must be a string");
  }
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new ValidationError("observations must be a non-empty array");
  }
  if (observations.length > 10) {
    throw new ValidationError("observations array must contain at most 10 items");
  }

  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    if (!obs) throw new ValidationError("observations[" + i + "] is undefined");
    if (!Number.isFinite(obs.confidence) || obs.confidence < 0 || obs.confidence > 1) {
      throw new ValidationError("observations[" + i + "].confidence must be a finite number between 0 and 1");
    }
    const hasText = typeof obs.observation === "string" && obs.observation.trim().length > 0;
    if (!hasText) {
      throw new ValidationError("observations[" + i + "].observation is required and must be a non-empty string");
    }
  }

  return gatewayPost<ObserveResult>("ingest", "observe", {
    limbUserId,
    observations,
  });
}
