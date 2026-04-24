/**
 * INTENTIONAL STUB -- v0.1
 *
 * In v0.1, user data export is handled directly by the consumer endpoint
 * `seneca-export-data.js` (Netlify function), which is triggered from the
 * "Your Data" button in profile.html. It authenticates via Supabase JWT,
 * not a limb key, so it lives outside the SDK surface.
 *
 * The SDK client path (limb calling exportUserData on behalf of a user)
 * is deferred to v0.2. See V02_BACKLOG.md -- "SDK client path for exportUserData".
 *
 * Do NOT implement this by routing through the limb gateway. A new
 * consumer-scoped SDK method or a separate auth model will be needed.
 */
export async function exportUserData(_params) {
    throw new Error("exportUserData: intentional stub in v0.1. " +
        "Use the profile.html consumer endpoint for user-facing exports. " +
        "SDK client path is planned for v0.2 -- see V02_BACKLOG.md.");
}
//# sourceMappingURL=exportUserData.js.map