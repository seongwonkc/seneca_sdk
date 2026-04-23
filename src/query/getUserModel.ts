import type { GetUserModelParams, UserModel } from "./types.js";
import { gatewayPost } from "../internal/http/client.js";
import { ValidationError } from "../types/errors.js";

/**
 * Read the current personalization state for a linked user.
 *
 * baselineDirective is computed at read time from the user's top memories,
 * then cached by memory fingerprint. Returns null if the user has fewer than
 * 2 high-confidence memories.
 *
 * Throws:
 *  - ValidationError    if limbUserId is missing
 *  - NotFoundError      if no active bridge exists for this limbUserId
 *  - RateLimitedError   if the limb has exceeded its request quota
 */
export async function getUserModel(params: GetUserModelParams): Promise<UserModel> {
  const { limbUserId } = params;

  if (!limbUserId || typeof limbUserId !== "string") {
    throw new ValidationError("limbUserId is required and must be a string");
  }

  return gatewayPost<UserModel>("query", "getUserModel", { limbUserId });
}
