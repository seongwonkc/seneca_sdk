import type { DeleteUserDataParams } from "./types.js";

/**
 * Permanently delete every record scoped to a user.
 * Requires a confirmation token issued by the Seneca app after the user
 * confirms the action. Not reversible.
 */
export async function deleteUserData(_params: DeleteUserDataParams): Promise<void> {
  throw new Error("deleteUserData: not implemented");
}
