> Use this format for every workstream report.
> No prose summaries. No improvised sections.
> Fill every section. Write "none" if a section is empty — don't omit it.

---

## Workstream D1b complete

### Test result

```
> @seneca/sdk@0.0.1 test
> vitest run

 RUN  v4.1.5

 ✓ tests/unit/ingest/observe.test.ts (20 tests) 14ms
 ✓ tests/unit/internal/http/client.test.ts (7 tests) 9ms
 ✓ tests/unit/ingest/sessionSignal.test.ts (9 tests) 11ms
 ✓ tests/unit/ingest/linkUser.test.ts (5 tests) 9ms
 ✓ tests/unit/query/baselineDirective.test.ts (5 tests) 7ms
 ✓ tests/unit/query/getUserModel.test.ts (5 tests) 8ms
 ✓ tests/unit/version.test.ts (1 test) 3ms

 Test Files  7 passed (7)
      Tests  52 passed (52)
   Start at  13:29:46
   Duration  4.28s (transform 287ms, setup 0ms, import 649ms, tests 62ms, environment 1ms)
```

- **Command:** `npm test` (→ `vitest run`)
- **Pass count:** 52 / 52
- **Baseline before workstream:** 45 passing
- **Delta:** +7 new tests

---

### Modified files

none

---

### New files

- `tests/unit/internal/http/client.test.ts` — new — 124 lines — `gatewayPost` adversarial tests: UNAUTHORIZED→UnauthorizedError, TOKEN_SPENT→TokenSpentError, VALIDATION→ValidationError with message propagation, fallback codes (UNSUPPORTED_VERSION/NOT_IMPLEMENTED/INTERNAL)→SenecaError, unknown code preserved on error, non-JSON response→SenecaError INTERNAL, missing env var→plain Error before fetch

---

### Spec deviations

none — 7 tests, within the 51–53 predicted range (45 + 7 = 52). Tests 4–6 implemented as a single parameterized `it()` block with an inline `for` loop rather than `it.each()` (which would generate 3 separate vitest entries). This matches the spec's "counts as 1 toward delta" option and keeps total within range.

---

### Flagged for Codex

- `tests/unit/internal/http/client.test.ts:94` — The test for missing env var uses `process.env["SENECA_SDK_GATEWAY_URL"] = ""` (empty string) rather than `delete process.env[...]`. Both trigger `getEnv`'s `if (!val)` guard identically. The empty-string approach avoids TypeScript strictness issues with delete on indexed env properties under `exactOptionalPropertyTypes: true`. No functional difference, but if a future test needs to distinguish between missing key and empty-string key, this pattern would need revisiting.

---

### Open questions for Kevin

none

---

### Commit sequence

1. `test(internal/http): add gatewayPost adversarial coverage — 52/52 pass` — files: `tests/unit/internal/http/client.test.ts`

---

### Deploy risk

none — new test file only; no production code changed.
