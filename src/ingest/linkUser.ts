import type { LinkUserParams, LinkUserResult } from "./types.js";

/**
 * Link a limb-side user to a Seneca identity using a one-time link token
 * the user generated in the Seneca app.
 *
 * Seneca identities are never created implicitly by limb signup. Users
 * must explicitly consent to the bridge.
 */
export async function linkUser(_params: LinkUserParams): Promise<LinkUserResult> {
  throw new Error("linkUser: not implemented");
}
