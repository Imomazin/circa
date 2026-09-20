# Circa

**Commercial decision intelligence for circular economy opportunities.**

Circa helps organisations answer one question: **does this circular business opportunity make commercial sense?** It scores commercial viability, resilience and investor readiness, models financial scenarios, and surfaces the evidence and actions behind each judgement — so SME leaders, advisers, programme teams and funders can make better commercial decisions about circular-economy moves.

> **Product demonstrator.** All demonstration data is synthetic. Scores and recommendations are prototype decision-support outputs, not validated measures. Nothing here implies Zero Waste Scotland or CivTech endorsement or a production deployment.

---

## CivTech challenge

Built in response to **CivTech 12.3**, sponsored by **Zero Waste Scotland**:

> *How can technology demonstrate the commercial value of circular economy business practices?*

**Partnership:** **Ambidexters Ltd** (technology, software engineering, AI, analytics, product and implementation lead) × **The DataKirk SCIO** (Scottish ecosystem knowledge, stakeholder insight, inclusion, community engagement, user research, data literacy and co-design).

See [`docs/civtech-alignment.md`](docs/civtech-alignment.md) for a requirement-by-requirement mapping.

---

## What it does

- **Executive dashboard** — portfolio-level commercial intelligence: viability by sector, capital by circular model, a viability-vs-evidence scatter that flags where to validate, distributions and an opportunity pipeline, all filterable.
- **Business directory & profiles** — searchable, sortable synthetic Scottish businesses with full commercial profiles, resource dependencies and supplier risks.
- **Assessment workflow** — a multi-step assessment that recomputes scores live as you edit, and persists inputs and recalculated scores.
- **Commercial scoring engine** — five transparent, deterministic dimensions: Commercial Viability, Commercial Resilience, Investor Readiness, Circular Opportunity and Evidence Confidence, each explained down to weighted components and drivers.
- **Financial scenario modeller** — baseline / circular base / upside / downside cases with editable assumptions, live recalculation, persistence, and single-variable sensitivity analysis.
- **Investor readiness & investment case** — a readiness profile and a print-friendly investment case.
- **Programme intelligence** — an anonymised, aggregate view for policy and programme teams.
- **Methodology, governance & guided demo** — transparency, an audit trail, and a 6–8 minute walkthrough with a guarded demo-data reset.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn-style primitives, Recharts |
| Database | PostgreSQL on **Neon** |
| ORM | **Drizzle** (chosen over Prisma — see [`docs/architecture.md`](docs/architecture.md)) |
| Validation | Zod |
| Data access | Server Components + Server Actions |
| Testing | Vitest |
| Hosting | Vercel |

Node 20+ (Vercel-supported). The core product requires **no external LLM** — see [`docs/responsible-ai.md`](docs/responsible-ai.md).

---

## Repository structure

```
src/
  app/                 # App Router routes (pages + layout)
  components/          # UI primitives, charts, feature components (shell, dashboard, scenarios…)
  domain/              # Pure domain logic — the single source of truth
    scoring/           # Commercial scoring engine (viability, resilience, investor, opportunity, evidence)
    scenarios/         # Financial scenario modeller + sensitivity
    recommendations/   # Deterministic recommendation engine
    constants.ts       # Controlled vocabularies + banding
  db/                  # Drizzle schema, client, migration runner, seed
  lib/                 # Validation (Zod), formatting, analytics, view types
  server/              # Server-only queries and server actions
tests/                 # Vitest unit tests
docs/                  # Architecture, methodology, alignment, security, etc.
drizzle/               # Generated SQL migrations
```

Domain logic is kept separate from UI; scoring logic never lives inside React components; database access is server-side only; validation is centralised in `src/lib/validation.ts`.

---

## Local setup

```bash
# 1. Install
npm install

# 2. Environment — copy the template and add your own Neon connection string
cp .env.example .env.local
#   then edit .env.local and set DATABASE_URL

# 3. Database — apply migrations and seed deterministic data
npm run db:migrate      # add -- --reset for a clean rebuild
npm run db:seed

# 4. Develop
npm run dev             # http://localhost:3000
```

### Database setup (Neon)

1. Create a Neon project named **circa** and a database named `circa`.
2. Copy the **pooled** connection string into `DATABASE_URL` in `.env.local`.
3. Run migrations and seed as above.

Never commit `.env.local` or any real connection string — see [`docs/security.md`](docs/security.md).

### Migrations

```bash
npm run db:generate     # regenerate SQL from src/db/schema.ts after a schema change
npm run db:migrate      # apply migrations (drizzle/) to DATABASE_URL
npm run db:migrate -- --reset   # drop & recreate the public schema, then apply
```

### Seed

```bash
npm run db:seed         # deterministic seed: 12 synthetic Scottish businesses
```

The seed derives scores, scenarios and recommendations from the domain engine, so the database and the engine can never disagree.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations (`-- --reset` for a clean rebuild) |
| `npm run db:seed` | Seed deterministic data |

**Before deployment**, run the full gate:

```bash
npm ci && npm run lint && npm run typecheck && npm run test && npm run build
```

---

## Vercel deployment

1. Import `Imomazin/circa` into a Vercel project named **circa** (or **circa-civtech**).
2. Set `DATABASE_URL` (and optionally `DATABASE_URL_UNPOOLED`) as encrypted environment variables from the Neon connection string.
3. Deploy the development branch as a **preview** (do not merge to `main` for deployment).

See [`docs/architecture.md`](docs/architecture.md) for deployment notes.

---

## Demo workflow

A 6–8 minute guided walkthrough lives in the app under **Demo**, and in [`docs/demo-script.md`](docs/demo-script.md): dashboard → sample business → assessment → circular opportunity → change an assumption → scenario updates → viability drivers → resilience → investor readiness → investment case → programme intelligence.

---

## Known limitations

See [`docs/known-limitations.md`](docs/known-limitations.md). In brief: scores are prototype (not validated), all data is synthetic, the financial model is deliberately simple (annual, single-period payback, no discounting/tax), and formal role-based access control is not yet enabled (the architecture allows it).

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/civtech-alignment.md`](docs/civtech-alignment.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/methodology.md`](docs/methodology.md)
- [`docs/commercial-model.md`](docs/commercial-model.md)
- [`docs/responsible-ai.md`](docs/responsible-ai.md)
- [`docs/security.md`](docs/security.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/known-limitations.md`](docs/known-limitations.md)

---

_Ambidexters Ltd × The DataKirk SCIO · CivTech 12.3 · Zero Waste Scotland challenge sponsor._
