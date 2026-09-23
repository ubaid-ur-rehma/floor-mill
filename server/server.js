// ============================================================================
// Nazir Atta Chakki — application server.
//
// Serves the static website and exposes a small REST API for the real
// checkout + payment flow:
//
//   GET  /api/shop                     shop info + products + payment accounts
//   GET  /api/products                 product catalogue
//   POST /api/orders                   create an order  -> { orderId, totals }
//   GET  /api/orders/:id               fetch an order
//   POST /api/orders/:id/pay           start a payment    -> { sessionId, nextAction }
//   POST /api/payments/:session/confirm confirm payment   -> { status }
//
// Data is stored in a real SQLite database (server/db.js).
// Run:  npm start        (http://localhost:3000)
// ============================================================================

import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SHOP, PAYMENT_ACCOUNTS, PRODUCTS, findProduct } from "./data/catalogue.js";
import { orderStore } from "./db.js";
import {
    METHODS,
    isMethodValid,
    createPaymentSession,
    confirmPayment,
} from "./payments.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// ---------------------------------------------------------------- CORS
// Allow the site (e.g. GitHub Pages) to call this API from another origin.
// Set ALLOWED_ORIGIN in the environment to lock it down in production;
// defaults to "*" so the free Render deploy works out of the box.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// ---------------------------------------------------------------- API routes

app.get("/api/shop", (_req, res) => {
    res.json({ shop: SHOP, products: PRODUCTS, paymentAccounts: PAYMENT_ACCOUNTS, methods: METHODS });
});

app.get("/api/products", (_req, res) => {
    res.json({ products: PRODUCTS });
});

/**
 * Create an order. Body: { customer:{name,phone,email?}, items:[{id,qty}],
 * paymentMethod, note? }
 */
app.post("/api/orders", (req, res) => {
    const { customer, items, paymentMethod, note } = req.body || {};

    if (!customer || !customer.name || !customer.phone) {
        return res.status(400).json({ error: "customer.name and customer.phone are required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one item is required." });
    }
    if (!isMethodValid(paymentMethod)) {
        return res.status(400).json({ error: `paymentMethod must be one of: ${METHODS.join(", ")}` });
    }

    const lineItems = [];
    for (const it of items) {
        const product = findProduct(it.id);
        if (!product) return res.status(400).json({ error: `Unknown product: ${it.id}` });
        const qty = Number(it.qty);
        if (!Number.isFinite(qty) || qty <= 0) {
            return res.status(400).json({ error: `Invalid quantity for ${it.id}` });
        }
        lineItems.push({
            id: product.id,
            name: product.name,
            unit: product.unit,
            qty,
            unitPrice: product.price,
            lineTotal: product.price * qty,
        });
    }

    const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
    const delivery = 0; // takeaway only
    const total = subtotal + delivery;

    const order = orderStore.create({
        customer: { name: customer.name, phone: customer.phone, email: customer.email || null },
        items: lineItems,
        paymentMethod,
        note: note || null,
        subtotal,
        delivery,
        total,
        currency: SHOP.currency,
    });

    res.status(201).json({ order });
});

app.get("/api/orders/:id", (req, res) => {
    const order = orderStore.get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ order });
});

/** Start a payment for an existing order. */
app.post("/api/orders/:id/pay", (req, res) => {
    const order = orderStore.get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.paymentStatus === "paid") {
        return res.status(409).json({ error: "Order is already paid." });
    }

    const method = req.body?.method || order.paymentMethod;
    if (!isMethodValid(method)) {
        return res.status(400).json({ error: `method must be one of: ${METHODS.join(", ")}` });
    }

    const session = createPaymentSession({
        orderId: order.id,
        method,
        amount: order.total,
        currency: order.currency,
    });

    orderStore.update(order.id, { paymentMethod: method, paymentStatus: "pending" });

    res.json({ session });
});

/** Confirm a payment session (sandbox) or a provider callback (live). */
app.post("/api/payments/:sessionId/confirm", (req, res) => {
    const result = confirmPayment({
        sessionId: req.params.sessionId,
        signature: req.body?.signature,
    });
    if (!result.ok) return res.status(400).json({ error: result.error });

    orderStore.update(result.orderId, {
        paymentStatus: "paid",
        status: "confirmed",
    });

    const order = orderStore.get(result.orderId);
    res.json({ ok: true, txnRef: result.txnRef, order });
});

// ------------------------------------------------------------ Static hosting

app.use(express.static(ROOT, { extensions: ["html"] }));

app.get("/", (_req, res) => res.sendFile(join(ROOT, "index.html")));

app.listen(PORT, () => {
    console.log(`\n  Nazir Atta Chakki server running`);
    console.log(`  →  http://localhost:${PORT}`);
    console.log(`  →  API: http://localhost:${PORT}/api/shop`);
    console.log(`  →  Payment mode: ${process.env.PAYMENT_MODE || "sandbox"}\n`);
});
