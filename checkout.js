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
// Real manual payment flow:
//   1. Customer pays in their JazzCash / Easypaisa app to the shop number.
//   2. Customer uploads a screenshot of the payment.
//   3. The order + screenshot are sent to the shop owner on WhatsApp.
async function placeOrder() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const note = document.getElementById("note").value.trim();

    if (!name || !phone) return setStatus("Please enter your name and phone number.", "error");
    const lines = cartLines();
    if (lines.length === 0) return setStatus("Please add at least one product to your order.", "error");

    const total = lines.reduce((s, l) => s + l.lineTotal, 0);
    const methodLabel = state.method === "jazzcash" ? "JazzCash" : "Easypaisa";
    const accountNo = (state.accounts[state.method] && state.accounts[state.method].number) || "0316 4395007";

    // Build the order summary text used in WhatsApp.
    const summary = lines.map((l) => `${l.qty} x ${l.name} (${money(l.lineTotal)})`).join("\n");

    // If a backend is available, create the order there too (real DB record).
    let orderId = null;
    if (state.hasBackend) {
        try {
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
            if (orderRes.ok && orderData.order) {
                orderId = orderData.order.id;
                state.lastOrder = orderData.order;
            }
        } catch (e) { /* continue without an order id */ }
    }

    const shortId = orderId || ("NAC-" + Math.floor(1000 + Math.random() * 9000));

    // Show the real payment step: pay in the app, then upload a screenshot.
    showPaymentStep({ name, phone, note, total, methodLabel, accountNo, summary, shortId });
}

function showPaymentStep({ name, phone, note, total, methodLabel, accountNo, summary, shortId }) {
    const box = document.getElementById("statusBox");
    box.className = "status-box show ok";
    box.innerHTML =
        `<div class="paystep">` +
        `<h4><i class="fa-solid fa-mobile-screen-button"></i> Pay ${money(total)} by ${methodLabel}</h4>` +
        `<ol class="paystep-steps">` +
        `<li>Open your <strong>${methodLabel}</strong> app.</li>` +
        `<li>Choose <strong>Send Money</strong> / <strong>Money Transfer</strong>.</li>` +
        `<li>Send <strong>${money(total)}</strong> to:</li>` +
        `</ol>` +
        `<div class="paystep-account"><span>${methodLabel} Account</span><strong>${accountNo}</strong></div>` +
        `<label class="paystep-upload" for="screenshotInput">` +
        `<i class="fa-solid fa-camera"></i> Upload payment screenshot` +
        `</label>` +
        `<input type="file" id="screenshotInput" accept="image/*" hidden>` +
        `<div id="shotPreview" class="paystep-preview"></div>` +
        `<button type="button" id="sendWaBtn" class="btn btn-green" style="width:100%;justify-content:center;margin-top:12px;" disabled>` +
        `<i class="fa-brands fa-whatsapp"></i> Send order + screenshot on WhatsApp` +
        `</button>` +
        `<p class="paystep-hint">After WhatsApp opens, please <strong>attach your screenshot</strong> and tap send. Your order ID is <strong>${shortId}</strong>.</p>` +
        `</div>`;

    const waText = encodeURIComponent(
        `ASSALAM-O-ALAIKUM, I have paid by ${methodLabel}.\n\n` +
        `Order ID: ${shortId}\n` +
        `Name: ${name}\nPhone: ${phone}\n\n` +
        `Items:\n${summary}\n\n` +
        `Total: ${money(total)}\nPaid to ${methodLabel}: ${accountNo}` +
        (note ? `\nNote: ${note}` : "") +
        `\n\n(I am sending the payment screenshot now.)`
    );
    const waUrl = `https://wa.me/923297466292?text=${waText}`;

    const input = document.getElementById("screenshotInput");
    const preview = document.getElementById("shotPreview");
    const sendBtn = document.getElementById("sendWaBtn");

    sendBtn.addEventListener("click", function () {
        window.open(waUrl, "_blank");
    });

    input.addEventListener("change", function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Payment screenshot"><span class="shot-ok"><i class="fa-solid fa-circle-check"></i> Screenshot attached</span>`;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Send order + screenshot on WhatsApp';
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
loadShop();
