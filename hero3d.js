// ============================================================================
// Advanced 3D — WebGL hero scene with Three.js.
// Floating wheat-grain shapes, soft lighting, mouse parallax and scroll depth.
// Loaded only on the home page. Falls back gracefully if WebGL/CDN unavailable.
// ============================================================================
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    var canvas = document.getElementById('hero3d');
    if (!canvas || reduce) return;

    // Load Three.js (local copy first, CDN as fallback), then initialise.
    function loadThree(srcs, done) {
        if (!srcs.length) { done(false); return; }
        var s = document.createElement('script');
        s.src = srcs[0];
        s.onload = function () { done(true); };
        s.onerror = function () { loadThree(srcs.slice(1), done); };
        document.head.appendChild(s);
    }
    loadThree([
        'three.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    ], function () { init(); });

    function init() {
        if (!window.THREE) return;
        var THREE = window.THREE;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.z = 18;

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        // ---- Lighting ----
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        var key = new THREE.DirectionalLight(0xffe6b0, 1.1);
        key.position.set(5, 8, 6);
        scene.add(key);
        var rim = new THREE.PointLight(0xc79a3e, 0.9, 60);
        rim.position.set(-6, -4, 8);
        scene.add(rim);

        // ---- Materials ----
        var matGold = new THREE.MeshStandardMaterial({ color: 0xe0a627, roughness: 0.35, metalness: 0.35 });
        var matBrown = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.5, metalness: 0.2 });
        var matCream = new THREE.MeshStandardMaterial({ color: 0xf6e2c8, roughness: 0.6, metalness: 0.05 });
        var mats = [matGold, matBrown, matCream];

        // ---- Build floating grain shapes ----
        var group = new THREE.Group();
        scene.add(group);

        function grainMesh(i) {
            var kind = i % 3;
            var geo;
            if (kind === 0) {
                // wheat grain (elongated sphere)
                geo = new THREE.SphereGeometry(0.9, 20, 16);
                geo.scale(1, 2.1, 1);
            } else if (kind === 1) {
                // flour sack (cylinder)
                geo = new THREE.CylinderGeometry(0.9, 1.15, 2.2, 20);
            } else {
                // millstone / disc
                geo = new THREE.TorusGeometry(0.9, 0.38, 12, 24);
            }
            return new THREE.Mesh(geo, mats[kind]);
        }

        var shapes = [];
        var count = isMobile ? 10 : 18;
        for (var i = 0; i < count; i++) {
            var m = grainMesh(i);
            m.position.set(
                (Math.random() - 0.5) * 26,
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 12 - 2
            );
            m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            m.userData = {
                spin: (Math.random() - 0.5) * 0.01,
                float: 0.4 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
            };
            group.add(m);
            shapes.push(m);
        }

        // ---- Mouse parallax ----
        var mx = 0, my = 0, tx = 0, ty = 0;
        window.addEventListener('mousemove', function (e) {
            tx = (e.clientX / window.innerWidth - 0.5) * 2;
            ty = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // ---- Scroll depth ----
        var scrollY = 0;
        window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

        // ---- Resize ----
        function resize() {
            var w = canvas.clientWidth, h = canvas.clientHeight;
            if (!w || !h) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        }
        window.addEventListener('resize', resize);

        // ---- Pause when off-screen (perf) ----
        var visible = true;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                visible = es[0].isIntersecting;
            }, { threshold: 0 }).observe(canvas);
        }

        // ---- Animate ----
        var clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            if (!visible) return;
            var t = clock.getElapsedTime();

            mx += (tx - mx) * 0.05;
            my += (ty - my) * 0.05;
            camera.position.x = mx * 2.4;
            camera.position.y = -my * 1.6;
            camera.lookAt(0, 0, 0);

            for (var i = 0; i < shapes.length; i++) {
                var m = shapes[i];
                m.rotation.x += m.userData.spin;
                m.rotation.y += m.userData.spin * 1.3;
                m.position.y += Math.sin(t * m.userData.float + m.userData.phase) * 0.012;
            }
            group.rotation.y = mx * 0.35 + t * 0.02;
            group.position.y = -scrollY * 0.008;

            renderer.render(scene, camera);
        }
        resize();
        animate();
    }
})();