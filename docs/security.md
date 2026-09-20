# Security

The GitHub repository is **public**. Every committed file is treated as externally visible.

## Secrets

- **No secrets are committed.** `DATABASE_URL`, passwords, tokens, API keys and private credentials live only in environment variables.
- `.gitignore` excludes `.env` and `.env.*` (except `.env.example`). `.env.example` contains **variable names only** — never values.
- Real database credentials are configured through the environment: `.env.local` locally (gitignored) and encrypted environment variables in Vercel.
- Before every push, staged changes are inspected for: `password`, `DATABASE_URL`, `token`, `secret`, `API key`, private email/phone, confidential partnership terms, non-public procurement material and client-sensitive information.

## Confidential material

- **No confidential Ambidexters × The DataKirk commercial arrangements** (revenue splits, partnership terms, private documents) are stored in this public repository.
- **No real business confidential data.** All demonstrator data is synthetic and illustrative.
- Aggregate/programme views do not expose business-level data unnecessarily.

## Application security posture

- **Server-side database access only.** `src/db/client.ts` is imported only from server components, server actions and route handlers (enforced by a `server-only` import in `server/queries.ts`). The connection string never reaches the browser.
- **Centralised input validation.** All server actions validate their inputs with Zod (`src/lib/validation.ts`) before touching the engine or the database, bounding numeric ranges and rejecting unknown enums.
- **Parameterised queries.** Drizzle ORM parameterises all queries; no string-concatenated SQL is used in application code.
- **Guarded destructive actions.** The demo-data reset requires a typed `RESET` confirmation and is the only destructive UI action; it restores the deterministic seed.
- **Audit trail.** Material actions (assessment updates, score recalculations, scenario changes, demo resets) are recorded in `audit_events`.
- **No `dangerouslySetInnerHTML`** and no rendering of untrusted HTML; all displayed data is synthetic and typed.
- **`robots: noindex`** on the demonstrator to avoid indexing of a prototype.

## Dependency security

- Dependencies are pinned and `npm audit --omit=dev` is run as part of the pre-deployment check.
- **Next.js** is held at a patched **15.5.25** (addresses CVE-2025-66478).
- **drizzle-orm** is at **0.45.2** (addresses the SQL-identifier-escaping advisory GHSA-gpj5-g38j-94v9); **sharp** is patched.
- **Residual, accepted:** Next.js bundles its own copy of `postcss` which carries source-map advisories that only clear by upgrading to the Next 16 major. These are **build-time** issues that require attacker-controlled CSS; Circa authors all of its own stylesheets, so they are not exploitable in this application. A Next 16 upgrade is deferred to avoid a risky major bump mid-demonstrator and is tracked in `docs/known-limitations.md`.

## Reporting

This is a demonstrator, not a production system. Do not store real or sensitive data in it. If a secret is ever committed by mistake, rotate the credential immediately in Neon and Vercel and purge it from history before the branch is shared further.
