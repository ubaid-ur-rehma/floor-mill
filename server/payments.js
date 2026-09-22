// ============================================================================
// Payment processing.
//
// HOW REAL MERCHANT PAYMENTS WORK (Easypaisa / JazzCash / Card):
//   1. Your server calls the provider's API with your merchant credentials
//      to create a "payment session" and receives a checkout URL / token.
//   2. The customer is redirected there, pays, and the provider redirects back.
//   3. The provider also POSTs a webhook to your server (the trustworthy
//      confirmation). You verify its signature and mark the order paid.
//
// This module implements that exact shape. Until the shop is issued real
// merchant credentials by Easypaisa/JazzCash, it runs in SANDBOX mode, which
// simulates steps 1-3 locally so the whole flow is testable end to end.
//
// To go live: set EASYPAISA_* / JAZZCASH_* env vars (see .env.example) and
// fill in the `createLiveSession()` calls below. Nothing else changes.
// ============================================================================

import { randomUUID, createHmac } from "node:crypto";
import { PAYMENT_ACCOUNTS } from "./data/catalogue.js";

const MODE = process.env.PAYMENT_MODE || "sandbox"; // "sandbox" | "live"

// In-memory set of payment sessions (sandbox). In live mode the provider holds
// this state and you only keep the mapping orderId <-> providerTxnId.
const sessions = new Map();

export const METHODS = ["easypaisa", "jazzcash", "bank", "cod"];

export function isMethodValid(method) {
    return METHODS.includes(method);
}

function sign(payload) {
    const secret = process.env.PAYMENT_SIGNING_SECRET || "dev-secret-change-me";
    return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Create a payment session for an order.
 * @returns {{ mode, method, sessionId, amount, currency, nextAction, instructions? }}
 */
export function createPaymentSession({ orderId, method, amount, currency }) {
    const sessionId = randomUUID();

    // Cash on Delivery needs no gateway — it settles at pickup.
    if (method === "cod") {
        sessions.set(sessionId, { orderId, method, amount, currency, status: "pending" });
        return {
            mode: MODE,
            method,
            sessionId,
            amount,
            currency,
            nextAction: "none",
            instructions: PAYMENT_ACCOUNTS.cod.note,
        };
    }

    // Bank transfer: we give the customer the account and they upload proof.
    if (method === "bank") {
        sessions.set(sessionId, { orderId, method, amount, currency, status: "awaiting_transfer" });
        return {
            mode: MODE,
            method,
            sessionId,
            amount,
            currency,
            nextAction: "bank_transfer",
            instructions: "Transfer to the account below, then submit your transaction reference.",
            account: PAYMENT_ACCOUNTS.bank,
        };
    }

    // Mobile wallets: Easypaisa / JazzCash.
    if (MODE === "live") {
        // ---- Live branch (runs when real merchant credentials are present) ----
        // const url = await createLiveSession({ method, amount, currency, orderId });
        // return { mode, method, sessionId, amount, currency, nextAction: "redirect", redirectUrl: url };
        throw new Error(
            "Live payment mode requires merchant credentials. Set PAYMENT_MODE=sandbox or configure " +
            "EASYPAISA_* / JAZZCASH_* environment variables."
        );
    }

    // ---- Sandbox branch: simulate the provider checkout ----
    sessions.set(sessionId, { orderId, method, amount, currency, status: "pending" });
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
 * Confirm / verify a payment. In live mode this is where you validate the
 * provider webhook signature before trusting it. In sandbox it always succeeds.
 */
export function confirmPayment({ sessionId, signature }) {
    const session = sessions.get(sessionId);
    if (!session) return { ok: false, error: "Unknown or expired payment session." };

    if (MODE === "live") {
        const expected = sign(`${sessionId}:${session.orderId}:${session.amount}`);
        if (signature !== expected) return { ok: false, error: "Invalid payment signature." };
    }

    session.status = "paid";
    sessions.set(sessionId, session);
    const txnRef = "TXN-" + sessionId.slice(0, 8).toUpperCase();
    return { ok: true, sessionId, orderId: session.orderId, status: "paid", txnRef };
}