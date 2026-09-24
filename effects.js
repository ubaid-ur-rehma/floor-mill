// ============================================================================
// Site-wide effects: scroll progress bar, back-to-top, 3D tilt, counters.
// Loaded on every page. Keeps animations light on mobile and respects
// the user's reduced-motion preference.
// ============================================================================
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia('(max-width: 768px)').matches;

    // ---- Scroll progress bar + back-to-top ----
    var bar = document.getElementById('scrollProgress');
    var top = document.getElementById('backTop');
    function onScroll() {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
        if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
        if (top) top.classList.toggle('show', h.scrollTop > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (top) top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ---- 3D tilt on cards (desktop only) ----
    function attachTilt() {
        if (isMobile || reduce) return;
        document.querySelectorAll('.product-card, .pay-method, .usp, .counter-band .cb').forEach(function (card) {
            if (card.dataset.tilt) return;
            card.dataset.tilt = '1';
            card.classList.add('tilt-3d');
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                card.style.setProperty('--ry', (px * 15).toFixed(2) + 'deg');
                card.style.setProperty('--rx', (-py * 15).toFixed(2) + 'deg');
            });
            card.addEventListener('mouseleave', function () {
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }
    attachTilt();

    // ---- Animated counters ----
    function animateCount(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1400, start = null;
        function step(ts) {
            if (!start) start = ts;
            var prog = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - prog, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    if (!reduce && 'IntersectionObserver' in window) {
        var co = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('[data-count]').forEach(function (el) { co.observe(el); });
    }

    // ---- Re-attach tilt when products load dynamically ----
    var grid = document.getElementById('productsGrid');
    if (grid && 'MutationObserver' in window) {
        new MutationObserver(function () { attachTilt(); }).observe(grid, { childList: true });
    }

    // ---- Magnetic buttons (cursor-follow in 3D) ----
    if (!isMobile && !reduce) {
        document.querySelectorAll('.btn, .mini-btn, .pay-logo').forEach(function (btn) {
            btn.classList.add('magnetic');
            btn.addEventListener('mousemove', function (e) {
                var r = btn.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                btn.style.setProperty('--mx', (dx * 12).toFixed(1) + 'px');
                btn.style.setProperty('--my', (dy * 12).toFixed(1) + 'px');
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.setProperty('--mx', '0px');
                btn.style.setProperty('--my', '0px');
            });
        });
    }

    // ---- Scroll parallax depth ----
    var parallaxEls = document.querySelectorAll('.showcase, .promo-banner, .split-img');
    if (!reduce && parallaxEls.length) {
        window.addEventListener('scroll', function () {
            var y = window.scrollY;
            parallaxEls.forEach(function (el) {
                var rect = el.getBoundingClientRect();
                var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.06;
                el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
            });
        }, { passive: true });
    }

    // ---- 3D rotating product showcase ----
    var ring = document.getElementById('showcaseRing');
    var stage = document.getElementById('showcaseStage');
    if (ring && stage && !reduce) {
        var items = [
            { name: 'Desi Gandum ke Atta', price: 180, image: 'atta2.jpeg' },
            { name: 'White Atta', price: 180, image: 'atta4.jpeg' },
            { name: 'Narala Chawal', price: 415, image: 'atta3.jpeg' },
            { name: 'Makai ka Atta', price: 210, image: 'img/makai-atta.svg' },
            { name: 'Jo ka Atta', price: 280, image: 'img/jo-atta.svg' },
            { name: 'Bajre ka Atta', price: 200, image: 'img/bajra-atta.svg' },
        ];
        var n = items.length;
        var radius = 300;
        ring.innerHTML = '';
        items.forEach(function (p, i) {
            var face = document.createElement('div');
            face.className = 'showcase-face';
            face.innerHTML =
                '<img src="' + p.image + '" alt="' + p.name + '">' +
                '<div class="sf-body"><h4>' + p.name + '</h4><span>Rs ' + p.price + ' / kg</span></div>';
            face.style.transform = 'rotateY(' + ((360 / n) * i) + 'deg) translateZ(' + radius + 'px)';
            ring.appendChild(face);
        });

        // Cursor tilt on the whole stage (desktop)
        if (!isMobile) {
            stage.addEventListener('mousemove', function (e) {
                var r = stage.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                stage.style.transform = 'rotateX(' + (-py * 14).toFixed(2) + 'deg) rotateY(' + (px * 14).toFixed(2) + 'deg)';
            });
            stage.addEventListener('mouseleave', function () {
                stage.style.transform = 'rotateX(0) rotateY(0)';
            });
        }
    }
})();