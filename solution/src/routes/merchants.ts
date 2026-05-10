import { Router, Request, Response } from "express";
import db from "../db";

const router = Router();

interface SummaryRow {
  status: string;
  count: number;
  total: number;
}

// GET /api/merchants/:merchant_id/summary
router.get("/:merchant_id/summary", (req: Request, res: Response) => {
  const { merchant_id } = req.params;

  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE merchant_id = ?
       GROUP BY status`
    )
    .all(merchant_id) as SummaryRow[];

  if (rows.length === 0) {
    return res.status(404).json({ error: "Merchant not found or has no payments" });
  }

  const byStatus: Record<string, { count: number; total: number }> = {};
  for (const row of rows) {
    byStatus[row.status] = { count: row.count, total: row.total };
  }

  const pending = byStatus["pending"] ?? { count: 0, total: 0 };
  const settled = byStatus["settled"] ?? { count: 0, total: 0 };
  const failed = byStatus["failed"] ?? { count: 0, total: 0 };

  // Total includes pending + settled; failed amounts are excluded.
  // Pending funds have left the sender and are in motion — the merchant needs
  // visibility into them when assessing their cash position.
  const total_amount = pending.total + settled.total;
  const total_count = pending.count + settled.count + failed.count;

  return res.json({
    merchant_id,
    total_amount,
    total_count,
    breakdown: {
      pending: { count: pending.count, amount: pending.total },
      settled: { count: settled.count, amount: settled.total },
      failed: { count: failed.count, amount: failed.total },
    },
  });
});

export default router;
