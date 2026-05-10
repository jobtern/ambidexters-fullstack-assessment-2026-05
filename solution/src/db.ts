import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "ledger.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id          TEXT    PRIMARY KEY,
    merchant_id TEXT    NOT NULL,
    amount      INTEGER NOT NULL CHECK (amount > 0),
    currency    TEXT    NOT NULL,
    status      TEXT    NOT NULL CHECK (status IN ('pending', 'settled', 'failed')),
    reference   TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    settled_at  TEXT,
    metadata    TEXT,
    UNIQUE (merchant_id, reference)
  );
`);

export default db;
