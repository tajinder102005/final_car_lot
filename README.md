# Torque Motors — Car Dealership Inventory System

A full-stack dealership inventory system: a React 19 + Tailwind SPA on top of a
token-authenticated REST API and a PostgreSQL database.

## Features

- Email/password registration and login (JWT bearer tokens).
- Role-based access: roles live in a dedicated `user_roles` table (never on the
  profile). The first registered account becomes the dealership **admin**.
- Vehicle catalogue with make, model, category, year, price and quantity.
- Search and filter by make, model, category and price range, plus sorting and
  an "available only" toggle.
- Purchase flow: the Purchase button is disabled at zero stock and the stock
  decrement is atomic in the database.
- Admin console: add, edit, restock and delete vehicles.
- Purchase history per user.

## Tech stack

| Layer    | Choice |
| -------- | ------ |
| Frontend | React 19, TanStack Router/Query, Tailwind CSS v4, shadcn/ui |
| Backend  | TypeScript server routes (TanStack Start), REST under `/api` |
| Database | PostgreSQL (Supabase) with row-level security |
| Auth     | JWT bearer tokens issued by the managed auth service |
| Tests    | Vitest |

## REST API

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/vehicles` | public |
| GET | `/api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=` | public |
| POST | `/api/vehicles` | bearer |
| PUT | `/api/vehicles/:id` | bearer |
| DELETE | `/api/vehicles/:id` | admin |
| POST | `/api/vehicles/:id/purchase` | bearer |
| POST | `/api/vehicles/:id/restock` | admin |

Example:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"supersecret"}' | jq -r .token)

curl -X POST http://localhost:8080/api/vehicles/<id>/purchase \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"quantity":1}'
```

Authorisation is enforced in the database (RLS policies + `SECURITY DEFINER`
inventory functions), so the API and the SPA cannot drift apart.

## Running locally

```bash
bun install       # or npm install
bun run dev       # http://localhost:8080
bunx vitest run   # test suite
bunx vitest run --coverage
```

### Database setup (one time, manual)

The app talks to a Supabase Postgres project. The connection details live in
`src/integrations/supabase/app-client.ts` (project URL + publishable *anon*
key only — the service role key is never shipped to the browser).

To provision a project from scratch:

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and run it.
   It is idempotent and safe to re-run: it creates the `app_role` enum,
   `profiles`, `user_roles`, `vehicles` and `purchases` tables, GRANTs, RLS
   policies, the `has_role` helper, the signup trigger, the atomic
   `purchase_vehicle` / `restock_vehicle` functions, and seed inventory. An
   existing `vehicles` table is migrated in place instead of being replaced.
3. Auth → Providers → Email: turn **Confirm email** off for local testing.
4. Register the first account in the app — it is auto-promoted to **admin**.



## Test report

47 tests over 2 suites, all passing — see `TEST_REPORT.md`. Coverage focuses on
the inventory domain rules (stock transitions, search, pricing, aggregates) and
the shared validation schemas, which are pure and framework-independent by
design.

## Design notes

- Domain rules are pure functions in `src/lib/vehicles/inventory.ts`, written
  test-first and reused by both the UI and the API layer (single source of
  truth, dependency-free — SOLID's D and S).
- Validation schemas in `src/lib/vehicles/schemas.ts` are shared by forms and
  endpoints so client and server rules are identical.
- Data access is isolated in `src/lib/vehicles/api.ts`; components never talk to
  the database client directly.
- All colours, fonts and surfaces are semantic design tokens in
  `src/styles.css`; components never hardcode colours.

## My AI Usage

**Tool used:** Lovable (Claude-based AI pair programmer).

**How it was used**

- Brainstormed the data model and REST surface before any code was written.
- Generated the first pass of the pure inventory domain tests (`inventory.test.ts`)
  and validation tests, then the implementation was written to make them pass —
  a red/green/refactor loop.
- Generated boilerplate: SQL migration scaffolding, shadcn form wiring, the
  route files and the API handlers.
- Reviewed security: roles were moved into a separate table and stock mutations
  into atomic `SECURITY DEFINER` functions after an AI-assisted review flagged
  the privilege-escalation and race-condition risks.

**Reflection**

AI removed most of the mechanical cost of scaffolding (migrations, forms,
route wiring), which left more time for the parts that matter: modelling stock
transitions correctly, keeping authorisation in one enforceable place, and
writing meaningful test cases. It is least reliable when it guesses at intent —
every generated policy and every generated test was reviewed and several were
rewritten. Used as an accelerator with a human reviewing each step, it is a
clear net win.

Full prompt history: `PROMPTS.md`.
