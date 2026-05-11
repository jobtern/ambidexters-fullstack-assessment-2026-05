# Task — Merchant Payment Ledger API

## Background

Ambidexters is building financial tooling for merchants who need a clear, auditable record of their payment activity. The backend team has scoped a payment ledger service — a small API that records transactions, exposes filtered summaries, and surfaces the data cleanly enough for a basic dashboard. You're picking this up and shipping it.

## What to build

- A REST API that supports creating, listing, and retrieving payment records
- Filtering by `status` and `merchant_id` on the list endpoint
- A summary endpoint that returns aggregate totals for a given merchant
- A minimal frontend — enough to list transactions and display the summary; nothing more
- Seed data so a reviewer can load the app without manual setup

## The data

Every payment record contains the following fields:

| Field         | Type        | Constraints                                             |
| ------------- | ----------- | ------------------------------------------------------- |
| `id`          | UUID        | auto-generated, primary key                             |
| `merchant_id` | string      | required, non-empty                                     |
| `amount`      | integer     | required, in kobo (smallest currency unit), must be > 0 |
| `currency`    | string      | required, ISO 4217 (e.g. `"NGN"`)                       |
| `status`      | enum        | `"pending"` \| `"settled"` \| `"failed"`, required      |
| `reference`   | string      | required, unique per merchant                           |
| `created_at`  | timestamp   | auto-set on creation                                    |
| `settled_at`  | timestamp   | nullable; only present when status is `"settled"`       |
| `metadata`    | JSON object | optional, nullable                                      |

## The trade-off

The summary endpoint needs to return a total amount for a merchant. Pending transactions represent real money in motion — they've left the sender but haven't cleared. Whether that figure belongs in the merchant's total is a product decision, not a technical one. Pick one behaviour, implement it consistently everywhere a total appears — the summary endpoint, any UI display, and any documented contract — and explain your reasoning in the README.

## Deliverables

All work goes inside `solution/`. Include a `README.md` covering:

- How to run it locally
- Your API contract — every endpoint, method, request shape, and response shape
- Your decision on the trade-off and why
- One thing you'd do differently with more time

Include seed data so a reviewer can load the app immediately.

## Constraints

- Amounts must be stored and processed as integers in kobo — never floats. Float arithmetic compounds rounding errors across aggregations.
- The `reference` field must be unique at the database level, not enforced in application code only. Application-level deduplication breaks under concurrent requests.
- All input must be validated server-side with descriptive error responses. Client-side validation is bypassed trivially and counts for nothing here.

## What we're not looking for

- A polished frontend — get it working, that's enough.

## Deadline

Tuesday, May 12, 2026 at 8:00pm GMT+1

Ship something a teammate could pick up and extend.
