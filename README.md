# @seneca/sdk

The contract between limbs and the Seneca brain.

This SDK is the only way a limb (VECTOR, Grove, the Korean limb, future limbs) writes behavioral data into Seneca, reads a user's personalization state, or consumes derived insights. Limbs do not talk to Supabase or Anthropic directly. They talk to this SDK. The SDK talks to the brain.

## Architecture

Three public surfaces. Auth, rate limits, and data shapes differ per surface.

- `@seneca/sdk/ingest` — limbs write observations and session signals
- `@seneca/sdk/query` — limbs read user personalization state
- `@seneca/sdk/insights` — enterprise buyers read derived, anonymized insights

## Constitutional commitments

See CONSTITUTION.md in the seneca_ai repo. Load-bearing for this SDK:

1. The user owns their data. Every write is scoped to a user identity the user can export or delete.
2. Enterprise buyers never receive individual user records. Only derived insights or anonymized aggregates.
3. Every data access is auditable.

## Status

Pre-release. v0 of the spec. Not yet published to npm.

## Development

```
npm install
npm run typecheck
npm run test
npm run build
```
