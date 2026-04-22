# Seneca SDK — Design Specification

**Version:** v0.1
**Status:** Implementation-ready
**Last updated:** April 22, 2026
**Audience:** Cowork, implementing. Future Claude, reviewing. Kevin, referencing.

---

## What this document is

This is the spec Cowork implements against over the next three weeks. It defines every public method in v0.1 of `@seneca/sdk`, the data contracts on each, the auth model, the error surface, the audit requirements, and the underlying storage changes each method requires.

This document is imperative. "MUST", "MUST NOT", and "SHOULD" carry RFC 2119 meaning. If a method's behavior is ambiguous after reading this doc, stop and ask. Do not guess.

Out of scope for v0.1 (listed at the end): enterprise insights surface, session signal batching, streaming chat. These are stubs in the scaffold. Leave them as stubs.

---

## Scope of v0.1

The goal of v0.1 is a working contract between VECTOR and the Seneca brain. Specifically:

1. A VECTOR user can link their VECTOR account to a Seneca identity via an explicit consent flow.
2. VECTOR can write behavioral observations about a linked user after every answered question.
3. VECTOR can write a session signal after every completed session.
4. VECTOR can read the linked user's current personalization state.
5. Every user can export their data as JSON.
6. Every user can permanently delete their data with a confirmation token.
7. Every data access writes an audit row the user can later query.

That is the entire v0.1 surface. Seven capabilities. Everything else is deferred.

---

## Non-goals for v0.1

- **No enterprise insights endpoint.** The `insights` surface exists as a stub so Cowork does not accidentally add it elsewhere. Method throws "not implemented" in v0.1.
- **No chat streaming.** VECTOR does not need the chat endpoint in v0.1. The consumer Seneca app at seneca-ai.netlify.app continues to use its existing `seneca.mjs` function unchanged. SDK absorption of chat happens in v0.2.
- **No question-bank access.** Questions stay in shared Supabase and limbs read them directly. The SDK wraps behavioral data, not static reference data.
- **No wrapping of existing consumer Seneca paths.** Do not refactor `netlify/functions/seneca-session.js` or `seneca-nightly.js` in this iteration. The SDK is new code. Migration of existing code happens in v0.2.

---

## Architecture

### The three surfaces

```
@seneca/sdk
│
├── /ingest     — limbs write data to the brain
│   ├── linkUser          → create bridge between limb user and Seneca identity
│   ├── observe           → write behavioral observations
│   └── sessionSignal     → write structured end-of-session signal
│
├── /query      — limbs read from the brain
│   ├── getUserModel      → read current personalization state
│   ├── exportUserData    → export full history (constitutional commitment)
│   └── deleteUserData    → permanent delete (constitutional commitment)
│
└── /insights   — [v0.2+] enterprise buyers read derived patterns
    └── queryInsights     → STUB in v0.1, throws not implemented
```

### Why three surfaces

Different auth models. Ingest uses a per-limb API key stored server-side by the limb. Query uses the same limb API key plus a scoped user context (the limb must have already linked the user). Insights will use a signed enterprise contract scope with a minimum cohort size enforced server-side. Mixing these in one surface invites permission leaks.

### Transport

All SDK methods are thin wrappers over HTTPS calls to a new Netlify function, `seneca-sdk-gateway`, living in the `seneca_ai` repo under `netlify/functions/seneca-sdk-gateway.js`. The function dispatches on URL path and calls into the appropriate handler.

Path shape: `POST /.netlify/functions/seneca-sdk-gateway/<surface>/<method>`

Examples:
- `POST .../seneca-sdk-gateway/ingest/observe`
- `POST .../seneca-sdk-gateway/query/getUserModel`
- `POST .../seneca-sdk-gateway/ingest/linkUser`

Single function, one entry point, path-based dispatch. Easier to deploy, easier to add middleware (auth, rate limit, audit) in one place, easier to log.

### Versioning

Every request MUST include a header: `x-seneca-spec-version: 0`

The gateway validates this header and rejects requests without it or with unsupported versions. Current supported version: `0`. Previous version support policy: when v1 ships, v0 is supported for 90 days, then rejected with a 410 Gone.

The SDK client sends this header automatically — limbs do not construct it manually.

---

## Authentication model

### Limb API keys

Each limb gets a UUID-format API key. Stored in Netlify environment variables as `LIMB_KEY_<UPPERCASE_NAME>`. For VECTOR: `LIMB_KEY_VECTOR`.

Keys are generated with:

```bash
node -e "console.log(require('crypto').randomUUID())"
```

Generated keys MUST NOT be committed to the repo. They are pasted into Netlify env config directly.

### Request authentication

Every SDK request includes two headers:

```
x-limb-name: vector
x-limb-key: <uuid>
```

The gateway validates:
1. `x-limb-name` resolves to an env var `LIMB_KEY_<UPPERCASE>`.
2. `x-limb-key` matches that env var exactly (constant-time comparison).
3. The user identified in the request body has an active bridge for this limb (except for `linkUser`, which creates the bridge).

Auth failure at any step returns `401 Unauthorized` with error code `UNAUTHORIZED`.

### User identity model

Two kinds of user IDs exist and MUST NOT be confused.

**`senecaUserId`** — a UUID. The canonical Seneca identity. Never exposed to limb client code. Never sent to limb frontends. The SDK returns it in responses so the limb's backend can store a reference, but the limb should treat it as opaque.

**`limbUserId`** — a string. Whatever identifier the limb uses for the same human in its own system. For VECTOR, this is the Supabase auth UID in the VECTOR database. For Grove, it will be Grove's own user ID.

A bridge row in `seneca_limb_bridges` maps each `(limbName, limbUserId)` pair to exactly one `senecaUserId`.

Limbs always send `limbUserId` in requests. The gateway resolves it to `senecaUserId` via the bridge table. If no active bridge exists, most methods return `404 NOT_FOUND`. The exception is `linkUser`, which is how bridges are created.

### Seneca account creation

Seneca identities are NEVER created implicitly by a limb call. A user must have an existing `seneca_users` row before any limb can link to it. This is a constitutional commitment (CONSTITUTION.md, Rule 2 of user-owned architecture).

The creation flow:
1. User visits seneca-ai.netlify.app
2. User signs up (OTP email or Google OAuth)
3. User's `seneca_users` row is created
4. User navigates to Settings → Connected Apps in Seneca
5. User clicks "Link VECTOR" (or any other limb)
6. Seneca generates a one-time `senecaLinkToken` (UUID, 15 minute expiry)
7. User copies the token or is redirected back to VECTOR with it
8. VECTOR backend calls `ingest.linkUser({ senecaLinkToken, limbUserId })` with the token
9. Gateway validates the token, creates the bridge row, marks the token as used

Tokens are single-use. A used token returns `401 UNAUTHORIZED` with code `TOKEN_SPENT`. An expired token returns `401` with code `TOKEN_EXPIRED`.

---

## Data contracts — ingest surface

### `ingest.linkUser(params)`

Creates a bridge between a limb user and a Seneca identity.

**Request body:**

```typescript
{
  senecaLinkToken: string;  // UUID from seneca_link_tokens
  limbUserId: string;       // limb's own user ID
}
```

**Response (200):**

```typescript
{
  senecaUserId: string;  // the canonical Seneca UUID, opaque to limb
  linkedAt: string;      // ISO8601
}
```

**Errors:**
- `401 TOKEN_EXPIRED` — token past its expiry
- `401 TOKEN_SPENT` — token was already used
- `401 UNAUTHORIZED` — limb key invalid
- `409 BRIDGE_EXISTS` — this `(limbName, limbUserId)` pair is already bridged to a different `senecaUserId`. Limb should not retry; user should resolve via Seneca app settings.

**Audit row written:** `{action: "write", surface: "ingest", method: "linkUser"}`

**Storage changes:**
- INSERT one row in `seneca_limb_bridges`
- UPDATE `seneca_link_tokens` set `used_at = now()`

---

### `ingest.observe(params)`

Writes behavioral observations about a user. Fire-and-forget from the limb's perspective.

**Request body:**

```typescript
{
  limbUserId: string;
  observations: Array<{
    observation: string;              // <= 500 chars, third-person clinical tone
    category: "behavioral" | "cognitive" | "emotional" | "preference" | "performance";
    confidence: number;               // 0.0–0.7; values >0.7 are clamped
    signalType?: "test_behavior" | "engagement" | "error_pattern" | "breakthrough" | "avoidance";
    sessionRef?: string;              // limb-side session ID, for traceability
    questionData?: {                  // OPTIONAL: structured per-question signal for test-prep limbs
      questionId: string;
      isCorrect: boolean;
      timeSpentSeconds: number;
      wasFlagged: boolean;
      numberOfChanges: number;
      positionInSession: number;
      skippedFirstTime: boolean;
    };
  }>;
}
```

**Constraints enforced server-side:**
- `observations.length` between 1 and 10
- Each `observation` string truncated to 500 chars
- Each `confidence` value clamped to `Math.min(0.7, value)` and `Math.max(0.0, value)`
- `limbUserId` must resolve to an active bridge; else `404 NOT_FOUND`

**Response (200):**

```typescript
{
  senecaUserId: string;
  memoryIds: string[];  // one per observation
}
```

**Errors:**
- `401 UNAUTHORIZED` — limb key invalid
- `404 NOT_FOUND` — no active bridge for `limbUserId`
- `400 VALIDATION` — payload shape invalid
- `429 RATE_LIMITED` — see rate limits

**Audit row written:** `{action: "write", surface: "ingest", method: "observe"}`

**Storage changes:**
- INSERT N rows in `seneca_memory` (one per observation)
- If `questionData` present, INSERT one row in `vector_question_attempts` (new table, see migrations)

**Observation field semantics for test-prep (the per-question signal):**

When `questionData` is present, the SDK writes both a `seneca_memory` row (for the brain's behavioral model) AND a structured `vector_question_attempts` row (for longitudinal analytics). The `seneca_memory` row contains a synthesized natural-language observation derived server-side from the structured data — the limb does NOT have to compose this sentence. The SDK owns the phrasing.

Example synthesis, server-side:
- Structured input: `{isCorrect: false, timeSpentSeconds: 8, wasFlagged: false, numberOfChanges: 3}`
- Synthesized observation: "Student rushed a question and changed their answer three times before committing to a wrong answer."

This keeps behavioral narrative consistent across all limbs. Limbs provide structured data; the SDK composes the sentence.

---

### `ingest.sessionSignal(params)`

Writes a structured end-of-session signal. Called once when a limb session completes.

**Request body:**

```typescript
{
  limbUserId: string;
  session: {
    sessionRef: string;               // limb-side session ID
    startedAt: string;                // ISO8601
    endedAt: string;                  // ISO8601
    durationMinutes: number;
    topics: string[];                 // limb-defined taxonomy
    context: "timed_practice" | "review" | "diagnostic" | "untimed_practice";
    // Test-prep specific (optional, null for non-test-prep limbs)
    totalQuestionsAttempted?: number;
    totalCorrect?: number;
    sectionsCompleted?: string[];
    completedFullSession?: boolean;
    firstQuartileAvgSeconds?: number;
    lastQuartileAvgSeconds?: number;
  };
}
```

**Response (200):** `{ senecaUserId: string }`

**Errors:** same as `observe`.

**Audit row written:** `{action: "write", surface: "ingest", method: "sessionSignal"}`

**Storage changes:**
- INSERT one row in `seneca_limb_sessions`

The "fade" signal (`lastQuartileAvgSeconds - firstQuartileAvgSeconds > threshold`) is derived server-side when the session signal is written, and may result in an automatic behavioral observation being written to `seneca_memory` at confidence 0.5. This derivation happens inside the SDK; limbs do not send the observation.

---

## Data contracts — query surface

### `query.getUserModel(params)`

Returns the current personalization state for a linked user.

**Request body:**

```typescript
{
  limbUserId: string;
}
```

**Response (200):**

```typescript
{
  senecaUserId: string;
  phase: 1 | 2 | 3;                   // onboarding → trust → deep
  agtOrientation: number;             // -1.0 (shortcuts) to 1.0 (understanding)
  agtConfidence: number;              // 0.0–1.0
  baselineDirective: string | null;   // computed at read time
  totalSessions: number;
  language: "ko" | "en";
  activeMemories: Array<{
    category: string;
    observation: string;
    confidence: number;
  }>;
}
```

**Critical implementation note: `baselineDirective`**

The current `seneca_users.baseline_directive` column is a denormalized stored string that gets mutated ad-hoc. This is a bug that will rot at scale. In the SDK implementation, `baselineDirective` MUST be computed at read time from the user's active memories, not read from the stored column.

Algorithm for computing at read time:
1. Fetch top 5 `seneca_memory` rows for user where `confidence >= 0.6`, ordered by confidence desc
2. Pass to a Haiku call with a prompt: "Given these behavioral observations about a student, produce a single sentence directive for how a tutor should approach this student."
3. Cache the result in a new table `seneca_baseline_cache` keyed by `(senecaUserId, memoryFingerprint)` where `memoryFingerprint` is a hash of the memory IDs used.
4. Return the cached string. If no memories meet the threshold, return `null`.

The stored `seneca_users.baseline_directive` column is NOT removed in v0.1 — the consumer Seneca app still reads from it. It becomes a denormalized cache of the SDK computation. Write path unification happens in v0.2.

**Errors:**
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`
- `429 RATE_LIMITED`

**Audit row written:** `{action: "read", surface: "query", method: "getUserModel"}`

**Storage changes:** may INSERT/UPDATE one row in `seneca_baseline_cache`.

---

### `query.exportUserData(params)`

Returns every record the brain holds for a user. Constitutional commitment — this method MUST always succeed for a valid user, regardless of system load.

**Request body:**

```typescript
{
  limbUserId: string;
  format: "json" | "ndjson";
}
```

**Response (200):** `ReadableStream<Uint8Array>` — streams the export so large histories don't OOM the function.

**Export payload includes:**
- `seneca_users` row (the user's profile)
- All `seneca_memory` rows
- All `seneca_sessions` rows
- All `seneca_transcripts` rows
- All `seneca_limb_sessions` rows for this user across all limbs
- All `vector_question_attempts` rows if the user is bridged to VECTOR
- All `seneca_limb_bridges` rows for this user
- All `seneca_audit_log` rows for this user

**Errors:**
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`

**Audit row written:** `{action: "export", surface: "query", method: "exportUserData"}`

**Storage changes:** none (read-only).

---

### `query.deleteUserData(params)`

Permanently deletes every record scoped to a user. Constitutional commitment.

**Request body:**

```typescript
{
  limbUserId: string;
  confirmationToken: string;  // issued by Seneca app after user confirmation
}
```

**Confirmation token flow:**
1. User navigates to Seneca app → Settings → Delete my data
2. Seneca app shows a confirmation screen explaining what happens
3. User confirms; Seneca app calls an internal endpoint that generates a `seneca_delete_tokens` row (UUID, 10 minute expiry, single-use)
4. User is given the token to paste into VECTOR (or any limb) if they want to delete via that limb, OR the Seneca app itself performs the deletion directly

The limb-initiated delete path exists so a user who has decided they are done with Seneca can start the deletion from inside whatever limb they use most, without hunting for the Seneca app.

**Response (200):**

```typescript
{
  deletedAt: string;
  recordsDeleted: {
    memories: number;
    sessions: number;
    transcripts: number;
    bridges: number;
    limbSessions: number;
    questionAttempts: number;
  };
}
```

**What gets deleted:**
- All `seneca_memory` rows for the user
- All `seneca_sessions` rows
- All `seneca_transcripts` rows
- All `seneca_limb_sessions` rows across all limbs
- All `vector_question_attempts` rows
- All `seneca_limb_bridges` rows
- All `seneca_baseline_cache` rows
- The `seneca_users` row itself

**What is retained (and disclosed in the confirmation screen):**
- Anonymized aggregate counters in analytics tables (no user identifier)
- Audit log rows, retained for 90 days post-deletion for compliance, then hard-deleted

**Errors:**
- `401 UNAUTHORIZED`
- `401 TOKEN_EXPIRED` / `401 TOKEN_SPENT`
- `404 NOT_FOUND`

**Audit row written:** `{action: "delete", surface: "query", method: "deleteUserData"}` — written BEFORE the deletion cascade, so the audit trail survives the deletion of the user.

**Storage changes:** cascading delete across all user-scoped tables.

---

## Rate limits

Per-limb, enforced server-side via Supabase rate limit table with sliding 60-second windows.

| Method | Limit |
|--------|-------|
| `ingest.linkUser` | 20 / limb / minute |
| `ingest.observe` | 600 / limb / minute (10/sec sustained) |
| `ingest.sessionSignal` | 120 / limb / minute |
| `query.getUserModel` | 300 / limb / minute |
| `query.exportUserData` | 5 / limb / minute per user |
| `query.deleteUserData` | 10 / limb / minute |

Exceeding the limit returns `429 RATE_LIMITED` with a `Retry-After` header in seconds.

Rate limits are per-limb, not per-user. A limb can distribute its budget across its users as it sees fit. Future v0.2 may add per-user sub-limits.

---

## Error model

All error responses follow this shape:

```typescript
{
  error: {
    code: string;          // stable identifier, e.g. "UNAUTHORIZED"
    message: string;       // human-readable, may change
    statusCode: number;    // HTTP status
    specVersion: 0;        // for client debugging
  };
}
```

Error codes (stable across versions within a major spec version):

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid limb key |
| `TOKEN_EXPIRED` | 401 | Link or delete token past expiry |
| `TOKEN_SPENT` | 401 | Token was already used |
| `NOT_FOUND` | 404 | User or bridge not found |
| `BRIDGE_EXISTS` | 409 | Bridge conflict on link |
| `VALIDATION` | 400 | Request body invalid |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `PRIVACY_VIOLATION` | 403 | Attempted access outside user scope |
| `UNSUPPORTED_VERSION` | 400 | x-seneca-spec-version header invalid |
| `INTERNAL` | 500 | Unexpected error, investigate |

Client SDK methods throw typed errors derived from `SenecaError` (already stubbed in `src/types/errors.ts`) so limb code can do:

```typescript
try {
  await observe({...});
} catch (e) {
  if (e instanceof RateLimitedError) { /* back off */ }
  else if (e instanceof NotFoundError) { /* user not linked */ }
  else throw e;
}
```

---

## Audit log

Every method call on the ingest or query surface writes exactly one row to `seneca_audit_log`.

Schema:

```sql
CREATE TABLE seneca_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id  uuid NOT NULL,
  actor           text NOT NULL,  -- 'limb' | 'user' | 'system'
  actor_id        text NOT NULL,  -- limb name or user id
  action          text NOT NULL,  -- 'read' | 'write' | 'export' | 'delete' | 'derive'
  surface         text NOT NULL,  -- 'ingest' | 'query' | 'insights'
  method          text NOT NULL,  -- method name
  request_id      text,           -- correlation id for logs
  timestamp       timestamp DEFAULT now(),
  spec_version    int NOT NULL
);

CREATE INDEX idx_audit_user ON seneca_audit_log(seneca_user_id, timestamp DESC);
CREATE INDEX idx_audit_actor ON seneca_audit_log(actor_id, timestamp DESC);
```

Users can query their own audit log via a future `query.getAuditLog` method (v0.2).

Audit writes happen AFTER the main operation succeeds, except for `deleteUserData` which writes the audit row BEFORE the cascade delete (so the trail survives).

Audit failure MUST NOT fail the main operation. An audit write that errors is logged to stderr and the method still returns 200 to the limb. This is a deliberate trade-off — we want reliable service over perfect audit completeness. Future improvement: write audits to a durable queue instead.

---

## Database migrations required

Cowork creates these as SQL files in the `seneca_ai` repo's `sql/` directory, timestamped. They must be runnable in order with no errors.

### `sql/2026-04-23_sdk_bridges_and_tokens.sql`

```sql
-- Bridge table: maps limb users to Seneca identities
CREATE TABLE IF NOT EXISTS seneca_limb_bridges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id  uuid REFERENCES seneca_users(id) ON DELETE CASCADE,
  limb_name       text NOT NULL,
  limb_user_id    text NOT NULL,
  linked_at       timestamp DEFAULT now(),
  is_active       boolean DEFAULT true,
  UNIQUE(limb_name, limb_user_id)
);
CREATE INDEX idx_bridges_seneca_user ON seneca_limb_bridges(seneca_user_id);
CREATE INDEX idx_bridges_limb_user ON seneca_limb_bridges(limb_name, limb_user_id) WHERE is_active = true;

-- Single-use link tokens (user generates in Seneca app, pastes into limb)
CREATE TABLE IF NOT EXISTS seneca_link_tokens (
  token           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id  uuid REFERENCES seneca_users(id) ON DELETE CASCADE,
  created_at      timestamp DEFAULT now(),
  expires_at      timestamp DEFAULT now() + interval '15 minutes',
  used_at         timestamp
);

-- Single-use delete tokens
CREATE TABLE IF NOT EXISTS seneca_delete_tokens (
  token           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id  uuid REFERENCES seneca_users(id) ON DELETE CASCADE,
  created_at      timestamp DEFAULT now(),
  expires_at      timestamp DEFAULT now() + interval '10 minutes',
  used_at         timestamp
);

-- RLS: service role bypasses; no direct user access to these tables.
ALTER TABLE seneca_limb_bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE seneca_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE seneca_delete_tokens ENABLE ROW LEVEL SECURITY;
```

### `sql/2026-04-23_sdk_limb_sessions_and_attempts.sql`

```sql
-- Limb-agnostic session signal
CREATE TABLE IF NOT EXISTS seneca_limb_sessions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id             uuid REFERENCES seneca_users(id) ON DELETE CASCADE,
  limb_name                  text NOT NULL,
  session_ref                text,
  started_at                 timestamp,
  ended_at                   timestamp,
  duration_minutes           integer,
  topics                     text[],
  context                    text,
  total_questions_attempted  integer,
  total_correct              integer,
  sections_completed         text[],
  completed_full_session     boolean,
  first_quartile_avg_seconds double precision,
  last_quartile_avg_seconds  double precision,
  created_at                 timestamp DEFAULT now()
);
CREATE INDEX idx_limb_sessions_user ON seneca_limb_sessions(seneca_user_id, started_at DESC);
CREATE INDEX idx_limb_sessions_limb ON seneca_limb_sessions(limb_name, started_at DESC);

-- VECTOR-specific per-question structured data
CREATE TABLE IF NOT EXISTS vector_question_attempts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id       uuid REFERENCES seneca_users(id) ON DELETE CASCADE,
  question_id          text NOT NULL,
  session_ref          text,
  is_correct           boolean NOT NULL,
  time_spent_seconds   integer NOT NULL,
  was_flagged          boolean NOT NULL DEFAULT false,
  number_of_changes    integer NOT NULL DEFAULT 0,
  position_in_session  integer NOT NULL,
  skipped_first_time   boolean NOT NULL DEFAULT false,
  created_at           timestamp DEFAULT now()
);
CREATE INDEX idx_vqa_user ON vector_question_attempts(seneca_user_id, created_at DESC);
CREATE INDEX idx_vqa_question ON vector_question_attempts(question_id);

ALTER TABLE seneca_limb_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_question_attempts ENABLE ROW LEVEL SECURITY;
```

### `sql/2026-04-23_sdk_audit_and_cache.sql`

```sql
-- Audit log
CREATE TABLE IF NOT EXISTS seneca_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seneca_user_id  uuid NOT NULL,
  actor           text NOT NULL,
  actor_id        text NOT NULL,
  action          text NOT NULL,
  surface         text NOT NULL,
  method          text NOT NULL,
  request_id      text,
  timestamp       timestamp DEFAULT now(),
  spec_version    int NOT NULL
);
CREATE INDEX idx_audit_user ON seneca_audit_log(seneca_user_id, timestamp DESC);
CREATE INDEX idx_audit_actor ON seneca_audit_log(actor_id, timestamp DESC);

-- Baseline directive cache (computed at read time, cached by memory fingerprint)
CREATE TABLE IF NOT EXISTS seneca_baseline_cache (
  seneca_user_id      uuid PRIMARY KEY REFERENCES seneca_users(id) ON DELETE CASCADE,
  memory_fingerprint  text NOT NULL,
  directive           text,
  computed_at         timestamp DEFAULT now()
);

-- Rate limit tracking (sliding window counters per limb per method)
CREATE TABLE IF NOT EXISTS seneca_rate_limits (
  limb_name    text NOT NULL,
  method       text NOT NULL,
  window_start timestamp NOT NULL,
  count        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (limb_name, method, window_start)
);
CREATE INDEX idx_rate_limits_window ON seneca_rate_limits(window_start);

ALTER TABLE seneca_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE seneca_baseline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE seneca_rate_limits ENABLE ROW LEVEL SECURITY;
```

---

## Implementation order — three-week plan

### Week 1: Foundation

**Day 1–2: Migrations and gateway skeleton.** Apply the three SQL migrations. Create `netlify/functions/seneca-sdk-gateway.js` with path-based dispatch, limb auth validation, version header check, error envelope shape. No method logic yet — just the routing and middleware.

**Day 3–4: `linkUser`.** Full implementation end-to-end. Token generation endpoint in the Seneca app, token consumption in the SDK. Settings UI in `seneca-ai.netlify.app/profile.html` that generates tokens. Tests.

**Day 5: `observe`.** Structured data path AND the server-side sentence synthesis for `questionData`. Tests against representative VECTOR payloads.

**Deliverable at end of Week 1:** VECTOR can link a test user and write observations. Works in staging.

### Week 2: Read path and session signals

**Day 6–7: `getUserModel`.** Implement `baselineDirective` computed-at-read-time with caching. Memory fingerprint hashing. Haiku call.

**Day 8: `sessionSignal`.** Including the derived-fade behavioral observation logic.

**Day 9: Audit log write middleware.** Everything retrofit to write audit rows after successful ops.

**Day 10: Rate limiting middleware.** Sliding window implementation over `seneca_rate_limits` table.

**Deliverable at end of Week 2:** VECTOR can write observations, write session signals, and read back the user model. Rate limits enforced. Audit trail recording.

### Week 3: Constitutional commitments and hardening

**Day 11–12: `exportUserData`.** Streaming JSON/NDJSON response. Tests with large synthetic histories.

**Day 13: `deleteUserData`.** Confirmation token flow. Cascade delete. Audit-row-before-delete ordering.

**Day 14: End-to-end integration.** VECTOR is updated to call the SDK instead of writing directly to Supabase. The old direct-write path is deprecated but not removed — feature flag to switch between.

**Day 15: Documentation, error-path tests, deploy to prod.** Client SDK package published privately. VECTOR staging cutover. Production cutover gated on verification.

**Deliverable at end of Week 3:** VECTOR is running on the SDK in production. Export and delete work. Audit log populated. Rate limits holding. Ready for the second limb.

---

## What is explicitly deferred to v0.2

- `insights.queryInsights` — the enterprise-facing surface. Stub in v0.1.
- Absorption of `netlify/functions/seneca-session.js` and `seneca-nightly.js` into the SDK. They continue to work unchanged in v0.1.
- Streaming chat endpoint (`seneca.chat`).
- `query.getAuditLog` — user-facing audit history.
- Per-user sub-limits under the per-limb rate limit.
- Bridge transfer — if a user wants to move their `limbUserId` from one Seneca identity to another.
- Soft-delete (vs current hard-delete) with a grace period.
- Durable audit log queue.
- Multi-region deployment.

Each of these has a reason it is deferred. Shipping v0.1 is the goal. v0.2 is a separate design doc.

---

## Testing requirements

Every public SDK method in v0.1 must have:

1. **A unit test** for the client wrapper (validates request shape, adds headers, parses errors correctly). Located in `tests/unit/<surface>/<method>.test.ts`.
2. **An integration test** hitting a staging gateway with a real Supabase test schema. Located in `tests/integration/`. Skipped in CI unless staging credentials are available; run locally before every PR.
3. **A rate limit test** that confirms the method returns 429 past threshold.
4. **An audit test** that confirms the expected audit row shape is written.

Minimum coverage gate: 80% on `src/` in v0.1. Coverage gate rises to 90% in v0.2.

---

## Open questions for Kevin to resolve before Week 2

These are decisions I need from Kevin, not Cowork. Cowork should flag them early in implementation if they block progress.

1. **Staging environment.** Is there a staging Supabase project, or do we use the main `havatrfyuqqbidleplcf` project with a `_staging` suffix on table names? My recommendation: separate staging Supabase project, one-time setup cost, cleaner isolation.

2. **Client SDK publication target.** Private GitHub Packages registry, or private npm? My recommendation: GitHub Packages — already in the ecosystem, no additional account to manage.

3. **Error message localization.** Should error `message` fields be localizable (ko/en), or always English? My recommendation: always English in v0.1. Localization is limb-side concern; they can map error codes to localized strings themselves.

4. **Link token delivery UX.** Token displayed in Seneca app for user to copy, vs. redirect flow where Seneca redirects to VECTOR with token in URL. My recommendation: support both. Copy/paste for users who prefer it; redirect for smoother UX.

---

## Success criteria for v0.1

This ships when all of the following are true:

1. VECTOR in production writes every answered question through `ingest.observe` with `questionData`.
2. VECTOR in production writes every completed session through `ingest.sessionSignal`.
3. VECTOR in production reads `query.getUserModel` on session start and uses it for question selection.
4. Any user can click "Export my data" in the Seneca app and download a complete JSON archive.
5. Any user can click "Delete my data" in the Seneca app, confirm, and have all their records removed within 5 seconds.
6. The audit log contains a row for every SDK call from the past 90 days, queryable by Kevin manually.
7. Rate limits hold under a simulated load of 100 concurrent VECTOR users.
8. No method in `insights/` has been implemented — the stub still throws "not implemented."

When all eight are true, v0.1 is done and we plan v0.2.

---

## Appendix A — CLAUDE.md updates for the seneca_sdk repo

When v0.1 ships, update `seneca_sdk/CLAUDE.md` (currently doesn't exist — Cowork creates it) to include:

```markdown
# Seneca SDK — Project Context

## What this is
The contract between Seneca limbs and the Seneca brain.
Limbs import @seneca/sdk. They never call Supabase or Anthropic directly.

## Vision and product guidance
Constitutional commitments live in seneca_ai repo:
- CONSTITUTION.md — Rule 7 (no selling data), Rule 8 (user data ownership), Rule 9 (age-appropriate by construction)
- VISION.md — limbs-feed-brain architecture
- WORLDVIEW.md — memory is the foundation of relationship

## Stack
- TypeScript strict mode, ES modules only, Node 20+
- Vitest for tests, ESLint + Prettier, published as @seneca/sdk npm package
- Three surfaces: /ingest, /query, /insights (stub in v0.1)

## Do NOT do without asking
- Add new public methods beyond what SDK_DESIGN.md specifies
- Change the x-seneca-spec-version contract
- Skip audit writes
- Return individual user records from the insights surface
- Create Seneca identities implicitly from limb signups
```

---

## Appendix B — Reference to existing code being replaced (not yet)

This spec does NOT replace the following in v0.1. These continue to work unchanged and are absorbed in v0.2:

- `netlify/functions/seneca.mjs` — consumer Seneca chat, streaming
- `netlify/functions/seneca-session.js` — consumer session finalize
- `netlify/functions/seneca-nightly.js` — pattern synthesis cron
- `netlify/functions/seneca-scan.js` — mind map rendering
- `netlify/functions/seneca-upload.js` — marathon file upload
- `netlify/functions/seneca-template-feedback.js` — template feedback
- `seneca-auth.js` (client-side) — consumer auth wrapper

When v0.2 absorbs these, their behavioral writes go through `ingest.observe` and their reads go through `query.getUserModel`. The SDK becomes the single write path for Seneca's behavioral data, period.

---

*End of SDK_DESIGN.md v0.1.*
