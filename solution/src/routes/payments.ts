import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = Router();

const VALID_STATUSES = ["pending", "settled", "failed"] as const;
type Status = (typeof VALID_STATUSES)[number];

interface PaymentRow {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: Status;
  reference: string;
  created_at: string;
  settled_at: string | null;
  metadata: string | null;
}

function serializePayment(row: PaymentRow) {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

// POST /api/payments
router.post("/", (req: Request, res: Response) => {
  const { merchant_id, amount, currency, status, reference, settled_at, metadata } = req.body;

  const errors: string[] = [];

  if (!merchant_id || typeof merchant_id !== "string" || merchant_id.trim() === "") {
    errors.push("merchant_id is required and must be a non-empty string");
  }
  if (amount === undefined || amount === null) {
    errors.push("amount is required");
  } else if (!Number.isInteger(amount) || amount <= 0) {
    errors.push("amount must be a positive integer (in kobo)");
  }
  if (!currency || typeof currency !== "string" || currency.trim() === "") {
    errors.push("currency is required (ISO 4217, e.g. NGN)");
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    errors.push(`status is required and must be one of: ${VALID_STATUSES.join(", ")}`);
  }
  if (!reference || typeof reference !== "string" || reference.trim() === "") {
    errors.push("reference is required and must be a non-empty string");
  }
  if (status === "settled" && !settled_at) {
    errors.push("settled_at is required when status is 'settled'");
  }
  if (settled_at && isNaN(Date.parse(settled_at))) {
    errors.push("settled_at must be a valid ISO 8601 timestamp");
  }
  if (metadata !== undefined && metadata !== null && typeof metadata !== "object") {
    errors.push("metadata must be a JSON object or null");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const id = uuidv4();
  const created_at = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      INSERT INTO payments (id, merchant_id, amount, currency, status, reference, created_at, settled_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      merchant_id.trim(),
      amount,
      currency.trim().toUpperCase(),
      status,
      reference.trim(),
      created_at,
      settled_at ?? null,
      metadata != null ? JSON.stringify(metadata) : null
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE")) {
      return res.status(409).json({
        error: "Conflict",
        details: ["A payment with this reference already exists for this merchant"],
      });
    }
    throw err;
  }

  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as PaymentRow;
  return res.status(201).json(serializePayment(row));
});

// GET /api/payments
router.get("/", (req: Request, res: Response) => {
  const { status, merchant_id, page, limit } = req.query;

  if (status && !VALID_STATUSES.includes(status as Status)) {
    return res.status(400).json({
      error: "Validation failed",
      details: [`status must be one of: ${VALID_STATUSES.join(", ")}`],
    });
  }

  const pageNum = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit ?? "50"), 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (merchant_id) {
    conditions.push("merchant_id = ?");
    params.push(merchant_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM payments ${where}`).get(...params) as { count: number }
  ).count;

  params.push(limitNum, offset);
  const rows = db
    .prepare(`SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params) as PaymentRow[];

  return res.json({
    data: rows.map(serializePayment),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/payments/:id
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id) as
    | PaymentRow
    | undefined;

  if (!row) {
    return res.status(404).json({ error: "Payment not found" });
  }

  return res.json(serializePayment(row));
});

export default router;
