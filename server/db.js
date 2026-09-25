// ============================================================================
// Real database layer — SQLite (built into Node 22+ via node:sqlite).
//
// Replaces the old JSON-file store. Orders are now real rows in a real
// database, so data survives restarts and supports proper queries.
//
// Tables:
//   orders        — one row per order
//   order_items   — line items (one row per product per order)
//   payments      — one row per payment attempt/session
//
// The file lives at server/data/nazir.db (git-ignored).
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const DB_FILE = process.env.DB_FILE || join(DATA_DIR, "nazir.db");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);

db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS orders (
        id             TEXT PRIMARY KEY,
        created_at     TEXT NOT NULL,
        updated_at     TEXT,
        customer_name  TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        note           TEXT,
        payment_method TEXT NOT NULL,
        subtotal       INTEGER NOT NULL,
        delivery       INTEGER NOT NULL DEFAULT 0,
        total          INTEGER NOT NULL,
        currency       TEXT NOT NULL DEFAULT 'PKR',
        status         TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'unpaid'
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id   TEXT NOT NULL,
        product_id TEXT NOT NULL,
        name       TEXT NOT NULL,
        unit       TEXT NOT NULL,
        qty        INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        line_total INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
        id           TEXT PRIMARY KEY,
        order_id     TEXT NOT NULL,
        method       TEXT NOT NULL,
        amount       INTEGER NOT NULL,
        currency     TEXT NOT NULL DEFAULT 'PKR',
        status       TEXT NOT NULL DEFAULT 'pending',
        txn_ref      TEXT,
        account      TEXT,
        created_at   TEXT NOT NULL,
        updated_at   TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

    CREATE TABLE IF NOT EXISTS payment_notes (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id      TEXT NOT NULL,
        method        TEXT,
        reference     TEXT,
        paid_amount   INTEGER,
        customer_name TEXT,
        created_at    TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_payment_notes_order ON payment_notes(order_id);
`);

// ---------------------------------------------------------------- ID helpers

function nextOrderId() {
    const row = db.prepare(`SELECT id FROM orders ORDER BY rowid DESC LIMIT 1`).get();
    if (!row) return "NAC-1001";
    const n = Number(String(row.id).replace(/\D/g, "")) || 1000;
    return `NAC-${n + 1}`;
}

// ---------------------------------------------------------------- Orders

export const orderStore = {
    create({ customer, items, paymentMethod, note, subtotal, delivery, total, currency }) {
        const id = nextOrderId();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO orders (id, created_at, customer_name, customer_phone, customer_email,
                                note, payment_method, subtotal, delivery, total, currency, status, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
        `).run(id, now, customer.name, customer.phone, customer.email || null,
            note || null, paymentMethod, subtotal, delivery, total, currency);

        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, name, unit, qty, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const it of items) {
            insertItem.run(id, it.id, it.name, it.unit, it.qty, it.unitPrice, it.lineTotal);
        }

        return this.get(id);
    },

    get(id) {
        const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
        if (!order) return null;
        const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id);
        return hydrate(order, items);
    },

    update(id, patch) {
        const map = {
            status: "status",
            paymentStatus: "payment_status",
            paymentMethod: "payment_method",
        };
        const cols = [];
        const vals = [];
        for (const [k, v] of Object.entries(patch)) {
            const col = map[k];
            if (col) { cols.push(`${col} = ?`); vals.push(v); }
        }
        if (cols.length) {
            cols.push("updated_at = ?");
            vals.push(new Date().toISOString());
            vals.push(id);
            db.prepare(`UPDATE orders SET ${cols.join(", ")} WHERE id = ?`).run(...vals);
        }
        return this.get(id);
    },

    list() {
        const orders = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
        return orders.map((o) => hydrate(o, db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(o.id)));
    },

    /** Record a customer-declared wallet payment (manual JazzCash / Easypaisa). */
    addPaymentNote(orderId, { method, reference, paidAmount, customerName }) {
        db.prepare(`
            INSERT INTO payment_notes (order_id, method, reference, paid_amount, customer_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, method || null, reference || null,
            paidAmount != null ? Number(paidAmount) : null,
            customerName || null, new Date().toISOString());
        return this.get(orderId);
    },

    notes(orderId) {
        return db.prepare(`SELECT * FROM payment_notes WHERE order_id = ? ORDER BY rowid DESC`).all(orderId);
    },
};

function hydrate(row, items) {
    return {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method,
        customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
        note: row.note,
        subtotal: row.subtotal,
        delivery: row.delivery,
        total: row.total,
        currency: row.currency,
        items: items.map((i) => ({
            id: i.product_id, name: i.name, unit: i.unit,
            qty: i.qty, unitPrice: i.unit_price, lineTotal: i.line_total,
        })),
    };
}

// ---------------------------------------------------------------- Payments

export const paymentStore = {
    create({ id, orderId, method, amount, currency, account }) {
        const now = new Date().toISOString();
        db.prepare(`
            INSERT INTO payments (id, order_id, method, amount, currency, status, account, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        `).run(id, orderId, method, amount, currency, account || null, now);
        return this.get(id);
    },

    get(id) {
        return db.prepare(`SELECT * FROM payments WHERE id = ?`).get(id) || null;
    },

    markPaid(id, txnRef) {
        db.prepare(`
            UPDATE payments SET status = 'paid', txn_ref = ?, updated_at = ? WHERE id = ?
        `).run(txnRef, new Date().toISOString(), id);
        return this.get(id);
    },
};

export default db;
