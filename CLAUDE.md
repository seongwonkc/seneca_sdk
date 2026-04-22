# CLAUDE.md — @seneca/sdk

This file tells Claude what to read before touching anything in this repo.

---

## Before you write a single line of code

Read **SDK_DESIGN.md** at the repo root. It is the source of truth for every method signature, error code, auth model, and audit requirement in v0.1. If behavior is ambiguous after reading it, stop and ask. Do not guess.

---

## Repo layout

```
src/
  index.ts                  — public re-exports only
  version.ts                — SDK_VERSION constant
  ingest/                   — limbs write to the brain
    linkUser.ts             — links limbUserId -> senecaUserId via one-time token
    observe.ts              — writes behavioral observations (max 10 per call)
    sessionSignal.ts        — STUB in v0.1
    types.ts                — all ingest param/result types
  query/                    — limbs read from the brain
    getUserModel.ts         — STUB in v0.1
    exportUserData.ts       — STUB in v0.1
    deleteUserData.ts       — STUB in v0.1
    types.ts
  insights/                 — enterprise surface, STUB in v0.1
    queryInsights.ts
    types.ts
  internal/
    http/client.ts          — gatewayPost(): shared fetch wrapper, error parsing
    auth/limbKey.ts         — timingSafeEqual, validateLimbKey
    audit/log.ts            — writeAudit() stub (gateway handles audit writes)
    supabase/client.ts      — STUB: SDK routes through gateway, not direct Supabase
    anthropic/client.ts     — STUB
  types/
    errors.ts               — SenecaError hierarchy (all typed errors live here)
tests/
  unit/
    version.test.ts
    ingest/
      linkUser.test.ts      — 5 tests (success, validation, token errors, conflict)
      observe.test.ts       — 6 tests (success, validation, no bridge)
```

---

## Key architecture rules

**The SDK never talks to Supabase directly.** All data operations route through the Netlify gateway function in the `seneca_ai` repo (`netlify/functions/seneca-sdk-gateway.js`). The `src/internal/supabase/client.ts` module is intentionally a stub that throws.

**Transport:** `gatewayPost(surface, method, body)` in `src/internal/http/client.ts`. It reads `SENECA_SDK_GATEWAY_URL`, `SENECA_LIMB_NAME`, `SENECA_LIMB_KEY`, `SENECA_SDK_VERSION` from env. Never hardcode these.

**Auth:** Every request carries `x-seneca-spec-version`, `x-limb-name`, and `x-limb-key` headers. The gateway validates the limb key using `LIMB_KEY_<UPPERCASE_NAME>` env vars with constant-time comparison.

**Errors:** All gateway errors map to typed subclasses of `SenecaError` in `src/types/errors.ts`. Add new error classes there; do not throw plain `Error` objects from SDK methods.

**Client-side validation:** Each SDK method validates its own params before the network call. See `linkUser.ts` and `observe.ts` for the pattern.

---

## Environment variables (dev)

See `.env` at repo root. Fill in `SUPABASE_SERVICE_KEY` and `ANTHROPIC_API_KEY` from Netlify env vars. `SENECA_LIMB_KEY` is already filled in for the VECTOR limb.

---

## Test runner

```bash
npm test          # vitest run (requires vitest >= 4.1.5 — earlier versions crash on this CPU)
npm run typecheck # tsc --noEmit
```

Vitest 1.x used rollup's native binary which bus-errors on the sandbox CPU (AMD Ryzen 6800H). The package.json pins vitest to ^4.1.5. Do not downgrade.

---

## Companion repo

The gateway and all Supabase schemas live in `seneca_ai` (sibling directory at `D:\GitHub\seneca_ai`). Its `CLAUDE.md` has the full architectural picture. When in doubt about what the gateway does, read `netlify/functions/seneca-sdk-gateway.js` there.

---

## What is NOT done in v0.1

- `sessionSignal` — stub, returns NOT_IMPLEMENTED
- `getUserModel` — stub
- `exportUserData` — stub
- `deleteUserData` — stub
- `queryInsights` — stub, enforces minCohortSize >= 50 client-side but throws NOT_IMPLEMENTED

Do not implement these until Week 2 of the implementation plan.
