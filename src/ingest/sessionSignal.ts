import type { SessionSignalParams } from "./types.js";

/**
 * Send a structured session signal after a limb session ends.
 * Optional but recommended for high-data limbs (VECTOR, etc).
 */
export async function sessionSignal(_params: SessionSignalParams): Promise<void> {
  throw new Error("sessionSignal: not implemented");
}
