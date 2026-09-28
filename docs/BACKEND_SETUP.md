# IB ANASA WEARS — Backend Setup Guide

> Handoff package for the backend developer. The single source of truth for wire
> format is **`/API_CONTRACT.md`** — read it fully before coding. This guide covers
> the scaffolding that already exists in the repo and what the frontend expects
> from the server you build.

---

## 1. TL;DR

The frontend is **already contract-complete**. It ships:

- `src/lib/api.ts` — fetch wrapper, unified error parsing (`{ error: { code, message } }`),
  `isBackendConfigured()` (returns `true` when `VITE_API_BASE_URL` is set), and a
  `withLocalFallback()` helper so the app keeps working offline.
- `src/lib/normalizers.ts` — API ↔ UI mappers (`normalizeApiProduct`, `toApiProduct`,
  `normalizeApiOrder`, `toApiOrderPatch`, `normalizeApiCustomer`).
- `src/lib/paymentApi.ts` — order create/status/list/patch calls against the contract.
- `src/lib/productApi.ts` — storefront product fetch (normalized, drafts hidden).
- `src/lib/adminApi.ts` — admin JWT helpers + product CRUD/archive calls.
- `src/lib/customerAuth.ts` — API-first customer sign-in / register / reset.
- `seed/seed.json` — the demo catalogue + orders, exported for DB seeding
  (regenerate any time with `npm run seed:export`).
- `.env.example` — the full set of frontend + backend environment variables.

**You build a small JSON API (see §3 for the recommended shape). When
`VITE_API_BASE_URL` points at it, the whole store — catalogue, checkout+Paystack,
orders, admin inventory, customer accounts — runs against your server.**

---

## 2. Repository map

```
API_CONTRACT.md          ⬅ read this first — wire format is authoritative
src/lib/api.ts           low-level fetch + error parsing + fallback
src/lib/normalizers.ts   API ⇄ UI mappers (don't change UI shapes, change these)
src/lib/paymentApi.ts    orders + payment poll flow
src/lib/productApi.ts    storefront product list
src/lib/adminApi.ts      admin auth + product ops
src/lib/customerAuth.ts  customer auth (sign in / register / reset)
seed/seed.json           demo catalogue + orders (generated)
.env.example             all env vars
netlify.toml             static frontend deploy
```

### The two app modes (both already implemented)

| Mode | `VITE_API_BASE_URL`        | Behaviour |
| ---- | -------------------------- | --------- |
| Local/demo | unset / empty | Bundled demo data, simulated payments (`LOCAL-*` refs), browser-local accounts. Nothing hits the network. |
| API-first | set | The frontend calls your endpoints for everything above; falls back to local only when a request throws. |

> Development tip: run the frontend with `VITE_API_BASE_URL` empty for fast UI work,
> then flip it on to integration-test against your server.

---

## 3. Recommended server shape

Any stack is fine (Node/Express, Python/FastAPI, Go…). Express + TypeScript is already a
(never-used) dependency, so an `src/server`... no — put your server in a **`server/`** folder
at the repo root to keep it out of the Vite build.

```
server/
  src/
    index.ts            app bootstrap (cors, json, routes, error handler)
    routes/
      products.ts       GET /api/products/search      (public, facets + pagination)
                        GET /api/products             (public, query-filtered)
                        GET /api/products/:id
                        GET /api/categories           (public)
                        POST /api/products            (admin)
                        PUT  /api/products/:id        (admin)
                        PATCH /api/products/:id       (admin)
                        PATCH /api/products/:id/variants/:variantId (admin)
      inventory.ts      GET /api/inventory            (admin, stock snapshot)
      orders.ts         POST /api/orders              (public)
                        GET  /api/orders/:orderId     (public)
                        GET  /api/orders              (admin, status/period filters)
                        PATCH /api/orders/:orderId    (admin)
      auth.ts           POST /api/auth/login          (admin)
                        GET  /api/me                  (admin)
                        POST /api/auth/customer/login        (public)
                        POST /api/auth/customer/register     (public)
                        POST /api/auth/customer/reset-password (public)
      customers.ts      GET  /api/customers           (admin, order aggregates)
                        GET  /api/customers/:id       (admin, profile + orders)
      payments.ts       POST /api/payments/webhook    (Paystack)
                        GET  /api/payments/:reference/verify
      assistant.ts      — added in Phase 2 (optional AI chat proxy)
    middleware/
      auth.ts           verify bearer JWT (secret: JWT_SECRET)
      role.ts           allowlist roles
      error.ts          map thrown errors → { error: { code, message } }
    services/
      paystack.ts       initialize + verify + webhook signature check
      inventory.ts      atomic stock decrement (§3.2 of contract)
    db/                 migrations + schema
      schema.sql
    seed.ts             imports seed/seed.json into the DB
  .env
```

### Must-haves

1. **Schema** — see `API_CONTRACT.md §2.4`. Every table and column maps one-to-one to the
   JSON contract. `seed/seed.json` was generated from that contract shape.
2. **Auth** — issue short-lived JWTs (`JWT_SECRET`). Frontend keeps them in `sessionStorage`
   and sends `Authorization: Bearer <token>`. Admin product/order writes and `GET /api/orders`
   require it; customer endpoints return their own token.
3. **Paystack** — `PAYSTACK_SECRET_KEY` server-only. Flow and webhook rules in contract §3–§5.
   Remember: **`payment.amount` in the create-order response is in kobo**; the frontend feeds it
   straight into the Paystack PopUp. All `total`/`subtotal`/`unit_price` fields are naira.
4. **Errors** — always `{ "error": { "code", "message" } }`. The UI shows `message` verbatim.
5. **CORS** — `CORS_ORIGIN` should include the storefront origin.
6. **AI-readiness (Phase 2/3, no extra work now)** — keep all read endpoints
   deterministic (explicit `sort`), paginated (`page`/`limit`), and facet-able
   (`/api/products/search` returns `facets`). That single pattern is what lets a
   natural-language assistant plug in later without rebuilding anything. See
   `API_CONTRACT.md §9` for the full Phase 1 → 2 → 3 roadmap and the decided
   "Ask IB Anasa ✨" storefront UX (compact panel beside the search icon — not a
   full-screen chatbot).

### Recommended defaults to seed

```jsonc
// via POST /api/auth/login (admin)
{ "email": "admin@ibanasawears.com", "password": "admin123", "role": "Super Administrator" }

// products / orders
// import seed/seed.json through your seeder
```

---

## 4. Environment variables

See `.env.example` for comments. Summary:

| Variable | Scope | Purpose |
| -------- | ----- | ------- |
| `VITE_API_BASE_URL` | frontend build | base URL the SPA calls |
| `VITE_PAYSTACK_PUBLIC_KEY` | frontend build | opens the Paystack PopUp |
| `PAYSTACK_SECRET_KEY` | server only | verify transactions |
| `JWT_SECRET` | server only | sign admin/customer tokens |
| `DATABASE_URL` | server only | DB connection string |
| `PORT` | server | listen port (Cloud Run injects it) |
| `CORS_ORIGIN` | server | allowed storefront origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | server seed | default admin account |

---

## 5. Frontend integration checklist (verify after your API is up)

1. `npm run lint` and `npm run build` pass.
2. With `VITE_API_BASE_URL` set to your dev server and CORS open:
   - Storefront renders products from your DB (drafts hidden).
   - Checkout creates an order, Paystack PopUp opens with the backend reference/amount,
     and the poll picks up `paid` after verification.
   - Admin → password login authenticates against `POST /api/auth/login`; product
     add/edit/delete round-trips to your API.
   - Customer account creation/sign-in/reset round-trips to the customer auth endpoints.
3. Kill your API mid-use — the store keeps working from local data and toast-warns on failures.
4. Webhook test: use the Paystack dashboard "test webhook" with your endpoint and confirm
   idempotent handling (same reference delivered twice doesn't double-decrement stock).

---

## 6. Known v1 limits (acceptable for launch)

- **No cart reservation** — stock decrements only after payment verification (contract §3.1).
  Two buyers on the last item: whoever verifies first wins (atomic update, §3.2).
- **Staff account creation is still local/browser-only** when no backend is configured.
  When configured, backend-seeded accounts are required (`POST /api/auth/register` is a
  documented-but-optional follow-up).
- **Customer email verification** isn't required yet — signup + password reset use the
  `identifier`/`new_password` payloads in contract §4.4 directly.
- **Admin JWT persistence** is session-only (frontend restores via `GET /api/me` if you wire
  `adminMe()`; currently the modal re-logs-in per session on reload).
- Payment **access codes/authorization URLs** are returned by your create-order response but the
  frontend currently opens the PopUp from `reference` only (standard Paystack flow).