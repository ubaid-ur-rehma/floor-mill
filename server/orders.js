// ============================================================================
// Lightweight JSON-file order store.
// Persists orders to server/data/orders.json so they survive a restart.
// For production you would swap this for a real database (Postgres/Mongo);
// the interface below is intentionally small so the swap is easy.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const ORDERS_FILE = join(DATA_DIR, "orders.json");

function ensureStore() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(ORDERS_FILE)) writeFileSync(ORDERS_FILE, "[]", "utf8");
}

function readAll() {
    ensureStore();
    try {
        return JSON.parse(readFileSync(ORDERS_FILE, "utf8"));
    } catch {
        return [];
    }
}

function writeAll(orders) {
    ensureStore();
    writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

let sequence = null;

function nextId() {
    if (sequence === null) {
        const orders = readAll();
        const max = orders.reduce((m, o) => {
            const n = Number(String(o.id).replace(/\D/g, ""));
            return Number.isFinite(n) && n > m ? n : m;
        }, 1000);
        sequence = max;
    }
    sequence += 1;
    return `NAC-${sequence}`;
}

export const orderStore = {
    create(order) {
        const all = readAll();
        const record = {
            id: nextId(),
            createdAt: new Date().toISOString(),
            status: "pending",
            ...order,
        };
        all.push(record);
        writeAll(all);
        return record;
    },

    get(id) {
        return readAll().find((o) => o.id === id) || null;
    },

    update(id, patch) {
        const all = readAll();
        const idx = all.findIndex((o) => o.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        writeAll(all);
        return all[idx];
    },

    list() {
        return readAll();
    },
};
