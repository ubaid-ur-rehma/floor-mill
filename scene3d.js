// ============================================================================
// Advanced 3D — page banner scenes (Three.js).
// Attaches a WebGL scene to any element with [data-3d-scene]:
//   data-3d-scene="banner"  -> floating grains over a page banner
//   data-3d-scene="showcase"-> reserved for the rotating product ring
//
// One shared Three.js loader, one render loop per visible canvas.
// Falls back to the CSS background if WebGL/CDN is unavailable.
// ============================================================================
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    var canvases = document.querySelectorAll('canvas[data-3d-scene]');
    if (!canvases.length || reduce) return;

    // ---- Shared loader (local copy first, then CDN) ----
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
    ], function () {
        if (window.THREE) { canvases.forEach(setupScene); }
    });

    function setupScene(canvas) {
        var THREE = window.THREE;
        var host = canvas.parentElement;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1000);
        camera.position.z = 16;

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        } catch (e) { return; } // no WebGL -> keep the CSS background
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // ---- Lighting ----
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        var key = new THREE.DirectionalLight(0xffe6b0, 1.15);
        key.position.set(5, 9, 7);
        scene.add(key);
        var rim = new THREE.PointLight(0xc79a3e, 0.95, 70);
        rim.position.set(-7, -4, 9);
        scene.add(rim);

        // ---- Materials ----
        var mats = [
            new THREE.MeshStandardMaterial({ color: 0xe0a627, roughness: 0.34, metalness: 0.4 }),
            new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.5, metalness: 0.22 }),
            new THREE.MeshStandardMaterial({ color: 0xf6e2c8, roughness: 0.6, metalness: 0.06 }),
            new THREE.MeshStandardMaterial({ color: 0x4c8f2f, roughness: 0.45, metalness: 0.25 }),
        ];

        function makeShape(i) {
            var kind = i % 4;
            var geo;
            if (kind === 0) { geo = new THREE.SphereGeometry(0.85, 18, 14); geo.scale(1, 2, 1); }
            else if (kind === 1) { geo = new THREE.CylinderGeometry(0.85, 1.1, 2.1, 18); }
            else if (kind === 2) { geo = new THREE.TorusGeometry(0.85, 0.35, 12, 22); }
            else { geo = new THREE.IcosahedronGeometry(1.05, 0); }
            return new THREE.Mesh(geo, mats[kind]);
        }

        var group = new THREE.Group();
        scene.add(group);

        var shapes = [];
        var count = isMobile ? 9 : 16;
        for (var i = 0; i < count; i++) {
            var m = makeShape(i);
            m.position.set(
                (Math.random() - 0.5) * 24,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12 - 2
            );
            m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            m.userData = {
                spin: (Math.random() - 0.5) * 0.012,
                float: 0.4 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
            };
            group.add(m);
            shapes.push(m);
        }

        // ---- Pointer parallax (mouse on desktop, tilt on touch) ----
        var mx = 0, my = 0, tx = 0, ty = 0;
        window.addEventListener('mousemove', function (e) {
            tx = (e.clientX / window.innerWidth - 0.5) * 2;
            ty = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // ---- Size to the host element (not the window) ----
        function resize() {
            var w = host.clientWidth || window.innerWidth;
            var h = host.clientHeight || 320;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        }
        resize();
        window.addEventListener('resize', resize);

        // ---- Pause when off-screen ----
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
            camera.position.x = mx * 2.2;
            camera.position.y = -my * 1.5;
            camera.lookAt(0, 0, 0);

            for (var i = 0; i < shapes.length; i++) {
                var m = shapes[i];
                m.rotation.x += m.userData.spin;
                m.rotation.y += m.userData.spin * 1.4;
                m.position.y += Math.sin(t * m.userData.float + m.userData.phase) * 0.013;
            }
            group.rotation.y = mx * 0.32 + t * 0.03;

            renderer.render(scene, camera);
        }
        animate();
    }
})();