// ============================================================================
//  CART + PRODUCT CUSTOMIZER + FLY-TO-CART
//  ---------------------------------------------------------------------------
//  Reads everything from config.js (window.NAC_CONFIG).
//  Adds, on any page that includes it:
//    • a 🛒 cart button in the navigation (with a live item badge)
//    • a slide-out cart drawer (add / remove / change quantity)
//    • a "Choose Your Atta" customizer  (product + size + quantity + live price)
//    • a cinematic "fly to cart" animation and an "Added to Cart" toast
//    • localStorage persistence, so the cart survives a refresh
// ============================================================================
(function () {
    var CFG = window.NAC_CONFIG || {};
    if (!CFG.products) return;

    var STORAGE_KEY = "nac_cart_v1";
    var CUR = CFG.currency || "Rs";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ----------------------------------------------------------------- utils
    function money(n) {
        return CUR + " " + Number(n).toLocaleString("en-PK");
    }

    function findProduct(id) {
        return CFG.products.find(function (p) { return p.id === id; }) || null;
    }

    function sizeFor(kg) {
        return (CFG.sizes || []).find(function (s) { return s.kg === Number(kg); }) ||
            (CFG.sizes && CFG.sizes[0]) || { kg: 1, label: "1 KG", multiplier: 1 };
    }

    function priceFor(product, kg) {
        var s = sizeFor(kg);
        return Math.round(product.price * s.multiplier);
    }

    // ------------------------------------------------------------- cart state
    var cart = [];

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) cart = JSON.parse(raw) || [];
        } catch (e) { cart = []; }
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
    }

    function cartCount() {
        return cart.reduce(function (n, l) { return n + l.qty; }, 0);
    }

    function cartTotal() {
        return cart.reduce(function (n, l) { return n + l.lineTotal; }, 0);
    }

    function addToCart(productId, kg, qty) {
        var p = findProduct(productId);
        if (!p) return null;
        var line = cart.find(function (l) { return l.id === productId && l.kg === Number(kg); });
        if (line) {
            line.qty += qty;
            line.lineTotal = line.unitPrice * line.qty;
        } else {
            var unitPrice = priceFor(p, kg);
            line = {
                id: p.id,
                name: p.name,
                image: p.image,
                kg: Number(kg),
                sizeLabel: sizeFor(kg).label,
                qty: qty,
                unitPrice: unitPrice,
                lineTotal: unitPrice * qty,
            };
            cart.push(line);
        }
        save();
        renderCart();
        updateBadge();
        return line;
    }

    function setQty(index, qty) {
        if (!cart[index]) return;
        qty = Math.max(0, Math.floor(qty || 0));
        if (qty === 0) { cart.splice(index, 1); }
        else {
            cart[index].qty = qty;
            cart[index].lineTotal = cart[index].unitPrice * qty;
        }
        save();
        renderCart();
        updateBadge();
    }

    function removeLine(index) {
        cart.splice(index, 1);
        save();
        renderCart();
        updateBadge();
    }

    // -------------------------------------------------------------- cart button
    function buildCartButton() {
        var nav = document.getElementById("mainNav");
        if (!nav || document.getElementById("cartBtn")) return;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = "cartBtn";
        btn.className = "cart-btn";
        btn.setAttribute("aria-label", "Open cart");
        btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i><span class="cart-badge" id="cartBadge">0</span>';
        btn.addEventListener("click", function () {
            closeMenu();
            openDrawer();
        });
        nav.appendChild(btn);
    }

    function updateBadge() {
        var b = document.getElementById("cartBadge");
        if (!b) return;
        var n = cartCount();
        b.textContent = n;
        b.classList.toggle("show", n > 0);
        // little pop so the shopper notices the cart react
        b.classList.remove("pop");
        void b.offsetWidth;
        b.classList.add("pop");
    }

    // -------------------------------------------------------------- cart drawer
    function buildDrawer() {
        if (document.getElementById("cartDrawer")) return;

        var wrap = document.createElement("div");
        wrap.className = "cart-drawer";
        wrap.id = "cartDrawer";
        wrap.setAttribute("aria-hidden", "true");
        wrap.innerHTML =
            '<div class="cart-drawer__scrim" data-cart-close></div>' +
            '<aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Your cart">' +
            '  <header class="cart-drawer__head">' +
            '    <h3><i class="fa-solid fa-basket-shopping"></i> Your Cart</h3>' +
            '    <button type="button" class="cart-drawer__close" data-cart-close aria-label="Close cart">&times;</button>' +
            '  </header>' +
            '  <div class="cart-drawer__body" id="cartBody"></div>' +
            '  <footer class="cart-drawer__foot" id="cartFoot"></footer>' +
            '</aside>';
        document.body.appendChild(wrap);

        wrap.querySelectorAll("[data-cart-close]").forEach(function (el) {
            el.addEventListener("click", closeDrawer);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeDrawer();
        });
    }

    function openDrawer() {
        var d = document.getElementById("cartDrawer");
        if (!d) return;
        d.classList.add("open");
        d.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        var d = document.getElementById("cartDrawer");
        if (!d) return;
        d.classList.remove("open");
        d.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function renderCart() {
        var body = document.getElementById("cartBody");
        var foot = document.getElementById("cartFoot");
        if (!body || !foot) return;

        if (!cart.length) {
            body.innerHTML =
                '<div class="cart-empty">' +
                '<i class="fa-solid fa-basket-shopping"></i>' +
                '<p>Your cart is empty.</p>' +
                '<a href="product.html" class="btn">Browse Atta</a>' +
                '</div>';
            foot.innerHTML = "";
            return;
        }

        body.innerHTML = cart.map(function (l, i) {
            return '<div class="cart-line">' +
                '<img src="' + l.image + '" alt="' + l.name + '">' +
                '<div class="cl-info">' +
                '  <h4>' + l.name + '</h4>' +
                '  <span>' + l.sizeLabel + ' · ' + money(l.unitPrice) + ' each</span>' +
                '</div>' +
                '<div class="cl-qty">' +
                '  <button type="button" data-dec="' + i + '" aria-label="Decrease">&minus;</button>' +
                '  <input type="number" min="0" value="' + l.qty + '" data-qty="' + i + '">' +
                '  <button type="button" data-inc="' + i + '" aria-label="Increase">+</button>' +
                '</div>' +
                '<div class="cl-total">' + money(l.lineTotal) + '</div>' +
                '<button type="button" class="cl-remove" data-remove="' + i + '" aria-label="Remove">&times;</button>' +
                '</div>';
        }).join("");

        body.querySelectorAll("[data-inc]").forEach(function (b) {
            b.addEventListener("click", function () { setQty(+b.dataset.inc, cart[+b.dataset.inc].qty + 1); });
        });
        body.querySelectorAll("[data-dec]").forEach(function (b) {
            b.addEventListener("click", function () { setQty(+b.dataset.dec, cart[+b.dataset.dec].qty - 1); });
        });
        body.querySelectorAll("[data-qty]").forEach(function (inp) {
            inp.addEventListener("change", function () { setQty(+inp.dataset.qty, +inp.value); });
        });
        body.querySelectorAll("[data-remove]").forEach(function (b) {
            b.addEventListener("click", function () { removeLine(+b.dataset.remove); });
        });

        foot.innerHTML =
            '<div class="cart-total"><span>Total</span><strong>' + money(cartTotal()) + '</strong></div>' +
            '<a href="checkout.html?from=cart" class="btn cart-checkout" ' +
            'style="width:100%;justify-content:center;margin-top:12px;">' +
            '<i class="fa-solid fa-arrow-right"></i> Proceed to Checkout</a>' +
            '<p class="cart-note"><i class="fa-solid fa-lock"></i> Pay by Easypaisa, JazzCash or cash on pickup</p>';
    }

    // ------------------------------------------------------------ fly animation
    function flyToCart(fromEl, imageSrc) {
        var target = document.getElementById("cartBtn");
        if (!target || !fromEl || reduce) return;

        var from = fromEl.getBoundingClientRect();
        var to = target.getBoundingClientRect();

        var ghost = document.createElement("img");
        ghost.src = imageSrc;
        ghost.className = "fly-ghost";
        ghost.style.left = (from.left + from.width / 2 - 40) + "px";
        ghost.style.top = (from.top + from.height / 2 - 40) + "px";
        document.body.appendChild(ghost);

        var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        var dy = (to.top + to.height / 2) - (from.top + from.height / 2);

        // curved, cinematic arc: rise first, then drop into the cart
        var kf = [
            { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
            { transform: "translate(" + (dx * 0.35) + "px," + (dy * 0.35 - 90) + "px) scale(0.85) rotate(12deg)", opacity: 1, offset: 0.45 },
            { transform: "translate(" + dx + "px," + dy + "px) scale(0.18) rotate(24deg)", opacity: 0.15, offset: 1 },
        ];

        var anim = ghost.animate(kf, { duration: 850, easing: "cubic-bezier(0.5,0,0.2,1)" });
        anim.onfinish = function () {
            ghost.remove();
            target.classList.add("bump");
            setTimeout(function () { target.classList.remove("bump"); }, 500);
        };
    }

    // ------------------------------------------------------------------- toast
    function toast(msg, sub) {
        var t = document.getElementById("nacToast");
        if (!t) {
            t = document.createElement("div");
            t.id = "nacToast";
            t.className = "nac-toast";
            t.setAttribute("role", "status");
            document.body.appendChild(t);
        }
        t.innerHTML =
            '<i class="fa-solid fa-circle-check"></i>' +
            '<div><strong>' + msg + '</strong>' + (sub ? '<span>' + sub + '</span>' : "") + '</div>';
        t.classList.add("show");
        clearTimeout(t._timer);
        t._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
    }

    // -------------------------------------------------------------- customizer
    // Builds the "Choose Your Nazir Atta" section if the page has <div id="customizer">
    function buildCustomizer() {
        var host = document.getElementById("customizer");
        if (!host) return;

        var state = {
            productId: CFG.products[0].id,
            kg: (CFG.sizes && CFG.sizes[0].kg) || 1,
            qty: 1,
        };

        host.innerHTML =
            '<div class="cz">' +
            '  <div class="cz-visual">' +
            '    <img id="czImage" src="" alt="">' +
            '    <span class="cz-shape" id="czShape"></span>' +
            '  </div>' +
            '  <div class="cz-controls">' +
            '    <h3 class="cz-title">Choose Your Nazir Atta</h3>' +
            '    <p class="cz-sub">Pick the product, the pack size and how many you need.</p>' +

            '    <label class="cz-label">Product</label>' +
            '    <select id="czProduct" class="cz-select"></select>' +

            '    <label class="cz-label">Pack Size</label>' +
            '    <div class="cz-sizes" id="czSizes"></div>' +

            '    <label class="cz-label">Quantity</label>' +
            '    <div class="cz-qty">' +
            '      <button type="button" id="czMinus" aria-label="Less">&minus;</button>' +
            '      <input type="number" id="czQty" min="1" value="1">' +
            '      <button type="button" id="czPlus" aria-label="More">+</button>' +
            '    </div>' +

            '    <div class="cz-summary">' +
            '      <div><span>Weight</span><strong id="czWeight">1 KG</strong></div>' +
            '      <div><span>Unit price</span><strong id="czUnit">—</strong></div>' +
            '      <div><span>Quantity</span><strong id="czQtyOut">1</strong></div>' +
            '      <div class="cz-grand"><span>Total</span><strong id="czTotal">—</strong></div>' +
            '    </div>' +

            '    <button type="button" class="btn cz-add" id="czAdd" style="width:100%;justify-content:center;">' +
            '      <i class="fa-solid fa-cart-plus"></i> Add to Cart' +
            '    </button>' +
            '  </div>' +
            '</div>';

        var sel = document.getElementById("czProduct");
        sel.innerHTML = CFG.products.map(function (p, i) {
            return '<option value="' + p.id + '"' + (i === 0 ? " selected" : "") + '>' + p.name + "</option>";
        }).join("");

        function renderSizes() {
            var wrap = document.getElementById("czSizes");
            wrap.innerHTML = (CFG.sizes || []).map(function (s) {
                return '<button type="button" class="cz-size' + (s.kg === state.kg ? " active" : "") +
                    '" data-kg="' + s.kg + '">' + s.label + "</button>";
            }).join("");
            wrap.querySelectorAll(".cz-size").forEach(function (b) {
                b.addEventListener("click", function () {
                    state.kg = +b.dataset.kg;
                    renderSizes();
                    renderAll();
                });
            });
        }

        function renderAll() {
            var p = findProduct(state.productId);
            if (!p) return;
            var unit = priceFor(p, state.kg);
            var size = sizeFor(state.kg);

            document.getElementById("czImage").src = p.image;
            document.getElementById("czImage").alt = p.name;
            // the "package" grows with the chosen size — a subtle 3D cue
            var grow = 1 + (size.kg - 1) * 0.045;
            var sh = document.getElementById("czShape");
            sh.style.transform = "scale(" + grow.toFixed(3) + ")";
            sh.textContent = size.label;

            document.getElementById("czWeight").textContent = size.label;
            document.getElementById("czUnit").textContent = money(unit);
            document.getElementById("czQtyOut").textContent = state.qty;
            document.getElementById("czTotal").textContent = money(unit * state.qty);
            document.getElementById("czQty").value = state.qty;
        }

        sel.addEventListener("change", function () {
            state.productId = sel.value;
            renderAll();
        });
        document.getElementById("czMinus").addEventListener("click", function () {
            state.qty = Math.max(1, state.qty - 1);
            renderAll();
        });
        document.getElementById("czPlus").addEventListener("click", function () {
            state.qty = state.qty + 1;
            renderAll();
        });
        document.getElementById("czQty").addEventListener("change", function (e) {
            state.qty = Math.max(1, Math.floor(+e.target.value || 1));
            renderAll();
        });

        document.getElementById("czAdd").addEventListener("click", function () {
            var p = findProduct(state.productId);
            addToCart(state.productId, state.kg, state.qty);
            flyToCart(document.getElementById("czImage"), p.image);
            toast("Added to Cart", p.name + " · " + sizeFor(state.kg).label + " × " + state.qty);
        });

        renderSizes();
        renderAll();
    }

    // ------------------------------------------------- "Add to Cart" on cards
    // Any element with [data-add-to-cart="productId"] becomes a cart button.
    function wireAddButtons() {
        document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
            if (btn.dataset.wired) return;
            btn.dataset.wired = "1";
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                var id = btn.getAttribute("data-add-to-cart");
                var kg = +(btn.getAttribute("data-kg") || (CFG.sizes && CFG.sizes[0].kg) || 1);
                var p = findProduct(id);
                addToCart(id, kg, 1);
                var img = btn.closest(".product-card");
                flyToCart(img ? img.querySelector("img") : btn, p ? p.image : "");
                toast("Added to Cart", (p ? p.name : "Item") + " · " + sizeFor(kg).label);
            });
        });
    }

    // ------------------------------------------------------------------- boot
    function boot() {
        load();
        buildCartButton();
        buildDrawer();
        renderCart();
        updateBadge();
        buildCustomizer();
        wireAddButtons();
        // expose a tiny API so other scripts can use the cart
        window.NAC_Cart = {
            add: addToCart,
            items: function () { return cart.slice(); },
            total: cartTotal,
            count: cartCount,
            open: openDrawer,
            clear: function () { cart = []; save(); renderCart(); updateBadge(); },
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();