// ============================================================================
// Checkout page logic — talks to the real backend API.
//   GET  /api/shop                -> products + payment accounts
//   POST /api/orders              -> create order
//   POST /api/orders/:id/pay      -> start payment
//   POST /api/payments/:s/confirm -> confirm payment
//
// API location:
//   - When the backend serves this page (npm start), it is the SAME origin -> "".
//   - When this page is hosted on GitHub Pages and the backend is on Render,
//     set window.API_BASE_URL (see the <script> in checkout.html) to the
//     backend URL, e.g. "https://nazir-atta-chakki.onrender.com".
// ============================================================================

const API = (typeof window !== "undefined" && window.API_BASE_URL) || "";

// Built-in products so checkout works on GitHub Pages (no backend).
const FALLBACK_PRODUCTS = [
    { id: "desi-gandum-atta", name: "Desi Gandum ke Atta", price: 180, unit: "kg", image: "atta2.jpeg" },
    { id: "narala-supreme-chawal", name: "Narala Supreme Chawal", price: 415, unit: "kg", image: "atta3.jpeg" },
    { id: "white-atta", name: "White Atta", price: 180, unit: "kg", image: "atta4.jpeg" },
    { id: "makai-ka-atta", name: "Makai ka Atta", price: 210, unit: "kg", image: "img/makai-atta.svg" },
    { id: "jo-ka-atta", name: "Jo ka Atta", price: 280, unit: "kg", image: "img/jo-atta.svg" },
    { id: "chawal-ka-atta", name: "Chawal ka Atta", price: 300, unit: "kg", image: "img/chawal-atta.svg" },
    { id: "gandum-ka-dalia", name: "Gandum ka Dalia", price: 220, unit: "kg", image: "img/gandum-dalia.svg" },
    { id: "jo-ka-dalia", name: "Jo ka Dalia", price: 360, unit: "kg", image: "img/jo-dalia.svg" },
    { id: "bajre-ka-atta", name: "Bajre ka Atta", price: 200, unit: "kg", image: "img/bajra-atta.svg" },
];

const state = {
    products: [],
    accounts: {
        easypaisa: { label: "Easypaisa", number: "0316 4395007" },
        jazzcash: { label: "JazzCash", number: "0316 4395007" },
    },
    cart: {},        // { productId: qty }
    customer: { name: "", phone: "", note: "" },
    method: "easypaisa",
    hasBackend: !!API,
    lastOrder: null,
};

const money = (n) => "Rs " + Number(n).toLocaleString("en-PK");

// --------------------------------------------------------------- load shop
async function loadShop() {
    // Pre-select method from ?method=jazzcash / ?method=easypaisa
    const params = new URLSearchParams(location.search);
    const wantMethod = params.get("method");
    if (wantMethod === "jazzcash" || wantMethod === "easypaisa") state.method = wantMethod;

    // Start with built-in products so the page always works.
    state.products = FALLBACK_PRODUCTS;
    if (state.products[0]) state.cart[state.products[0].id] = 1;
    renderCart();
    renderPayChoices();
    renderTotals();

    // Try the API (upgrades products/accounts when a backend exists).
    try {
        const res = await fetch(`${API}/api/shop`);
        const data = await res.json();
        if (data && data.products && data.products.length) {
            state.products = data.products;
            state.accounts = data.paymentAccounts;
            state.hasBackend = true;
        }
    } catch (e) { /* keep built-in products */ }

    if (state.products[0] && Object.keys(state.cart).length === 0) {
        state.cart[state.products[0].id] = 1;
    }
    renderCart();
    renderPayChoices();
    renderTotals();
}

// --------------------------------------------------------------- cart UI
function renderCart() {
    const el = document.getElementById("cart");
    el.innerHTML = "";
    state.products.forEach((p) => {
        const qty = state.cart[p.id] || 0;
        const line = document.createElement("div");
        line.className = "cart-line";
        line.innerHTML = `
            <img src="${p.image}" alt="${p.name}">
            <div class="cl-info">
                <h4>${p.name}</h4>
                <span>${money(p.price)} / ${p.unit}</span>
            </div>
            <div class="qty">
                <button type="button" data-dec="${p.id}">&minus;</button>
                <input type="number" min="0" value="${qty}" data-qty="${p.id}">
                <button type="button" data-inc="${p.id}">+</button>
            </div>
            <div class="cl-total">${money(p.price * qty)}</div>`;
        el.appendChild(line);
    });

    el.querySelectorAll("[data-inc]").forEach((b) =>
        b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    el.querySelectorAll("[data-dec]").forEach((b) =>
        b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    el.querySelectorAll("[data-qty]").forEach((i) =>
        i.addEventListener("change", () => setQty(i.dataset.qty, Number(i.value))));
}

function changeQty(id, delta) {
    setQty(id, (state.cart[id] || 0) + delta);
}

function setQty(id, qty) {
    qty = Math.max(0, Math.floor(qty || 0));
    state.cart[id] = qty;
    renderCart();
    renderTotals();
}

function cartLines() {
    return Object.entries(state.cart)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => {
            const p = state.products.find((x) => x.id === id);
            return { id, name: p.name, unit: p.unit, qty, unitPrice: p.price, lineTotal: p.price * qty };
        });
}

// --------------------------------------------------------------- totals
function renderTotals() {
    const lines = cartLines();
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const el = document.getElementById("totals");
    el.innerHTML =
        lines.map((l) => `<div class="totals-row"><span>${l.name} × ${l.qty} ${l.unit}</span><span>${money(l.lineTotal)}</span></div>`).join("") +
        `<div class="totals-row"><span>Delivery (takeaway)</span><span>Free</span></div>` +
        `<div class="totals-row grand"><span>Total</span><span>${money(subtotal)}</span></div>`;
}

// --------------------------------------------------------------- payment UI
function renderPayChoices() {
    const el = document.getElementById("payChoices");
    const opts = [
        { id: "easypaisa", icon: "fa-mobile-screen-button", color: "#00a651", label: "Easypaisa", sub: "Pay from your Easypaisa mobile account" },
        { id: "jazzcash", icon: "fa-wallet", color: "#e4002b", label: "JazzCash", sub: "Pay from your JazzCash mobile wallet" },
    ];
    el.innerHTML = "";
    opts.forEach((o) => {
        const wrap = document.createElement("label");
        wrap.className = "pay-choice" + (state.method === o.id ? " selected" : "");
        wrap.innerHTML = `
            <input type="radio" name="paymethod" value="${o.id}" ${state.method === o.id ? "checked" : ""}>
            <span class="pc-icon" style="color:${o.color}"><i class="fa-solid ${o.icon}"></i></span>
            <span class="pc-text"><strong>${o.label}</strong><span>${o.sub}</span></span>`;
        wrap.querySelector("input").addEventListener("change", () => {
            state.method = o.id;
            renderPayChoices();
        });
        el.appendChild(wrap);
    });
}

// --------------------------------------------------------------- status
function setStatus(msg, kind) {
    const box = document.getElementById("statusBox");
    box.className = "status-box show " + kind;
    box.innerHTML = msg;
}

// --------------------------------------------------------------- place order
async function placeOrder() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const note = document.getElementById("note").value.trim();

    if (!name || !phone) return setStatus("Please enter your name and phone number.", "error");
    const lines = cartLines();
    if (lines.length === 0) return setStatus("Please add at least one product to your order.", "error");

    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true;
    setStatus("Creating your order…", "ok");

    const methodLabel = state.method === "jazzcash" ? "JazzCash" : "Easypaisa";

    // ---- No backend (e.g. GitHub Pages): confirm + hand off to WhatsApp ----
    if (!state.hasBackend) {
        const summary = lines.map((l) => `${l.qty} x ${l.name}`).join(", ");
        const total = lines.reduce((s, l) => s + l.lineTotal, 0);
        const waText = encodeURIComponent(
            `ASSALAM-O-ALAIKUM, I want to pay by ${methodLabel}.\n\n` +
            `Name: ${name}\nPhone: ${phone}\nOrder: ${summary}\nTotal: Rs ${total}` +
            (note ? `\nNote: ${note}` : "")
        );
        setStatus(
            `\u2705 <strong>Order ready \u2014 pay by ${methodLabel}</strong><br>` +
            `Send ${methodLabel} payment to <strong>0316 4395007</strong><br>` +
            `Total: ${money(total)}<br><br>` +
            `<a href="https://wa.me/923297466292?text=${waText}" target="_blank" rel="noopener" class="btn btn-green" style="margin-top:6px;">` +
            `<i class="fa-brands fa-whatsapp"></i> Confirm on WhatsApp</a>`,
            "ok");
        btn.disabled = false;
        return;
    }

    try {
        // 1. Create order
        const orderRes = await fetch(`${API}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer: { name, phone, email: null },
                items: lines.map((l) => ({ id: l.id, qty: l.qty })),
                paymentMethod: state.method,
                note,
            }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Could not create order.");
        const order = orderData.order;
        state.lastOrder = order;

        // 2. Start payment
        const payRes = await fetch(`${API}/api/orders/${order.id}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: state.method }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || "Could not start payment.");
        const session = payData.session;

        // 3. Confirm the (sandbox) payment.
        setStatus(`Order ${order.id} created. Processing payment via ${session.method}…`, "ok");
        const confirmRes = await fetch(`${API}/api/payments/${session.sessionId}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.error || "Payment confirmation failed.");

        setStatus(
            `\u2705 <strong>Payment successful!</strong><br>Order <strong>${order.id}</strong><br>` +
            `Paid: ${money(order.total)} via ${methodLabel}<br>Transaction: ${confirmData.txnRef}<br>` +
            `Show this order ID when you collect.`, "ok");
    } catch (err) {
        setStatus("\u274c " + err.message, "error");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
loadShop();
