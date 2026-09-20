# Architecture

Circa is a database-backed Next.js application organised around a **pure domain core** that is deliberately isolated from the UI and the database.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│  app/  (Next.js App Router)                                   │
│  Server Components render pages; Client Components handle      │
│  interactivity (filters, scenario modeller, assessment form). │
└───────────────┬───────────────────────────┬──────────────────┘
                │                           │
        server/queries.ts            server/actions.ts
        (read, server-only)          (mutations, "use server")
                │                           │
                └───────────┬───────────────┘
                            │
                     db/ (Drizzle + Neon)      domain/ (pure TS)
                     schema, client, seed      scoring, scenarios,
                                               recommendations
```

- **`domain/`** — pure, deterministic TypeScript. No React, no database, no I/O. It owns the scoring engine, the financial scenario modeller and the recommendation engine, plus the controlled vocabularies in `constants.ts`. Everything here is unit-tested.
- **`db/`** — Drizzle schema (`schema.ts`), a lazily-initialised Neon client (`client.ts`), a migration runner (`migrate.ts`), and a deterministic seed (`seed-core.ts` + `seed-data.ts`). The seed **derives** scores, scenarios and recommendations from the domain engine, so the database can never disagree with the engine.
- **`server/`** — `queries.ts` (server-only reads) and `actions.ts` (`"use server"` mutations). This is the only place the app talks to the database.
- **`lib/`** — centralised Zod validation, formatting, pure analytics helpers, and the compact view-model types shared between server and client components.
- **`components/`** — shadcn-style UI primitives, Recharts chart wrappers, the app shell, and feature components. Scoring logic never lives here; components render values the domain layer produced.
- **`app/`** — routes. Data-heavy pages are `force-dynamic` server components; interactivity is delegated to small client components.

## Key decisions

### Drizzle over Prisma

We use **Drizzle ORM** rather than Prisma:

- **Serverless fit.** Drizzle pairs cleanly with Neon's HTTP driver (`drizzle-orm/neon-http`), giving low cold-start overhead on Vercel with no separate query engine binary to ship.
- **Type inference from schema.** `$inferSelect` gives end-to-end types straight from `schema.ts` without a code-generation step.
- **Typed JSONB.** Rich engine-facing structures (assessment inputs, scenario assumptions) are stored as `jsonb(...).$type<T>()`, keeping the scoring engine as the single source of truth for those shapes while remaining strongly typed.
- **Lightweight migrations.** `drizzle-kit generate` produces plain SQL we commit under `drizzle/`.

Prisma would also work; Drizzle was the better fit for a Neon + Vercel serverless target with heavy typed-JSON use.

### The engine is the source of truth

The `scores` table stores the numeric summary and a recalculation timestamp for fast dashboard aggregation and sorting. The **full score bundle** (components, drivers, missing-evidence flags) is **recomputed in-app** from `assessments.inputs` via `computeScores()`. Because the engine is deterministic, the recomputed bundle is identical every time, and there is no risk of a stale cached explanation diverging from the stored numbers.

### Server Components + Server Actions

Reads happen in server components through `server/queries.ts`. Mutations (scenario edits, score recalculation, assessment saves, demo reset) are Server Actions in `server/actions.ts`, each validating its input through Zod before touching the database and writing an audit event. This keeps the database server-side only; the connection string never reaches the browser.

### Lazy database client

`db/client.ts` initialises the Neon client lazily behind a Proxy, so importing the module never fails at build time when `DATABASE_URL` is absent — the error is raised only if a query is actually attempted without a connection string.

## Data flow example (scenario edit)

1. `/scenarios/[id]` (server) loads the baseline and four scenario assumption sets via `getBusinessDetail`.
2. The `ScenarioModeller` client component recomputes all four scenarios locally with `computeScenarioSet` as the user drags a lever — instant feedback, no round-trip.
3. On **Save**, `updateScenarioAction` validates the assumptions with Zod, persists them, writes an audit event and revalidates affected paths.

## Deployment

- **Hosting:** Vercel, connected to `Imomazin/circa`. The development branch deploys as a **preview**; `main` is never used for deployment in this demonstrator.
- **Database:** Neon project `circa`. `DATABASE_URL` is configured as an encrypted environment variable in Vercel and never committed.
- **Runtime:** Node 20+ (Vercel-supported). Pages that read data are `force-dynamic`, so they render on demand against the live database.
