# Merchant Payment Ledger

A REST API for recording and querying merchant payment transactions, with a minimal dashboard frontend.

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Framework:** Express
- **Database:** SQLite (via `better-sqlite3`) — no database server required

## Running locally

```bash
cd solution
npm install
npm run seed    # loads seed data (10 payments across 3 merchants)
npm run dev     # starts the server at http://localhost:3000
```

To build and run the compiled output:

```bash
npm run build
npm start
```

The frontend is served at `http://localhost:3000`. Use it to browse transactions and view per-merchant summaries.

## API Contract

### `POST /api/payments`

Create a new payment record.

**Request body:**

```json
{
  "merchant_id": "merchant_alpha",   // required, non-empty string
  "amount":      150000,             // required, positive integer, in kobo
  "currency":    "NGN",             // required, ISO 4217
  "status":      "pending",          // required: "pending" | "settled" | "failed"
  "reference":   "ref-001",          // required, unique per merchant
  "settled_at":  "2026-05-01T...",   // required when status = "settled", ISO 8601
  "metadata":    { "channel": "card" } // optional JSON object
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `201`  | Payment created — returns the full payment object |
| `400`  | Validation failed — returns `{ error, details[] }` |
| `409`  | Duplicate reference for this merchant |

---

### `GET /api/payments`

List payments with optional filters and pagination.

**Query parameters:**

| Parameter     | Description |
|---------------|-------------|
| `merchant_id` | Filter by merchant |
| `status`      | Filter by status (`pending`, `settled`, `failed`) |
| `page`        | Page number (default: 1) |
| `limit`       | Results per page (default: 50, max: 100) |

**Response:**

```json
{
  "data": [ ...payments ],
  "pagination": { "total": 10, "page": 1, "limit": 50, "pages": 1 }
}
```

---

### `GET /api/payments/:id`

Retrieve a single payment by UUID.

**Responses:**

| Status | Description |
|--------|-------------|
| `200`  | Returns the payment object |
| `404`  | Payment not found |

---

### `GET /api/merchants/:merchant_id/summary`

Return aggregate totals for a merchant.

**Response:**

```json
{
  "merchant_id":   "merchant_alpha",
  "total_amount":  725000,
  "total_count":   4,
  "breakdown": {
    "pending": { "count": 1, "amount": 75000 },
    "settled": { "count": 2, "amount": 650000 },
    "failed":  { "count": 1, "amount": 200000 }
  }
}
```

`total_amount` = `settled.amount + pending.amount` (failed excluded — see trade-off below).

**Responses:**

| Status | Description |
|--------|-------------|
| `200`  | Returns the summary object |
| `404`  | Merchant not found or has no payments |

---

### `GET /health`

Returns `{ "status": "ok" }`.

---

## Payment object shape

```json
{
  "id":          "uuid",
  "merchant_id": "merchant_alpha",
  "amount":      150000,
  "currency":    "NGN",
  "status":      "settled",
  "reference":   "ref-001",
  "created_at":  "2026-05-01T10:00:00.000Z",
  "settled_at":  "2026-05-02T08:00:00.000Z",
  "metadata":    { "channel": "card" }
}
```

All amounts are integers in kobo.

---

## Trade-off: does `total_amount` include pending?

**Decision: yes — `total_amount` includes both `settled` and `pending` amounts; `failed` amounts are excluded.**

Pending transactions represent real money that has left the sender and is actively in transit. From the merchant's perspective, that money is already spoken for — it's just not yet cleared. Excluding it would understate the merchant's true cash position and could mislead decisions about payouts or reconciliation.

Failed transactions, by contrast, never cleared. The money either never moved or was returned, so including failed amounts in any aggregate would be misleading.

This decision is applied consistently: the `total_amount` on the summary endpoint and the "Total" figure in the frontend both use `settled + pending`.

---

## One thing I'd do differently with more time

Add **cursor-based pagination** in place of the current offset/page approach. Offset pagination produces inconsistent results under concurrent writes — a new payment inserted between page 1 and page 2 shifts rows and causes duplicates or gaps in the client's view. A `created_at` + `id` cursor is stable and scales better as the table grows.
