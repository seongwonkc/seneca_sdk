import type { LinkUserParams, LinkUserResult } from "./types.js";
/**
 * Link a limb-side user to a Seneca identity using a one-time link token
 * the user generated in the Seneca app.
 *
 * Seneca identities are never created implicitly by limb signup. Users
 * must explicitly consent to the bridge.
 *
 * Throws:
 *  - ValidationError      if params are missing or malformed
 *  - UnauthorizedError    if the token is invalid
 *  - TokenExpiredError    if the token has passed its 15-minute window
 *  - TokenSpentError      if the token has already been consumed
 *  - ConflictError        if limbUserId is already bridged to a different Seneca account
 *  - RateLimitedError     if the limb has exceeded its request quota
 */
export declare function linkUser(params: LinkUserParams): Promise<LinkUserResult>;
//# sourceMappingURL=linkUser.d.ts.map