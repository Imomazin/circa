# Circa

Commercial decision intelligence for circular economy opportunities.

**Ambidexters × The DataKirk**  
CivTech Round 12 Product Demonstrator, Challenge 12.3

This prototype uses synthetic data, deterministic financial calculations and unvalidated decision-support scores. It does not imply approval by CivTech or Zero Waste Scotland. No real business data or paid AI service is required.

## What works

- An isolated presenter workspace with 12 synthetic businesses across 10 sectors
- Portfolio search, sorting, filters, pagination and charts calculated from database records
- A four-step assessment with server-side Zod validation
- Three editable financial scenarios, persisted revisions and concurrent-edit protection
- Five explainable score families, resilience analysis and investor preparation
- Browser-printable investment cases and aggregated programme insight
- Evidence descriptions, activity records and a confirmation-protected workspace reset

## Architecture

Next.js 16.3.5 App Router, React, TypeScript 6, Tailwind CSS, Recharts, Drizzle ORM and Neon PostgreSQL 17. Node.js 24 is required. See [architecture](docs/architecture.md).

## Local setup

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to the pooled Neon connection and `DIRECT_URL` to its direct connection. Keep both server-side. The example file contains no credentials. `NEXT_PUBLIC_DEMO_MODE=true` enables the synthetic entry and reset routes; it is not an authentication secret.

```sh
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
```

Open `/` and choose **Open demonstration**. Each browser session receives its own seeded workspace. The seeded operator fixture is not accessible through a published session token. Data values are deterministic; workspace record identifiers are unique.

## Checks

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
npm run test:smoke
```

Run the smoke command against the started application. It tests persisted edits, concurrent edits, invalid input, cross-session access, confirmation-gated reset and page routes. CI uses an isolated ephemeral PostgreSQL service with local trust authentication; it does not contain a hosted database credential.

## Vercel preview

Connect `Imomazin/circa`. Keep `main` as the production branch and `development` as a preview branch. Add the application database connection to Preview environment variables, then deploy `development`. The build does not migrate or seed a database. Apply the committed migrations explicitly before deployment. `vercel.json` disables Git deployments from `main`. Do not merge the review PR without owner approval.

The seven-minute demonstration is available at `/demo` and in [demo-script](docs/demo-script.md). Read [known limitations](docs/known-limitations.md) before demonstrating the product.
