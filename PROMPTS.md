# PROMPTS.md

Complete AI chat history for this project (Lovable, Claude-based assistant).

---

## Prompt 1 — the brief

> TDD Kata: Car Dealership Inventory System
>
> Objective: design, build and test a full-stack Car Dealership Inventory
> System. Backend REST API with a real database and JWT auth, endpoints for
> `POST /api/auth/register`, `POST /api/auth/login`, `POST/GET /api/vehicles`,
> `GET /api/vehicles/search`, `PUT /api/vehicles/:id`,
> `DELETE /api/vehicles/:id` (admin only), `POST /api/vehicles/:id/purchase`,
> `POST /api/vehicles/:id/restock` (admin only). Each vehicle has a unique ID,
> make, model, category, price and quantity in stock.
>
> Frontend: React + Tailwind SPA with register/login forms, a dashboard of all
> vehicles, search and filtering, a Purchase button disabled at zero quantity,
> and admin UI to add/update/delete vehicles. Visually appealing and responsive.
>
> Process: TDD (red-green-refactor), clean code and SOLID, frequent Git commits,
> AI co-authorship on commits, a README with a "My AI Usage" section, a test
> report, and a PROMPTS.md with the full chat history. Best practices,
> production-grade application.

### Assistant response summary

1. Enabled the managed cloud backend (PostgreSQL + auth).
2. Designed the schema: `profiles`, `app_role` enum, `user_roles`, `vehicles`,
   `purchases`; `has_role` security-definer helper; `purchase_vehicle` and
   `restock_vehicle` atomic inventory functions; a signup trigger that creates
   the profile and grants `admin` to the very first account; RLS policies and
   GRANTs for every table; 8 seeded demo vehicles.
3. Hardened the migration after the security linter flagged publicly executable
   security-definer functions — `EXECUTE` was revoked from `anon`/`public` on
   every internal helper.
4. Wrote the failing tests first for the pure inventory domain
   (`src/lib/vehicles/inventory.test.ts`, 36 cases) and the shared validation
   schemas (`schemas.test.ts`, 11 cases), then implemented
   `inventory.ts` / `schemas.ts` until the suite went green (47/47).
5. Built the dark "night showroom" design system in `src/styles.css` (oklch
   tokens, Space Grotesk + DM Sans, custom `surface-panel` / `hero-scrim`
   utilities) and generated the hero image.
6. Built the SPA: session/role provider (`use-auth.tsx`), showroom with hero,
   stats, filter bar and vehicle cards, auth page with sign-in/register tabs,
   admin inventory table, purchase history page and a REST API reference page.
7. Built the REST layer under `src/routes/api/**` — every handler validates its
   input with the shared Zod schemas and forwards the caller's bearer token so
   the database's RLS policies are the single authorisation authority.
8. Wrote `README.md`, `TEST_REPORT.md` and this file, plus `sitemap.xml`
   and per-route SEO metadata.

---

## Follow-up prompts

_(Append later prompts here as the project evolves.)_

---

## Commit convention used

```
feat: implement atomic vehicle purchase endpoint

Wrote the failing domain tests for stock transitions first, then the
SQL function and REST handler to make them pass.

Co-authored-by: Lovable AI <AI@users.noreply.github.com>
```
