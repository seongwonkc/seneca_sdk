# Run from D:\GitHub\seneca_sdk
# Stages all Week 1 implementation files + CLAUDE.md, commits, and pushes to origin/main

git add `
  src/types/errors.ts `
  src/ingest/linkUser.ts `
  src/ingest/observe.ts `
  src/internal/http/client.ts `
  src/internal/supabase/client.ts `
  tests/unit/ingest/linkUser.test.ts `
  tests/unit/ingest/observe.test.ts `
  package.json `
  CLAUDE.md

git commit -m "feat(ingest): implement linkUser + observe + shared HTTP client; add typed errors, tests, CLAUDE.md"

git push origin main
