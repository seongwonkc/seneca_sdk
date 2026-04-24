import type { GetUserModelParams, UserModel } from "./types.js";
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
export declare function getUserModel(params: GetUserModelParams): Promise<UserModel>;
//# sourceMappingURL=getUserModel.d.ts.map