// ============================================================================
// CINEMATIC 3D FILM — scroll-driven story for Nazir Atta Chakki.
//
// A single continuous Three.js world containing:
//   • a golden wheat field (instanced stalks + GPU wind shader)
//   • a traditional chakki (procedural stone + wood, rotating, flour rising)
//   • a wheat -> flour particle system (GPU points + morph shader)
//   • a cinematic camera that travels between shots as the user scrolls
//
// Everything lives in one #film3d canvas — scenes never reload, so the
// transitions are seamless. Falls back gracefully without WebGL.
//
// Uses the local three.min.js (already in this project) so it works offline
// and on GitHub Pages.
// ============================================================================
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia('(max-width: 768px)').matches;

    var canvas = document.getElementById('film3d');
    var driver = document.getElementById('filmDriver');
    if (!canvas || !driver || reduce) return;

    // Load Three.js (local first, CDN fallback), then build the world.
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
    ], function (ok) {
        if (!ok || !window.THREE) {
            var filmSection = document.getElementById('film');
            if (filmSection) filmSection.classList.add('no-webgl');
            return;
        }
        try { boot(); } catch (e) {
            var filmSection2 = document.getElementById('film');
            if (filmSection2) filmSection2.classList.add('no-webgl');
        }
    });

    // ------------------------------------------------------------------ boot
    function boot() {
        var THREE = window.THREE;

        var scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xf2e0c2, 0.026);

        var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
        camera.position.set(0, 0.7, 14);

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
        renderer.setClearColor(0xf2e0c2, 1);
        if (renderer.shadowMap) renderer.shadowMap.enabled = !isMobile;
        if (renderer.outputEncoding !== undefined) renderer.outputEncoding = 2; // sRGB

        // ---------------------------------------------------------- lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));

        var sun = new THREE.DirectionalLight(0xffd9a0, 2.1);
        sun.position.set(10, 14, 8);
        if (!isMobile) {
            sun.castShadow = true;
            sun.shadow.mapSize.width = 1024;
            sun.shadow.mapSize.height = 1024;
            sun.shadow.camera.near = 1;
            sun.shadow.camera.far = 60;
            sun.shadow.camera.left = -22;
            sun.shadow.camera.right = 22;
            sun.shadow.camera.top = 22;
            sun.shadow.camera.bottom = -22;
        }
        scene.add(sun);

        var rim = new THREE.PointLight(0xc79a3e, 0.9, 80);
        rim.position.set(-8, 5, -6);
        scene.add(rim);

        // ------------------------------------------------------------ ground
        var ground = new THREE.Mesh(
            new THREE.CircleGeometry(46, 64),
            new THREE.MeshStandardMaterial({ color: 0x8a6a34, roughness: 1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = !isMobile;
        scene.add(ground);

        // ================================================== 1. WHEAT FIELD
        // Instanced blades with a vertex-shader wind.
        var WHEAT_COUNT = isMobile ? 2400 : 7000;
        var FIELD = 66;

        var wheatVert = [
            'uniform float uTime;',
            'uniform float uWind;',
            'attribute float aRand;',
            'varying float vH;',
            'varying float vR;',
            'void main(){',
            '  vR = aRand;',
            '  vec3 p = position;',
            '  float hf = clamp(p.y, 0.0, 1.0);',
            '  vH = hf;',
            '  float gust = sin(uTime*0.6 + aRand*6.283)*0.5 + 0.5;',
            '  float flut = sin(uTime*2.4 + aRand*12.0)*0.12;',
            '  float bend = (gust*uWind + flut) * pow(hf, 1.6);',
            '  p.x += bend*0.38;',
            '  p.z += bend*0.16*sin(aRand*20.0);',
            '  p.y -= bend*0.05;',
            '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);',
            '}',
        ].join('\n');

        var wheatFrag = [
            'uniform vec3 uRoot;',
            'uniform vec3 uTip;',
            'varying float vH;',
            'varying float vR;',
            'void main(){',
            '  vec3 c = mix(uRoot, uTip, smoothstep(0.0,1.0,vH));',
            '  c = mix(c, vec3(0.88,0.65,0.15), vR*0.45);',
            '  gl_FragColor = vec4(c,1.0);',
            '}',
        ].join('\n');

        var wheatMat = new THREE.ShaderMaterial({
            vertexShader: wheatVert,
            fragmentShader: wheatFrag,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uWind: { value: 1.15 },
                uRoot: { value: new THREE.Color(0x8a9a3c) },
                uTip: { value: new THREE.Color(0xe8c25a) },
            },
        });

        var bladeGeo = new THREE.PlaneGeometry(0.085, 1.55, 1, 6);
        bladeGeo.translate(0, 0.775, 0);
        var rands = new Float32Array(WHEAT_COUNT);
        for (var i = 0; i < WHEAT_COUNT; i++) rands[i] = Math.random();
        bladeGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rands, 1));

        var wheat = new THREE.InstancedMesh(bladeGeo, wheatMat, WHEAT_COUNT);
        var dummy = new THREE.Object3D();
        for (var w = 0; w < WHEAT_COUNT; w++) {
            dummy.position.set((Math.random() - 0.5) * FIELD, 0, (Math.random() - 0.5) * FIELD);
            dummy.rotation.set((Math.random() - 0.5) * 0.18, Math.random() * Math.PI, 0);
            dummy.scale.setScalar(0.7 + Math.random() * 0.95);
            dummy.updateMatrix();
            wheat.setMatrixAt(w, dummy.matrix);
        }
        wheat.instanceMatrix.needsUpdate = true;
        wheat.frustumCulled = false;
        scene.add(wheat);

        // ====================================================== 2. CHAKKI
        var chakki = new THREE.Group();
        chakki.position.set(0, 0, -4);
        scene.add(chakki);

        var stoneMat = new THREE.MeshStandardMaterial({ color: 0x8b8378, roughness: 0.95, metalness: 0.02, flatShading: true });
        var woodMat = new THREE.MeshStandardMaterial({ color: 0x7a4a22, roughness: 0.72, metalness: 0.05 });

        function pittedStone(r1, r2, h) {
            var g = new THREE.CylinderGeometry(r1, r2, h, 40, 3);
            var pos = g.attributes.position;
            for (var k = 0; k < pos.count; k++) {
                var x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
                var n = (Math.sin(x * 7.1) + Math.cos(z * 6.3) + Math.sin(y * 9.0)) * 0.012;
                pos.setY(k, y + n);
            }
            g.computeVertexNormals();
            return g;
        }

        // base frame
        var base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.34, 5.2), woodMat);
        base.position.y = -1.55; base.castShadow = !isMobile; chakki.add(base);

        [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]].forEach(function (p) {
            var leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.25, 0.4), woodMat);
            leg.position.set(p[0], -2.17, p[1]); chakki.add(leg);
        });

        // bottom stone (fixed)
        var bottomStone = new THREE.Mesh(pittedStone(2.1, 2.25, 0.62), stoneMat);
        bottomStone.position.y = -1.0; bottomStone.receiveShadow = !isMobile; chakki.add(bottomStone);

        // top stone (rotating)
        var topStone = new THREE.Mesh(pittedStone(2.1, 2.25, 0.62), stoneMat);
        topStone.position.y = -0.3; topStone.castShadow = !isMobile; chakki.add(topStone);

        // grinding furrows on top
        var furrows = new THREE.Group();
        for (var f = 0; f < 8; f++) {
            var a = (f / 8) * Math.PI * 2;
            var fu = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.14), woodMat);
            fu.position.set(Math.cos(a) * 1.2, 0.02, Math.sin(a) * 1.2);
            fu.rotation.y = a;
            furrows.add(fu);
        }
        furrows.position.y = -0.3;
        chakki.add(furrows);

        // spindle + handle
        var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 16), woodMat);
        spindle.position.y = 0.65; spindle.castShadow = !isMobile; chakki.add(spindle);

        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.2, 14), woodMat);
        handle.position.y = 1.55; handle.rotation.z = Math.PI / 2; chakki.add(handle);
        [-1.5, 1.5].forEach(function (hx) {
            var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 14), woodMat);
            grip.position.set(hx, 1.55, 0); chakki.add(grip);
        });

        // grain hopper
        var hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.45, 0.9, 24, 1, true), woodMat);
        hopper.position.y = 2.15; chakki.add(hopper);
        var grain = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.35, 20),
            new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.7 }));
        grain.position.y = 2.05; chakki.add(grain);

        // spout + flour puff
        var spout = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.8), woodMat);
        spout.position.set(1.9, -0.75, 0); spout.rotation.z = -0.5; chakki.add(spout);

        var puffMat = new THREE.MeshStandardMaterial({ color: 0xfff6e2, transparent: true, opacity: 0.3, roughness: 1, depthWrite: false });
        var puff = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), puffMat);
        puff.position.set(2.4, -1.35, 0); chakki.add(puff);

        // ============================================ 3. WHEAT -> FLOUR
        var PCOUNT = isMobile ? 3200 : 9000;
        var pGeo = new THREE.BufferGeometry();
        var pPos = new Float32Array(PCOUNT * 3);
        var pTgt = new Float32Array(PCOUNT * 3);
        var pSct = new Float32Array(PCOUNT * 3);
        var pRand = new Float32Array(PCOUNT);
        var SPREAD = 16, TARGET_R = 5;

        for (var p = 0; p < PCOUNT; p++) {
            var i3 = p * 3;
            pPos[i3] = (Math.random() - 0.5) * SPREAD;
            pPos[i3 + 1] = (Math.random() - 0.5) * SPREAD * 0.6;
            pPos[i3 + 2] = (Math.random() - 0.5) * SPREAD;

            var th = Math.random() * Math.PI * 2;
            var ph = Math.acos(2 * Math.random() - 1);
            var rr = TARGET_R * (0.72 + Math.random() * 0.38);
            pTgt[i3] = rr * Math.sin(ph) * Math.cos(th);
            pTgt[i3 + 1] = rr * Math.sin(ph) * Math.sin(th);
            pTgt[i3 + 2] = rr * Math.cos(ph);

            pSct[i3] = (Math.random() - 0.5) * 2;
            pSct[i3 + 1] = (Math.random() - 0.5) * 2;
            pSct[i3 + 2] = (Math.random() - 0.5) * 2;

            pRand[p] = Math.random();
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('aTarget', new THREE.BufferAttribute(pTgt, 3));
        pGeo.setAttribute('aScatter', new THREE.BufferAttribute(pSct, 3));
        pGeo.setAttribute('aRand', new THREE.BufferAttribute(pRand, 1));

        var partVert = [
            'uniform float uTime;',
            'uniform float uProgress;',
            'uniform float uPR;',
            'attribute float aRand;',
            'attribute vec3 aTarget;',
            'attribute vec3 aScatter;',
            'varying float vP;',
            'varying float vR;',
            'varying float vA;',
            'void main(){',
            '  vR = aRand; vP = uProgress;',
            '  vec3 p = position;',
            '  p.x += sin(uTime*0.7 + aRand*24.0)*0.06;',
            '  p.y += cos(uTime*0.9 + aRand*18.0)*0.06;',
            '  p.z += sin(uTime*0.5 + aRand*30.0)*0.06;',
            '  float burst = smoothstep(0.0,0.55,uProgress);',
            '  vec3 sc = p + aScatter*burst*1.4;',
            '  vec3 mo = mix(sc, aTarget, smoothstep(0.35,1.0,uProgress));',
            '  p = mix(p, mo, smoothstep(0.0,1.0,uProgress));',
            '  float sw = uProgress*0.35;',
            '  p.x += sin(uTime*1.6 + aRand*40.0)*sw;',
            '  p.y += cos(uTime*1.9 + aRand*22.0)*sw*0.6;',
            '  p.z += sin(uTime*1.3 + aRand*55.0)*sw;',
            '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
            '  gl_Position = projectionMatrix * mv;',
            '  float bs = mix(7.0, 2.4, uProgress);',
            '  gl_PointSize = bs * uPR * (1.0 / -mv.z);',
            '  vA = clamp(1.0 - (-mv.z - 4.0)/34.0, 0.0, 1.0);',
            '}',
        ].join('\n');

        var partFrag = [
            'uniform vec3 uWheat;',
            'uniform vec3 uFlour;',
            'varying float vP;',
            'varying float vR;',
            'varying float vA;',
            'void main(){',
            '  vec2 c = gl_PointCoord - vec2(0.5);',
            '  float d = length(c);',
            '  if (d > 0.5) discard;',
            '  float soft = smoothstep(0.5, 0.12, d);',
            '  vec3 col = mix(uWheat, uFlour, vP);',
            '  col = mix(col, col*0.85, vR*0.5);',
            '  gl_FragColor = vec4(col, soft*vA);',
            '}',
        ].join('\n');

        var partMat = new THREE.ShaderMaterial({
            vertexShader: partVert,
            fragmentShader: partFrag,
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uPR: { value: Math.min(window.devicePixelRatio, 2) },
                uWheat: { value: new THREE.Color(0xe0a627) },
                uFlour: { value: new THREE.Color(0xfff6e2) },
            },
        });

        var particles = new THREE.Points(pGeo, partMat);
        particles.position.set(0, 0.6, -2);
        particles.frustumCulled = false;
        scene.add(particles);

        // ------------------------------------------------- atmosphere (dust)
        var DCOUNT = isMobile ? 160 : 480;
        var dGeo = new THREE.BufferGeometry();
        var dPos = new Float32Array(DCOUNT * 3);
        for (var d2 = 0; d2 < DCOUNT; d2++) {
            dPos[d2 * 3] = (Math.random() - 0.5) * 30;
            dPos[d2 * 3 + 1] = Math.random() * 10;
            dPos[d2 * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
        var dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
            size: 0.055, color: 0xf6e0b8, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true,
        }));
        scene.add(dust);

        // =================================================== CAMERA PATH
        // One keyframe per story beat. The camera glides between them.
        var SHOTS = [
            { pos: [0, 0.7, 14], look: [0, 1.4, 0], fov: 55 },
            { pos: [1.5, 1.7, 7], look: [0, 1.8, -2], fov: 48 },
            { pos: [0.7, 1.6, 3.4], look: [0, 1.5, 0], fov: 42 },
            { pos: [5.6, 1.7, 6.4], look: [0, 0.1, -4], fov: 45 },
            { pos: [-4.4, 2.3, 4.6], look: [0, -0.3, -4], fov: 45 },
            { pos: [0, 2.3, 7.5], look: [0, 0.6, -2], fov: 50 },
            { pos: [0, 1.3, 6.0], look: [0, 0.4, -2], fov: 40 },
        ];

        var camPos = new THREE.Vector3(0, 0.7, 14);
        var camLook = new THREE.Vector3(0, 1.4, 0);
        var progress = 0;
        var milling = 0;

        // Read scroll progress across the film driver.
        function computeProgress() {
            var r = driver.getBoundingClientRect();
            var total = driver.offsetHeight - window.innerHeight;
            if (total <= 0) return 0;
            var p = (-r.top) / total;
            return Math.max(0, Math.min(1, p));
        }

        var mouseX = 0, mouseY = 0;
        window.addEventListener('mousemove', function (e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        function resize() {
            var w = window.innerWidth;
            var h = canvas.clientHeight || window.innerHeight;
            if (!w || !h) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        }
        window.addEventListener('resize', resize);

        // Pause when the film is off-screen (big perf win).
        var visible = true;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 })
                .observe(driver);
        }

        var clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            if (!visible) return;

            var t = clock.getElapsedTime();
            var dt = Math.min(clock.getDelta ? 0.05 : 0.016, 0.05);
            progress = computeProgress();

            // ---- camera interpolation (film-like gliding) ----
            var maxShot = SHOTS.length - 1;
            var raw = progress * maxShot;
            var i0 = Math.floor(raw);
            var i1 = Math.min(i0 + 1, maxShot);
            var local = raw - i0;
            var ease = local < 0.5
                ? 4 * local * local * local
                : 1 - Math.pow(-2 * local + 2, 3) / 2;

            var a = SHOTS[i0], b = SHOTS[i1];
            var dp = new THREE.Vector3(
                a.pos[0] + (b.pos[0] - a.pos[0]) * ease,
                a.pos[1] + (b.pos[1] - a.pos[1]) * ease,
                a.pos[2] + (b.pos[2] - a.pos[2]) * ease
            );
            var dl = new THREE.Vector3(
                a.look[0] + (b.look[0] - a.look[0]) * ease,
                a.look[1] + (b.look[1] - a.look[1]) * ease,
                a.look[2] + (b.look[2] - a.look[2]) * ease
            );

            camPos.lerp(dp, 1 - Math.pow(0.0015, 1 / 60));
            camLook.lerp(dl, 1 - Math.pow(0.0015, 1 / 60));

            // subtle handheld shake, stronger while milling
            milling = Math.max(0, Math.min(1, (progress - 0.42) / 0.28));
            var shake = 0.012 + milling * 0.03;
            camera.position.set(
                camPos.x + Math.sin(t * 1.7) * shake + mouseX * 0.35,
                camPos.y + Math.cos(t * 2.3) * shake * 0.7 - mouseY * 0.2,
                camPos.z + Math.sin(t * 1.1) * shake * 0.5
            );
            camera.lookAt(camLook.x, camLook.y, camLook.z);

            var nf = a.fov + (b.fov - a.fov) * ease;
            camera.fov += (nf - camera.fov) * 0.08;
            camera.updateProjectionMatrix();

            // ---- animate the world ----
            wheatMat.uniforms.uTime.value = t;
            partMat.uniforms.uTime.value = t;
            partMat.uniforms.uProgress.value = milling;

            topStone.rotation.y += 0.9 * dt;
            furrows.rotation.y += 0.9 * dt;
            spindle.rotation.y += 0.9 * dt;
            handle.rotation.y += 0.9 * dt;

            puff.scale.setScalar(1 + Math.sin(t * 2.2) * 0.07);
            puffMat.opacity = 0.18 + milling * 0.3;

            particles.rotation.y = t * 0.04;
            dust.rotation.y = t * 0.012;
            dust.position.y = Math.sin(t * 0.2) * 0.4;

            // Warm sunrise light cools as the story moves indoors.
            var warm = 1 - Math.min(progress * 1.4, 1);
            sun.intensity = 1.6 + warm * 1.4;
            sun.color.setHSL(0.09, 0.75 * warm + 0.15, 0.62);

            renderer.render(scene, camera);
        }

        resize();
        animate();
    }
})();