import type { GetUserModelParams, UserModel } from "./types.js";

/**
 * Read the current personalization state for a linked user.
 * baselineDirective is computed at read time, not stored. Cached for perf.
 */
export async function getUserModel(_params: GetUserModelParams): Promise<UserModel> {
  throw new Error("getUserModel: not implemented");
}
