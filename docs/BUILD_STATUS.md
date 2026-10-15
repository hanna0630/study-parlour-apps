# Build status
## Done (Stage 1 partial, Stage 2 start)
- package.json, .gitignore, .env.example (placeholders only)
- src/lib/money.ts + tests (exact minor-unit money)
- supabase/migrations/0001: roles, RLS, append-only credit ledger, record_credit()
## NOT run/verified
- npm install, tests, typecheck, build, and the migration against a real Supabase DB
- Dependency versions are unverified; check against current Next.js / OpenNext docs
## Next
- App shell (Next.js app dir), Supabase auth, i18n, invoices/payments schema (migration 0002)
