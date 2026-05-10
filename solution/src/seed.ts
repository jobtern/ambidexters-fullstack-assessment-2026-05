import { v4 as uuidv4 } from "uuid";
import db from "./db";

const merchants = ["merchant_alpha", "merchant_beta", "merchant_gamma"];

const payments = [
  {
    merchant_id: "merchant_alpha",
    amount: 500000,
    currency: "NGN",
    status: "settled",
    reference: "alpha-ref-001",
    settled_at: "2026-05-01T10:00:00.000Z",
    metadata: { channel: "card", customer: "customer_1" },
  },
  {
    merchant_id: "merchant_alpha",
    amount: 150000,
    currency: "NGN",
    status: "settled",
    reference: "alpha-ref-002",
    settled_at: "2026-05-02T12:30:00.000Z",
    metadata: { channel: "transfer" },
  },
  {
    merchant_id: "merchant_alpha",
    amount: 75000,
    currency: "NGN",
    status: "pending",
    reference: "alpha-ref-003",
    settled_at: null,
    metadata: null,
  },
  {
    merchant_id: "merchant_alpha",
    amount: 200000,
    currency: "NGN",
    status: "failed",
    reference: "alpha-ref-004",
    settled_at: null,
    metadata: { reason: "insufficient_funds" },
  },
  {
    merchant_id: "merchant_beta",
    amount: 1000000,
    currency: "NGN",
    status: "settled",
    reference: "beta-ref-001",
    settled_at: "2026-05-03T08:00:00.000Z",
    metadata: { channel: "card" },
  },
  {
    merchant_id: "merchant_beta",
    amount: 350000,
    currency: "NGN",
    status: "pending",
    reference: "beta-ref-002",
    settled_at: null,
    metadata: null,
  },
  {
    merchant_id: "merchant_beta",
    amount: 90000,
    currency: "NGN",
    status: "failed",
    reference: "beta-ref-003",
    settled_at: null,
    metadata: { reason: "card_declined" },
  },
  {
    merchant_id: "merchant_gamma",
    amount: 250000,
    currency: "NGN",
    status: "settled",
    reference: "gamma-ref-001",
    settled_at: "2026-05-04T14:00:00.000Z",
    metadata: { channel: "ussd" },
  },
  {
    merchant_id: "merchant_gamma",
    amount: 120000,
    currency: "NGN",
    status: "pending",
    reference: "gamma-ref-002",
    settled_at: null,
    metadata: null,
  },
  {
    merchant_id: "merchant_gamma",
    amount: 800000,
    currency: "NGN",
    status: "settled",
    reference: "gamma-ref-003",
    settled_at: "2026-05-05T09:45:00.000Z",
    metadata: { channel: "card", customer: "customer_9" },
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO payments (id, merchant_id, amount, currency, status, reference, created_at, settled_at, metadata)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction(() => {
  let count = 0;
  for (const p of payments) {
    const result = insert.run(
      uuidv4(),
      p.merchant_id,
      p.amount,
      p.currency,
      p.status,
      p.reference,
      new Date().toISOString(),
      p.settled_at ?? null,
      p.metadata ? JSON.stringify(p.metadata) : null
    );
    count += result.changes;
  }
  return count;
});

const inserted = insertMany();
console.log(`Seed complete. Inserted ${inserted} payment(s).`);
console.log(`Merchants: ${merchants.join(", ")}`);
