import type { DeleteUserDataParams } from "./types.js";

/**
 * INTENTIONAL STUB -- v0.1
 *
 * In v0.1, user data deletion is handled by the consumer endpoints:
 *
 *   POST /.netlify/functions/seneca-generate-delete-token
 *     Authenticates via Supabase JWT, issues a time-limited confirmation token.
 *
 *   POST /.netlify/functions/seneca-delete-data
 *     Accepts the token + email confirmation, runs the full 11-step irreversible
 *     delete (Storage, cascade RPC, auth admin DELETE).
 *
 * Both endpoints are triggered from the "Delete Account" section of profile.html.
 * They authenticate via Supabase JWT, not a limb key, so they live outside the
 * SDK surface.
 *
 * The SDK client path (limb calling deleteUserData on behalf of a user) is not
 * planned and would require a new auth model (limb key + user consent token) and
 * careful Constitutional review before being designed.
 *
 * Do NOT route this through the limb gateway.
 */
export async function deleteUserData(
  _params: DeleteUserDataParams,
): Promise<void> {
  throw new Error(
    "deleteUserData: intentional stub in v0.1. " +
    "User-facing deletion is handled by the seneca-generate-delete-token and " +
    "seneca-delete-data consumer endpoints, triggered from profile.html. " +
    "SDK client path is not yet planned -- see V02_BACKLOG.md."
  );
}
