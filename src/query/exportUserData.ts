import type { ExportUserDataParams } from "./types.js";

/**
 * Export every piece of data the brain holds for a user, in a format
 * the user can keep. Constitutional commitment — this must always work.
 */
export async function exportUserData(
  _params: ExportUserDataParams,
): Promise<ReadableStream<Uint8Array>> {
  throw new Error("exportUserData: not implemented");
}
