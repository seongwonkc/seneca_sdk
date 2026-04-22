/**
 * Validate a limb's API key against the allowed-keys registry.
 * Keys are stored in env as LIMB_KEY_<UPPERCASE_LIMB_NAME>.
 */
export function validateLimbKey(limbName: string, providedKey: string): boolean {
  const envKey = `LIMB_KEY_${limbName.toUpperCase()}`;
  const expected = process.env[envKey];
  if (!expected) return false;
  return timingSafeEqual(providedKey, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
