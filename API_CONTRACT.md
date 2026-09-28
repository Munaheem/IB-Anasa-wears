# IB ANASA WEARS — Backend & API Contract

> Hand this document to the backend developer. The frontend in this repo speaks this contract,
> so the contract is authoritative. Frontend never decides whether a payment "succeeded" —
> the backend does.

---

## 1. Overview

IB Anasa Wears is a fashion store (Auchi showroom + nationwide delivery). The web app is a
single-page React storefront with an admin section. A small API server must own:

- **Products & variant inventory** (size × colour × quantity, per variation)
- **Orders** (with an immutable snapshot of what was bought)
- **Payments** (Paystack verification — only the backend talks token/key secrets)
- **Admin authentication**

The frontend behaves in two modes:

1. **API-first mode** — `VITE_API_BASE_URL` is set. The app reads products/orders from the API,
   creates orders on the API, and trusts only the backend's payment verdict.
2. **Local/demo mode** — no base URL. The app uses bundled demo data and simulates payments
   (references prefixed `LOCAL-`). Nothing is charged.

## 2. Data models

### 2.1 Product status

| Status         | Storefront behaviour                                              |
| -------------- | ----------------------------------------------------------------- |
| `active`       | Visible and purchasable.                                           |
| `out_of_stock` | Visible but not purchasable (show "OUT OF STOCK" badge).           |
| `draft`        | Hidden (admin preparing it).                                       |
| `archived`     | Hidden, never deleted — keeps old order records valid.             |

### 2.2 Product

```jsonc
{
  "id": 45012,                  // integer
  "name": "Premium Senator",
  "description": "…",
  "category": "senator",        // shirts | hoodies | trousers | shorts | shoes | slides | caps | belts | bags
  "price": 85000,               // base price in NGN minor-safe integer (kobo handled by Paystack)
  "images": ["https://…", "…"], // first is the card image
  "status": "active",           // ProductStatus (above)
  "featured": false,
  "new_arrival": true,
  "date_added": "2026-09-20T10:00:00Z",
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-20T10:00:00Z",
  "variants": [                 // the inventory — stock lives HERE, never on product
    { "id": 901, "size": "M",   "colour": "Black", "price": 85000, "stock": 5 },
    { "id": 902, "size": "L",   "colour": "Black", "price": 85000, "stock": 3 },
    { "id": 903, "size": "XL",  "colour": "Black", "price": 85000, "stock": 0 },
    { "id": 904, "size": "M",   "colour": "Navy",  "price": 85000, "stock": 2 },
    { "id": 905, "size": "L",   "colour": "Navy",  "price": 85000, "stock": 4 },
    { "id": 906, "size": "XL",  "colour": "Navy",  "price": 85000, "stock": 1 }
  ]
}
```

Rules:

- **Do NOT model `product.stock`.** Inventory is `variants[]` — size × colour × stock. This is the
  single most important decision (a clothing store always has size/colour combos).
- A variant's `price` may override the product base price (sur-charge sizes etc.).
- When the frontend creates a product, **some variants may arrive without an `id`** — the backend
  must upsert variants by `(product_id, size, colour)` instead of hard-failing on a missing id.
- Deleting is forbidden. Use `status: "archived"`. Old orders reference product names/variant ids,
  so history stays intact.
- List endpoints may return a slim shape (no `description`/`composition`) for caching; detail
  endpoints return the full record.

### 2.3 Order

```jsonc
{
  "id": "c9f3…",                   // uuid
  "order_number": "IBA-20260922-001",
  "customer": { "name": "…", "email": "…", "phone": "…" },
  "delivery": {
    "label": "Home", "line1": "…", "city": "…", "state": "…", "country": "…", "notes": "…"
  },
  "items": [                        // SNAPSHOT — never resolves to live product/price
    {
      "product_id": 45012,
      "variant_id": 902,
      "product_name": "Premium Senator",
      "size": "L",
      "colour": "Black",
      "quantity": 1,
      "unit_price": 85000,
      "line_total": 85000
    }
  ],
  "subtotal": 85000,
  "delivery_fee": 7000,
  "total": 92000,
  "currency": "NGN",
  "payment_status": "pending",      // pending | paid | failed | refunded
  "order_status": "pending",        // pending | confirmed | processing | ready | shipped | delivered | cancelled
  "payment_reference": "…",
  "created_at": "2026-09-22T10:00:00Z",
  "updated_at": "2026-09-22T10:04:00Z"
}
```

Rules:

- **Order items are a snapshot** (name, size, colour, unit price, qty at purchase time).
  If the owner raises the price next month, past orders still show what was actually paid.
- `order_status` lifecycle: `pending → confirmed → processing → ready → shipped → delivered`,
  with `cancelled` allowed from most states.
- Order number format: **`IBA-YYYYMMDD-NNN`** (sequential per day).

### 2.4 Database sketch (relational)

```
PRODUCTS
  id, name, description, category, images, status, featured, new_arrival, date_added, created_at, updated_at

PRODUCT_VARIANTS
  id, product_id, size, colour, price, stock, updated_at   -- UNIQUE(product_id, size, colour)

ORDERS
  id, order_number, customer_name, customer_email, customer_phone,
  delivery_label, delivery_line1, delivery_city, delivery_state, delivery_country, delivery_notes,
  subtotal, delivery_fee, total, currency,
  payment_status, order_status, payment_reference, created_at, updated_at

ORDER_ITEMS
  id, order_id, product_id, variant_id, product_name, size, colour, quantity, unit_price, line_total
```

## 3. Checkout & payment flow (frontend + backend)

The flow below is what the current frontend already implements. The important rule:
**stock is reduced only AFTER payment is verified — never when items are added to cart**
(no cart reservation; abandoned carts must not shrink inventory).

```
Customer selects variation (size + colour) + qty
        ↓
Add to cart (stock untouched)
        ↓
Checkout → POST /api/orders      (order created with payment_status=pending)
        ↓
Backend computes final amount from variants + returns order + payment init
        ↓
Paystack inline PopUp charged against backend-issued reference
        ↓
Backend verifies via Paystack (GET .verify, or webhook)
        ↓
payment_status = paid  →  ATOMIC stock decrement  →  order confirmed
        ↓
Frontend polls GET /api/orders/:id until paid/failed
```

### 3.1 Payment failure

Use the **simple approach** for now (this is a small store): stock is only reduced after
successful verification. So a failed/abandoned payment never requires "releasing" stock. If order
volume grows later, revisit temporary reservation.

### 3.2 Race condition: last item, two buyers

Stock must be decremented **atomically** in the database, never read-then-write in app code:

```sql
UPDATE product_variants
   SET stock = stock - :qty
 WHERE id = :variantId AND stock >= :qty;
```

- If `affectedRows === 1` → decrement succeeded, proceed.
- If `affectedRows === 0` → variant is sold out → mark order `failed`, return
  `409 {"error":{"code":"OUT_OF_STOCK","message":"Sorry, this item is no longer available."}}`.

This check happens server-side only — never trust client-side quantity math.

## 4. Endpoints

Base URL: `VITE_API_BASE_URL` (frontend). All JSON. Errors:

```jsonc
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message" } }
```

### 4.1 Products

| Method | Path               | Auth  | Purpose                                            | Response |
| ------ | ------------------ | ----- | -------------------------------------------------- | -------- |
| GET    | `/api/products`    | —     | Storefront catalogue (active + out_of_stock)       | `{ "products": Product[] }` |
| GET    | `/api/products/:id`| —     | Full record incl. variants                          | `Product` |
| GET    | `/api/products/search` | — | Full-text + facet search (AI-friendly)              | `{ "products", "total", "page", "limit", "facets" }` |
| POST   | `/api/products`    | Admin | Create product (default status `draft` or supplied) | `201 Product` |
| PUT    | `/api/products/:id`| Admin | Full update (name, price, variants, status…)        | `Product` |
| PATCH  | `/api/products/:id`| Admin | Partial update (e.g. `{ "status": "active" }`)      | `Product` |
| PATCH  | `/api/products/:id/variants/:variantId` | Admin | Edit one variant's stock/price | `Product` |

**Query params — supported by both `GET /api/products` and `GET /api/products/search`:**

| Param       | Values/example        | Meaning |
| ----------- | --------------------- | ------- |
| `q`         | `camo`                | Full-text search over `name`, `description`, tags. |
| `category`  | `hoodies`             | Restrict to one category. |
| `size`      | `XL`                  | Only products with an `XL` variant. |
| `colour`    | `Black`               | Only products with a `Black` variant. |
| `min`/`max` | `0` / `100000`        | Price range in **naira**. |
| `in_stock`  | `any` \| `true` \| `false` | `true` = at least one variant `stock > 0`. Default `any` for search, `true` for the storefront catalogue. |
| `featured`  | `true`                | Boolean flag filter. |
| `new_arrival`| `true`               | Boolean flag filter. |
| `sort`      | `featured` \| `new` \| `price_asc` \| `price_desc` \| `name` \| `popular` | Deterministic ordering (no "natural" fallback the AI or UI can't reason about). |
| `page`/`limit` | `1` / `24`          | Pagination; `limit` max 100. |

Search responses add facets so both the storefront and a future AI assistant can refine
in one round-trip instead of guessing terms:

```jsonc
{
  "products": [ /* Product[] */ ],
  "total": 37,
  "page": 1,
  "limit": 24,
  "facets": {
    "categories": [ { "name": "hoodies", "count": 9 }, { "name": "shirts", "count": 8 } ],
    "sizes":      [ { "value": "XL", "count": 12 } ],
    "colours":    [ { "value": "Black", "count": 8 } ],
    "price_range": { "min": 12000, "max": 220000 }
  }
}
```

Notes:

- Storefront GET only returns `status` in (`active`, `out_of_stock`). `draft`/`archived` never leave the API to the storefront.
- When all variants are 0 stock, the storefront should be served `status: "out_of_stock"` automatically (or the storefront derives it — but prefer backend truth).
- No DELETE endpoint. Archive via PATCH.
- Admin writes require the admin token (§6).
- `GET /api/products/search` is pre-built for the AI assistant (§9) — keep it read-only and deterministic.

### 4.2 Orders

| Method | Path                 | Auth  | Purpose |
| ------ | -------------------- | ----- | ------- |
| POST   | `/api/orders`        | —     | Create order (pending). See §3. |
| GET    | `/api/orders/:orderId` | —   | Fetch order. **If `payment_status` is still `pending` and it's older than ~2 min, the backend must re-verify against Paystack before responding.** This is what the frontend polls after payment. |
| GET    | `/api/orders`        | Admin | List/order analysis (also for admin dashboard). |
| PATCH  | `/api/orders/:orderId` | Admin | `{ "order_status"? , "payment_status"? }` — admin progress updates. |

`GET /api/orders` (admin) query params: `order_status` (or `status`), `payment_status`,
`period` (`today` | `7d` | `30d` | `all`, default `all`), `q` (order_number / customer
name / email), `page`/`limit` (default 20). Response may be `Order[]` or
`{ "orders", "total", "page", "limit" }`. These filters back the Phase 3 sales
summaries (§9).

### 4.3 Payments

| Method | Path                             | Purpose |
| ------ | -------------------------------- | -------- |
| POST   | `/api/payments/initialize`       | Optional — the create-order response can return an init payload directly. |
| GET    | `/api/payments/:reference/verify`| Verify a Paystack reference (used by webhook/re-poll path). |
| POST   | `/api/payments/webhook`          | Paystack `charge.success` webhook union. Re-verify server-side, mark order paid, then atomically decrement stock. Idempotent by reference. |

Paystack notes:

- **`PAYSTACK_SECRET_KEY` lives ONLY on the server.** Never expose it to the frontend.
- The frontend may only use `VITE_PAYSTACK_PUBLIC_KEY` to open the inline PopUp.
- Charge the reference the backend issued — never let the client mint the payment reference
  in production mode (the client may generate one locally only for the demo path).
- Webhook signature verification mandatory; also verify on GET `/api/orders/:orderId` re-check.

### 4.4 Customer authentication

The frontend's customer sign-in / create-account / reset-password now call these endpoints
**whenever a backend is configured** (they previously ran purely in the browser). When no backend
is configured the app silently falls back to the local demo credentials stored in `localStorage`.

| Method | Path                               | Purpose |
| ------ | ---------------------------------- | ------- |
| POST   | `/api/auth/customer/login`         | Sign in by email **or** phone + password. Returns a short-lived JWT. |
| POST   | `/api/auth/customer/register`      | Create a customer account. Returns a JWT (logged in immediately). |
| POST   | `/api/auth/customer/reset-password`| Set a new password from email/phone (no old password needed in v1). |

**Request bodies (exact — sent by `src/lib/customerAuth.ts`):**

```jsonc
// login
{ "identifier": "08138947979  |  blessing@email.com", "password": "…" }

// register
{ "name": "Blessing Okafor", "identifier": "08138947979", "password": "…" }

// reset-password
{ "identifier": "08138947979", "new_password": "…" }
```

- `identifier` is **email OR phone** — the server should decide which one it matches.
- `name`/**`new_password`** use camelCase (this payload ships as-is from the frontend).
- Customer password `min length` enforced client-side before any call: **8**.
- **Response** (login & register): `{ "token": "<jwt>", "customer": { …Customer profile… } }`.

**Customer profile** (what the frontend normalizes back into the UI account):

```jsonc
{
  "id": "uuid",
  "name": "Blessing Okafor",
  "email": "blessing@…",
  "phone": "08138947979",
  "points": 240,
  "addresses": [ { "id": 1, "label": "Home", "line1": "…", "city": "Auchi", "state": "Edo", "country": "Nigeria" } ],
  "saved_cards": [ { "id": 1, "brand": "Visa", "last4": "4242", "reference": "Ps_" } ],
  "created_at": "2026-09-20T10:00:00Z"
}
```

- When signed in with a backend, the frontend stores the JWT in `sessionStorage`
  (`ib_anasa_customer_token`) and **no longer persists the password locally**.
- Signing out removes the token. Re-login is a fresh `POST /api/auth/customer/login`.

### 4.5 Categories

| Method | Path | Auth  | Purpose |
| ------ | ---------------------- | ----- | ------- |
| GET    | `/api/categories`      | —     | List categories with live product counts. |

```jsonc
{ "categories": [
    { "name": "hoodies", "label": "Hoodies", "count": 9, "image": "https://…/first product image in that category" }
  ] }
```

- `name` is the lower_snake_case value used on `Product.category` (must match exactly).
- Powers the storefront filter bar (§7) and the AI assistant's "what do you carry?" question.
- Order is deterministic: featured-first catalogue order, then alphabetical.

### 4.6 Inventory

| Method | Path | Auth  | Purpose |
| ------ | ------------------------------ | ----- | ------- |
| GET    | `/api/inventory`               | Admin | Stock snapshot across the catalogue. |

Query params: `category`, `status` (`ok` | `low` | `out` | `all`, default `all`),
`threshold` (low when total stock ≤ threshold, default 5, min 1), `page`/`limit`.

```jsonc
{ "inventory": [
    { "product_id": 45012, "name": "Premium Senator", "category": "senator", "status": "low",
      "total_stock": 4,
      "variants": [ { "variant_id": 901, "size": "M", "colour": "Black", "stock": 2 } ] }
  ],
  "summary": { "products": 34, "active_products": 32, "units_total": 468, "units_low": 6, "units_out": 2 } }
```

- A computed, **read-only** view. Stock never mutates here — it changes through order
  fulfilment (§3) or the admin variant PATCH (§4.1).
- `status` derivation: `out` = total stock 0, `low` = ≤ threshold, else `ok`.
- This is the answer surface for "what's low on stock?" (Phase 3, §9).

### 4.7 Customers

| Method | Path | Auth  | Purpose |
| ------ | ----------------------------- | ----- | ------- |
| GET    | `/api/customers`              | Admin | Customer directory with order aggregates. |
| GET    | `/api/customers/:id`          | Admin | Full profile + order history. |

Query params (list): `q` (name/email/phone), `sort` (`recent` | `spent` | `name`), `page`/`limit`.

```jsonc
{ "customers": [
    { "id": "uuid", "name": "Blessing O.", "email": "…", "phone": "…",
      "points": 240, "order_count": 6, "total_spent": 385000,
      "last_order_at": "2026-09-22T10:00:00Z", "created_at": "2026-09-20T10:00:00Z" }
  ],
  "total": 140, "page": 1, "limit": 20 }
```

`GET /api/customers/:id` returns the profile plus `{ "orders": Order[] }` (most recent first).

- Same customer data as §4.4, exposed to **admins only** — a customer never sees another
  customer's record.
- Never return saved card numbers/PINs; only `brand`/`last4`/`reference` as today.
- Powers Phase 3 customer/order insights and lookalike recommendations (§9).

## 5. Order confirmation rules (server)

1. `POST /api/orders` validates customer + address + items (variant exists, `stock >= qty`).
2. Backend computes `subtotal`/`total` **itself** from live variant prices — client-provided
   amounts are advisory only.
3. Response: `201` with the created order plus a payment init block:

```jsonc
{
  "order": { /* Order, payment_status=pending */ },
  "payment": { "reference": "…", "amount": 9200000 /* kobo! */, "currency": "NGN", "access_code": "…", "authorization_url": "…" }
}
```

> `amount` for Paystack is in **kobo** (NGN × 100). Keep `total`/`subtotal` in naira elsewhere.

4. After successful verification, in one transaction: set `payment_status = paid`,
   set `order_status = confirmed`, decrement every variant by its quantity (atomic §3.2),
   capture a `paid_at` timestamp.
5. If verification fails or funds are reversed → `payment_status = failed` (or `refunded`).
   No stock is touched.

## 6. Admin authentication

Backed by the frontend's Google SSO modal (`admin@` account) plus staff accounts.

**Password-login path (sent by `src/lib/adminApi.ts`):**

| Method | Path                | Request                              | Response |
| ------ | ------------------- | ------------------------------------ | -------- |
| POST   | `/api/auth/login`   | `{ "email": "…", "password": "…" }`  | `{ "token": "<jwt>", "user": { "email", "name", "role", "picture"? } }` |
| POST   | `/api/auth/refresh` | `{ "token": "<jwt>" }`               | `{ "token": "<new-jwt>" }` |
| GET    | `/api/me`           | `Authorization: Bearer <jwt>`        | `{ "email", "name", "role", "picture"? }` |

- The frontend stores the admin JWT in `sessionStorage` under **`ib_anasa_admin_token`** and attaches
  `Authorization: Bearer <token>` to every admin `POST`/`PUT`/`PATCH` (products and orders).
  `src/lib/adminApi.ts` exposes `getAdminToken()` for this.
- `role` defaults to `"Store Manager"` on the frontend; the backend may send `"Super Administrator"`,
  `"Sales Associate"`, etc. and the UI displays whatever role string it receives.
- Google SSO (OIDC exchange) can remain a documented-but-optional path; the current modal always
  shares the same session storage key, so both methods coexist.
- Protect every admin `POST/PUT/PATCH` with `Authorization: Bearer <jwt>` (role check for staff).
- Channel: HTTPS only.
- **v1 decision:** the "Create an admin account" link inside the modal still creates a **local**
  demo account in `localStorage` (a `StaffAccount` in `ib_anasa_staff_accounts`). In backend mode
  only accounts seeded into the server can authenticate. Optionally add
  `POST /api/auth/register` (`{ name, email, password, role? }`) later and wire the modal to it.

## 6bis. Order/list responses the frontend accepts

- `GET /api/orders` may return **either** a bare array `Order[]` **or** `{ "orders": Order[] }`.
- `GET /api/products` may return **either** a bare array `Product[]` **or** `{ "products": Product[] }`.
- `POST /api/orders` returns `{ "order": Order, "payment": PaymentInit }`. A flattened legacy shape
  (`{ "orderId", "orderNumber", "amount", "paymentStatus", "payment", "createdAt" }`) is still parsed
  but no longer produced by the frontend.
- `payment.amount` is always **kobo** (NGN × 100). All other money fields (`total`, `subtotal`,
  `delivery_fee`, `unit_price`) stay in **naira**.

## 7. Frontend behaviour notes (already implemented here)

- Storefront product list fetched via `GET /api/products`; local demo data as fallback.
- Products with `status: "draft"` or `"archived"` are hidden from the shop; `out_of_stock` shows a red
  badge, disables quick-add/Add-to-bag, and the PDP shows per-size "Only N left" / "OUT OF STOCK"
  (derived from the product's `variants` when present).
- **Admin inventory editor (already shipped in this repo):** the Products tab supports the full variant
  workflow — publish-or-save-as-draft, size/colour toggles with per-combination stock inputs on the
  create form, plus a per-product "Inventory" editor to change stock/status later. Stock is saved into
  `product.variants` and mirrored onto `sizes`/`colors`/`status`/`inStock` for the storefront.
- Checkout builds a `CheckoutPayload`, creates the order, opens Paystack PopUp with the
  backend-issued reference/amount, then **polls `GET /api/orders/:id`** until `payment_status`
  is terminal (`paid`/`failed`/`refunded`), rather than trusting the PopUp callback.
- Order confirmation screen shows the backend `order_number` and `total`.
- Admin dashboard can flip `order_status` per order (row controls) and it PATCHes the API
  (best-effort when offline).
- When a backend is configured, delivery fee is still computed by the backend on the order;
  the frontend's `DELIVERY_FEE_NGN` (₦7,000) is only a same-day estimate for display.
- **Customer accounts are now backend-first too:** sign-in, registration and password reset call
  §4.4 endpoints when `VITE_API_BASE_URL` is set; otherwise they use the local `localStorage`
  credentials. Backend-issued JWTs are kept in `sessionStorage` (`ib_anasa_customer_token`).
- **Admin product edits sync automatically:** the admin "Products" tab POSTs new products, PUTs
  edited products and PATCHes `{ "status": "archived" }` for deleted ones (best-effort — failures
  only show a soft toast and never roll back the local change). See §2.2 for the upsert-variant rule.
- The storefront renders products exactly as served by `GET /api/products`: the demo `img` fallback
  (`/images/essentials polo.jpg`) is used only when a product has no `images[]`.

## 7.1 Error codes (draft)

| Code                 | HTTP | Meaning |
| -------------------- | ---- | ------- |
| `VALIDATION_ERROR`   | 422  | Request body failed server validation. |
| `OUT_OF_STOCK`       | 409  | A variant had insufficient stock at order time. |
| `NOT_FOUND`          | 404  | Unknown product/order/customer. |
| `UNAUTHORIZED`       | 401  | Missing or invalid bearer token / bad credentials. |
| `FORBIDDEN`          | 403  | Valid token, insufficient role. |
| `PAYMENT_REQUIRED`   | 402  | Order still unpaid / verification pending. |
| `RATE_LIMITED`       | 429  | Too many attempts (auth endpoints especially). |
| `INTERNAL`           | 500  | Unexpected server error. |

The frontend surfaces `error.message` verbatim in toasts and inline form errors, so keep messages
short, human and actionable.

## 8. Suggested folder/deployment shape

```
/ (repo root)
├── src/            React app (this repo)
├── server/         Node API (Express + Prisma optional, better: plain SQL + pg)
│   ├── routes/products.js     catalogue + search + categories
│   ├── routes/orders.js  payments.js  auth.js
│   ├── routes/inventory.js    stock snapshot
│   ├── routes/customers.js    customer directory
│   ├── routes/assistant.js    Phase 2 — optional AI chat proxy (added later)
│   ├── services/paystack.js  inventory.js  search.js
│   └── middleware/auth.js  error.js
└── env: VITE_API_BASE_URL, VITE_PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY, DATABASE_URL, JWT_SECRET
```

The backend developer may pick any stack; the contract above is what matters.

## 9. Roadmap: Phase 1 → 2 → 3

**"AI enhances the store rather than becoming the store."** Keep that sentence above any
assistant design. The AI assistant stays a thin layer over the same endpoints the
storefront and admin already use — never a parallel system of record.

### Relationship

```
        AI Assistant
              ↓
           Backend/API
              ↓
Products / Inventory / Orders / Customers
```

### Phase 1 — Core e-commerce (this contract)

Product catalogue · Categories · Variants · Inventory · Cart · Checkout · Paystack ·
Orders · Admin dashboard. All of §1–§8 is Phase 1, and the read endpoints below are
deliberately shaped so Phase 2/3 bolt on without rebuilding anything.

### Phase 2 — AI Shopping Assistant (customer-facing)

| Capability | Backed by |
| ---------- | --------- |
| Natural-language product search ("black XL hoodie under ₦100k") | `GET /api/products/search` + facets (§4.1) |
| Product recommendations ("what goes with the camo jean?") | `GET /api/products/search` with category/colour facets |
| Product questions ("is it oversized/pre-shrunk?") | `GET /api/products/:id` (name, description, composition, variants) |
| Size/availability help ("is M in stock?") | `GET /api/products/:id` → `variants[].stock` |
| Fashion suggestions ("how do I style the senator?") | curated copy + `GET /api/products/search` |
| FAQ / customer support | order lookup for the signed-in customer via §3/§4.2 |

- **Reads only.** The customer-facing assistant never places orders, mints payment
  references, or edits products.
- Optional umbrella endpoint (Phase 2): `POST /api/assistant/chat`

```jsonc
// request
{ "messages": [ { "role": "user", "content": "Do you have a black XL hoodie under 100k?" } ],
  "customer_context": { "customer_id": "uuid?", "page": "catalog | product | cart" } }

// response
{ "reply": "Yes — the BAPE Shark Fleece at ₦95,000…",
  "tool_calls": [ { "tool": "search_products", "args": { "q": "hoodie", "colour": "Black", "size": "XL", "max": 100000 } } ],
  "suggested_products": [ /* Product[] */ ],
  "suggested_orders":   [ /* Order[] */ ] }
```

- Typical tool set: `search_products · get_product · get_categories ·
  get_inventory_summary · get_order · get_customer_orders`.
- Until `/api/assistant/chat` exists, an agent may call the §4 endpoints directly —
  same contract, same shapes.

### Phase 3 — AI Admin Assistant (back-office)

| Capability | Backed by |
| ---------- | --------- |
| Sales summaries ("revenue since Sunday?") | `GET /api/orders` (status/period filters, §4.2) |
| Low-stock alerts ("restock list") | `GET /api/inventory?status=low` (§4.6) |
| Product description generation | generated draft + `PUT /api/products/:id` (admin token) |
| Product tagging / catalogue assistance | `GET /api/categories` + `GET /api/products/search` |
| Customer/order insights | `GET /api/customers`, `GET /api/customers/:id`, `GET /api/orders` |

- Admin writes go through the **same admin endpoints with a JWT** — the assistant is just
  another admin client, never a second source of truth.

### Design rules baked into Phase 1 (so AI stays cheap to add)

1. **Deterministic reads** — every list endpoint supports explicit `sort` options; no
   unspecified/natural ordering. AI and UI reason about outputs identically.
2. **Facets, not guessing** — search returns `facets` (§4.1) so the assistant constrains
   the next call instead of guessing terms.
3. **Stable field names** — the JSON in §2 IS the contract; the frontend normalizers
   (§7) and the AI read the same shapes.
4. **Reads stay read-only** — every state change flows through the write verbs already
   defined (§4.1 writes, §4.2 create/patch, §3 payment confirmations).
5. **Pagination everywhere** — `page`/`limit` on every list endpoint (search, orders,
   inventory, customers).
6. **Consistent errors** — `{ error: { code, message } }` (§7.1) is what the assistant
   parses when a tool call misses.

### Storefront UX (decided)

The assistant is a **subtle "Ask IB Anasa ✨" link beside the catalogue search icon**
(§7 filter bar) — **not** a full-screen chatbot. Tapping it opens a compact, editorial
panel aligned with the luxury aesthetic (dark, monochrome, minimal type). The customer
should feel like they're shopping a luxury fashion store first and using AI second.

- The button can ship as a placeholder now (opening the existing search) and be
  upgraded in Phase 2; the API contract does not depend on it.