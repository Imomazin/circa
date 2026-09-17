# Architecture

## Request path

Next.js Server Components read the presenter session and query PostgreSQL through Drizzle. Client components handle filtering, chart rendering, forms and immediate financial previews. JSON route handlers validate inputs and scope every operation to the server-resolved workspace. Scenario writes and score recalculation run in a database transaction.

The browser receives synthetic commercial data, never database credentials. The PostgreSQL pool is created lazily with at most five connections and is attached to Vercel's pool lifecycle when deployed. There is no external LLM dependency.

## ORM decision

Drizzle provides typed PostgreSQL schema definitions, versioned SQL migrations and explicit transaction control without a generated database client. This keeps the demonstrator's deployment surface small and makes the commercial records easy to inspect. Prisma was not trialled or rejected as incompatible. Drizzle was selected for this application's direct PostgreSQL and serverless workflow.

## Dependency compatibility

Next.js 16.3.5 was verified against the official installation documentation and npm registry on 17 September 2026. Node 24 is supported by Vercel. TypeScript 7 caused the installed Next.js lint dependency to fail, so TypeScript 6 is pinned. ESLint 10 uses the official @eslint/compat adapter for legacy React plugin context methods. All lint rules remain enabled. npm reports peer-range warnings for those plugins; the adapter permits the complete rule set to run. All resolved versions are in package-lock.json.

## Boundaries

- `lib/scoring`: pure, tested financial and score functions
- `lib/validation`: authoritative input schemas
- `lib/db`: relational schema and server database pool
- `lib/services`: workspace-scoped queries, transactions and HTTP checks
- `lib/demo`: deterministic synthetic data values
- `components/domain`: product workflows
- `components/charts`: database-derived charts

Future evidence and narrative providers should implement an explicit interface such as `EvidenceProvider.summarise(assessment, sources)`. No provider is connected. Any generated material would need source provenance and human review before inclusion in an investment case.

## Hosting and data

Each product has its own repository and Neon project. Circa's database is in London. No unrelated project is used. Preview-only deployment is the intended release mode. The production branch remains unmerged.
