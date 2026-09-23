// ============================================================================
// Payment processing — JazzCash & Easypaisa only.
//
// HOW REAL MERCHANT PAYMENTS WORK:
//   1. Your server calls the provider's API with your merchant credentials
//      to create a "payment session" and receives a checkout URL / token.
//   2. The customer is redirected there, pays, and the provider redirects back.
//   3. The provider also POSTs a webhook to your server (the trustworthy
//      confirmation). You verify its signature and mark the order paid.
//
// This module implements that shape and persists every payment to the SQLite
// database. Until the shop has real merchant credentials it runs in SANDBOX
// mode, which simulates steps 1-3 locally so the flow is testable end to end.
//
// To go live: set EASYPAISA_* / JAZZCASH_* env vars (see .env.example), set
// PAYMENT_MODE=live, and complete createLiveSession() below.
// ============================================================================

import { randomUUID, createHmac } from "node:crypto";
import { PAYMENT_ACCOUNTS } from "./data/catalogue.js";
import { paymentStore } from "./db.js";

const MODE = process.env.PAYMENT_MODE || "sandbox"; // "sandbox" | "live"

// Only these two methods are accepted.
export const METHODS = ["easypaisa", "jazzcash"];

export function isMethodValid(method) {
    return METHODS.includes(method);
}

function sign(payload) {
    const secret = process.env.PAYMENT_SIGNING_SECRET || "dev-secret-change-me";
    return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Create a payment session for an order and persist it.
 * @returns {{ mode, method, sessionId, amount, currency, nextAction, instructions?, account }}
 */
export function createPaymentSession({ orderId, method, amount, currency }) {
    const sessionId = randomUUID();

    if (MODE === "live") {
        // ---- Live branch (runs when real merchant credentials are present) ----
        // const url = await createLiveSession({ method, amount, currency, orderId });
        // paymentStore.create({ id: sessionId, orderId, method, amount, currency, account: PAYMENT_ACCOUNTS[method].number });
        // return { mode, method, sessionId, amount, currency, nextAction: "redirect", redirectUrl: url };
        throw new Error(
            "Live payment mode requires merchant credentials. Set PAYMENT_MODE=sandbox or configure " +
            "EASYPAISA_* / JAZZCASH_* environment variables."
        );
    }

    // Persist the payment row immediately (real database record).
    paymentStore.create({
        id: sessionId,
        orderId,
        method,
        amount,
        currency,
        account: PAYMENT_ACCOUNTS[method].number,
    });

    return {
        mode: MODE,
        method,
        sessionId,
        amount,
        currency,
        nextAction: "confirm_sandbox",
        instructions:
            `Sandbox mode: no real money moves. In production this step opens the ${PAYMENT_ACCOUNTS[method].label} ` +
            `checkout where the customer pays ${currency} ${amount}.`,
        account: PAYMENT_ACCOUNTS[method],
    };
}

/**
 * Confirm / verify a payment.
 * In live mode this is where you validate the provider webhook signature.
 * In sandbox it always succeeds. Either way the result is written to the DB.
 */
export function confirmPayment({ sessionId, signature }) {
    const session = paymentStore.get(sessionId);
    if (!session) return { ok: false, error: "Unknown or expired payment session." };

    if (MODE === "live") {
        const expected = sign(`${sessionId}:${session.order_id}:${session.amount}`);
        if (signature !== expected) return { ok: false, error: "Invalid payment signature." };
    }

    const txnRef = "TXN-" + sessionId.slice(0, 8).toUpperCase();
    paymentStore.markPaid(sessionId, txnRef);

    return { ok: true, sessionId, orderId: session.order_id, status: "paid", txnRef };
}