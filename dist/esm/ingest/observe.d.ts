import type { ObserveParams, ObserveResult } from "./types.js";
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
export declare function observe(params: ObserveParams): Promise<ObserveResult>;
//# sourceMappingURL=observe.d.ts.map