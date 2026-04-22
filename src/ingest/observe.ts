import type { ObserveParams, ObserveResult } from "./types.js";

/**
 * Write one or more behavioral observations about a linked limb user.
 * Fire-and-forget from the limb perspective — the SDK handles durability.
 *
 * Confidence is clamped to 0.7 max. Values above that are reserved for
 * Seneca's internal corroboration process.
 */
export async function observe(_params: ObserveParams): Promise<ObserveResult> {
  throw new Error("observe: not implemented");
}
