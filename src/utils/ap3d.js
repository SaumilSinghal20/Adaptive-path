/**
 * AdaptivePath — shared Three.js 3D scene utilities
 * All scenes use the same design token colors.
 */

import * as THREE from 'three'
const AP3D = {
  INDIGO: 0x7c6fff,
  INDIGO_DIM: 0x3d3880,
  CYAN: 0x00d4aa,
  CYAN_DIM: 0x006d57,
  GOLD: 0xf5a623,
  GOLD_DIM: 0x7a5311,
  ROSE: 0xff6b8a,
  BG: 0x060810,
  SURFACE: 0x101520,

  /* ── helpers ── */
  clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),

  /* ─────────────────────────────────────────────────
   * HERO SCENE — morphing icosahedron + orbiting rings + particles
   * container: HTMLElement
   * ───────────────────────────────────────────────── */
  initHero(container) {
    if (!container) return;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ambient + directional lights */
    scene.add(new THREE.AmbientLight(0x2a2060, 0.8));
    const dl1 = new THREE.DirectionalLight(AP3D.INDIGO, 2.4);
    dl1.position.set(5, 8, 6); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(AP3D.CYAN, 1.6);
    dl2.position.set(-6, -4, 4); scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(AP3D.GOLD, 1.0);
    dl3.position.set(0, -6, -4); scene.add(dl3);

    /* central morphing icosahedron */
    const icoGeo = new THREE.IcosahedronGeometry(2.6, 4);
    const origPos = icoGeo.attributes.position.array.slice();
    const icoMat = new THREE.MeshStandardMaterial({
      color: AP3D.INDIGO,
      emissive: AP3D.INDIGO_DIM,
      emissiveIntensity: 0.4,
      roughness: 0.18,
      metalness: 0.7,
      wireframe: false,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    /* wireframe overlay on ico */
    const wireMat = new THREE.MeshBasicMaterial({ color: AP3D.INDIGO, wireframe: true, transparent: true, opacity: 0.12 });
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.62, 4), wireMat);
    scene.add(wire);

    /* orbiting torus rings */
    const ringData = [
      { r: 4.2, tube: 0.04, color: AP3D.CYAN,  emissive: AP3D.CYAN_DIM, rx: 1.2, ry: 0.3, speed: 0.004 },
      { r: 5.6, tube: 0.03, color: AP3D.GOLD,  emissive: AP3D.GOLD_DIM, rx: 0.4, ry: 1.0, speed: -0.003 },
      { r: 3.4, tube: 0.035,color: AP3D.ROSE,  emissive: 0x7a1a2d,      rx: 0.8, ry: 0.6, speed: 0.005 },
    ];
    const rings = ringData.map(d => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, d.tube, 16, 120),
        new THREE.MeshStandardMaterial({ color: d.color, emissive: d.emissive, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5 })
      );
      m.rotation.x = d.rx; m.rotation.y = d.ry;
      m.userData.speed = d.speed;
      scene.add(m); return m;
    });

    /* floating particles */
    const pCount = 220;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const palette = [
      new THREE.Color(AP3D.INDIGO),
      new THREE.Color(AP3D.CYAN),
      new THREE.Color(AP3D.GOLD),
    ];
    for (let i = 0; i < pCount; i++) {
      const r = 6 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i*3+2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.75 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    /* mouse parallax */
    let mx = 0, my = 0;
    const onMove = e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = -(e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('mousemove', onMove);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      /* morph ico vertices */
      const pos = icoGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ox = origPos[i*3], oy = origPos[i*3+1], oz = origPos[i*3+2];
        const d = Math.sin(t * 0.9 + ox * 0.5 + oy * 0.6) * 0.22;
        pos.setXYZ(i, ox + ox*d*0.1, oy + oy*d*0.1, oz + oz*d*0.1);
      }
      pos.needsUpdate = true;
      icoGeo.computeVertexNormals();

      ico.rotation.x = t * 0.12 + my * 0.15;
      ico.rotation.y = t * 0.18 + mx * 0.15;
      wire.rotation.copy(ico.rotation);

      rings.forEach(r => { r.rotation.z += r.userData.speed; });

      points.rotation.y = t * 0.04 + mx * 0.05;
      points.rotation.x = my * 0.05;

      camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (my * 0.8 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return () => window.removeEventListener('mousemove', onMove);
  },

  /* ─────────────────────────────────────────────────
   * AUTH SCENE — floating torii + particles (compact)
   * ───────────────────────────────────────────────── */
  initAuthScene(container, colorA = AP3D.INDIGO, colorB = AP3D.CYAN) {
    if (!container) return;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x1a1440, 1));
    const dl = new THREE.DirectionalLight(colorA, 2.8);
    dl.position.set(4, 5, 5); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(colorB, 1.8);
    dl2.position.set(-4, -3, 3); scene.add(dl2);

    /* central octahedron */
    const oct = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.8, 2),
      new THREE.MeshStandardMaterial({ color: colorA, emissive: colorA, emissiveIntensity: 0.25, roughness: 0.2, metalness: 0.8 })
    );
    scene.add(oct);

    /* wireframe */
    scene.add(new THREE.Mesh(
      new THREE.OctahedronGeometry(1.82, 2),
      new THREE.MeshBasicMaterial({ color: colorA, wireframe: true, transparent: true, opacity: 0.14 })
    ));

    /* torus rings */
    [
      { r: 2.8, color: colorA, speed: 0.006, rx: 0.6 },
      { r: 3.8, color: colorB, speed: -0.004, rx: 1.4 },
    ].forEach(d => {
      const t = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, 0.035, 16, 80),
        new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 })
      );
      t.rotation.x = d.rx; t.userData.speed = d.speed;
      scene.add(t);
    });

    /* particles */
    const n = 120, pp = new Float32Array(n * 3), pc = new Float32Array(n * 3);
    const ca = new THREE.Color(colorA), cb = new THREE.Color(colorB);
    for (let i = 0; i < n; i++) {
      const r = 4 + Math.random() * 3, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pp[i*3] = r*Math.sin(ph)*Math.cos(th); pp[i*3+1] = r*Math.sin(ph)*Math.sin(th); pp[i*3+2] = r*Math.cos(ph);
      const c = Math.random() > 0.5 ? ca : cb;
      pc[i*3] = c.r; pc[i*3+1] = c.g; pc[i*3+2] = c.b;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.7 })));

    /* drag rotate */
    let dragging = false, lx = 0, ly = 0, ry = 0, rx = 0;
    container.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', () => dragging = false);
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      ry += (e.clientX - lx) * 0.006; rx += (e.clientY - ly) * 0.004;
      rx = AP3D.clamp(rx, -0.8, 0.8); lx = e.clientX; ly = e.clientY;
    });

    const group = new THREE.Group();
    scene.children.slice(2).forEach(c => group.add(c)); /* skip ambient+dl */
    // Re-add properly
    scene.clear();
    scene.add(new THREE.AmbientLight(0x1a1440, 1));
    scene.add(dl); scene.add(dl2);
    const grp = new THREE.Group(); scene.add(grp);
    [oct, ...scene.children].forEach(() => {});

    /* simpler re-init */
    const clock = new THREE.Clock();
    const meshes = [];

    const oct2 = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.8, 2),
      new THREE.MeshStandardMaterial({ color: colorA, emissive: colorA, emissiveIntensity: 0.3, roughness: 0.15, metalness: 0.9 })
    );
    grp.add(oct2); meshes.push(oct2);

    grp.add(new THREE.Mesh(
      new THREE.OctahedronGeometry(1.84, 2),
      new THREE.MeshBasicMaterial({ color: colorA, wireframe: true, transparent: true, opacity: 0.12 })
    ));

    const torii = [];
    [ { r:2.8,c:colorA,speed:0.007,rx:0.6 }, { r:3.8,c:colorB,speed:-0.005,rx:1.5 } ].forEach(d => {
      const tr = new THREE.Mesh(
        new THREE.TorusGeometry(d.r,0.038,16,80),
        new THREE.MeshStandardMaterial({ color:d.c, emissive:d.c, emissiveIntensity:0.5, roughness:0.3, metalness:0.4 })
      );
      tr.rotation.x = d.rx; tr.userData.speed = d.speed;
      grp.add(tr); torii.push(tr);
    });

    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size:0.065, vertexColors:true, transparent:true, opacity:0.65 }));
    grp.add(pts);

    const anim = () => {
      requestAnimationFrame(anim);
      const t = clock.getElapsedTime();
      if (!dragging) { ry += 0.004; }
      grp.rotation.y = ry; grp.rotation.x = rx;
      oct2.rotation.x = t * 0.2; oct2.rotation.z = t * 0.15;
      torii.forEach(tr => tr.rotation.z += tr.userData.speed);
      renderer.render(scene, camera);
    };
    anim();

    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  },

  /* ─────────────────────────────────────────────────
   * HOW-IT-WORKS SCENE — neural knowledge graph (compact)
   * ───────────────────────────────────────────────── */
  initKnowledgeGraph(container) {
    if (!container) return;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060810, 0.055);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x2a2060, 0.9));
    const pl = new THREE.PointLight(AP3D.INDIGO, 1.6, 30); pl.position.set(4,5,6); scene.add(pl);
    const pl2 = new THREE.PointLight(AP3D.GOLD, 0.8, 30); pl2.position.set(-5,-3,4); scene.add(pl2);

    const group = new THREE.Group(); scene.add(group);

    const topics = [
      { id:'root',  pos:[0,3.2,0],    state:'mastered', parent:null },
      { id:'arr',   pos:[-2.4,1.6,.4],state:'mastered', parent:'root' },
      { id:'tp',    pos:[-3.6,-.2,-.6],state:'mastered',parent:'arr' },
      { id:'sw',    pos:[-2,-2,.8],   state:'current',  parent:'tp' },
      { id:'ll',    pos:[1.6,1.2,-1], state:'locked',   parent:'root' },
      { id:'tr',    pos:[3.4,-.4,.2], state:'locked',   parent:'ll' },
      { id:'gr',    pos:[3.2,-2.6,-.8],state:'locked',  parent:'tr' },
      { id:'dp',    pos:[.4,-3.4,1.2],state:'locked',   parent:'sw' },
    ];

    const colors = { mastered: AP3D.GOLD, current: AP3D.CYAN, locked: 0x2a2e40 };
    const meshMap = {};

    topics.forEach(t => {
      const size = t.state === 'locked' ? 0.2 : 0.3;
      const mat = new THREE.MeshStandardMaterial({
        color: colors[t.state], emissive: colors[t.state],
        emissiveIntensity: t.state === 'locked' ? 0.1 : 0.5,
        roughness: 0.3, metalness: 0.4,
        transparent: true, opacity: t.state === 'locked' ? 0.5 : 1,
      });
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), mat);
      m.position.set(...t.pos); m.userData = t;
      group.add(m); meshMap[t.id] = m;
    });

    topics.forEach(t => {
      if (!t.parent) return;
      const a = meshMap[t.parent].position, b = meshMap[t.id].position;
      const active = t.state !== 'locked' && meshMap[t.parent].userData.state !== 'locked';
      const lmat = new THREE.LineBasicMaterial({
        color: active ? AP3D.INDIGO : 0x1e2235, transparent: true, opacity: active ? 0.9 : 0.3,
      });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lmat));
    });

    let dragging = false, lx = 0, ly = 0, rotY = 0.4, rotX = -0.1;
    container.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', () => dragging = false);
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      rotY += (e.clientX - lx) * 0.005; rotX += (e.clientY - ly) * 0.003;
      rotX = AP3D.clamp(rotX, -0.7, 0.7); lx = e.clientX; ly = e.clientY;
    });

    const clock = new THREE.Clock();
    const anim = () => {
      requestAnimationFrame(anim);
      const t = clock.getElapsedTime();
      if (!dragging) rotY += 0.0018;
      group.rotation.y = rotY; group.rotation.x = rotX;
      const cur = meshMap['sw'];
      cur.material.emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.3;
      cur.scale.setScalar(1 + Math.sin(t * 2.5) * 0.07);
      renderer.render(scene, camera);
    };
    anim();

    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  },

  /* ─────────────────────────────────────────────────
   * DASHBOARD SCENE — full knowledge graph
   * topicStates: { topicId: 'mastered'|'unlocked'|'locked' } (optional)
   * recommendedTopicId: string — topic to pulse as 'current'
   * ───────────────────────────────────────────────── */
  initDashboardGraph(container, topicStates = null, recommendedTopicId = null) {
    if (!container) return;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060810, 0.055);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.6, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x445566, 1.1));
    const pt = new THREE.PointLight(0x4fe3c1, 1.4, 30); pt.position.set(4, 5, 6); scene.add(pt);
    const pt2 = new THREE.PointLight(0xf2b84b, 0.7, 30); pt2.position.set(-5, -3, 4); scene.add(pt2);

    const group = new THREE.Group(); scene.add(group);

    const TOPIC_DEFS = [
      { id: 'foundations',   pos: [0, 3.2, 0],       parent: null },
      { id: 'arrays',        pos: [-2.4, 1.6, 0.4],  parent: 'foundations' },
      { id: 'twopointers',   pos: [-3.6, -0.2, -0.6], parent: 'arrays' },
      { id: 'slidingwindow', pos: [-2.0, -2.0, 0.8], parent: 'twopointers' },
      { id: 'linkedlists',   pos: [1.6, 1.2, -1.0],  parent: 'foundations' },
      { id: 'trees',         pos: [3.4, -0.4, 0.2],  parent: 'linkedlists' },
      { id: 'graphs',        pos: [3.2, -2.6, -0.8], parent: 'trees' },
      { id: 'dp',            pos: [0.4, -3.4, 1.2],  parent: 'slidingwindow' },
    ];

    const defaultStates = {
      foundations: 'mastered', arrays: 'mastered', twopointers: 'mastered',
      slidingwindow: 'current', linkedlists: 'locked', trees: 'locked', graphs: 'locked', dp: 'locked',
    };

    const getState = (id) => {
      if (topicStates) {
        const s = topicStates[id] || 'locked';
        if (recommendedTopicId && id === recommendedTopicId && s === 'unlocked') return 'current';
        return s;
      }
      return defaultStates[id] || 'locked';
    };

    const colors = { mastered: 0xf2b84b, current: 0x4fe3c1, unlocked: 0x7c6fff, locked: 0x565a66 };
    const nodeMeshes = {};

    TOPIC_DEFS.forEach(t => {
      const state = getState(t.id);
      const isLocked = state === 'locked';
      const size = isLocked ? 0.22 : 0.32;
      const color = colors[state] || colors.locked;
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color,
        emissiveIntensity: isLocked ? 0.15 : 0.55,
        roughness: 0.4, metalness: 0.1,
        transparent: true, opacity: isLocked ? 0.55 : 1,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), mat);
      mesh.position.set(...t.pos);
      mesh.userData = { ...t, state };
      group.add(mesh);
      nodeMeshes[t.id] = mesh;
    });

    TOPIC_DEFS.forEach(t => {
      if (!t.parent) return;
      const a = nodeMeshes[t.parent].position;
      const b = nodeMeshes[t.id].position;
      const stA = nodeMeshes[t.parent].userData.state;
      const stB = nodeMeshes[t.id].userData.state;
      const active = stA !== 'locked' && stB !== 'locked';
      const lmat = new THREE.LineBasicMaterial({
        color: active ? 0x4fe3c1 : 0x33363f, transparent: true, opacity: active ? 0.85 : 0.35,
      });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lmat));
    });

    let dragging = false, lastX = 0, lastY = 0, rotY = 0.4, rotX = -0.1;
    container.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointerup', () => dragging = false);
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.005; rotX += (e.clientY - lastY) * 0.003;
      rotX = AP3D.clamp(rotX, -0.6, 0.6);
      lastX = e.clientX; lastY = e.clientY;
    });

    const clock2 = new THREE.Clock();
    const pulseId = recommendedTopicId || 'slidingwindow';
    const animateDash = () => {
      requestAnimationFrame(animateDash);
      const t = clock2.getElapsedTime();
      if (!dragging) rotY += 0.0015;
      group.rotation.y = rotY; group.rotation.x = rotX;

      const cur = nodeMeshes[pulseId];
      if (cur && (cur.userData.state === 'current' || cur.userData.state === 'unlocked')) {
        cur.material.emissiveIntensity = 0.55 + Math.sin(t * 2.2) * 0.25;
        cur.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
      }

      renderer.render(scene, camera);
    };
    animateDash();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  },

  /* ─────────────────────────────────────────────────
   * PARTICLE BG — subtle floating particles for pages
   * ───────────────────────────────────────────────── */
  initParticleBG(canvas, count = 600) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    const mouse = { x: -9999, y: -9999 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    const paletteDark = [
      [124, 111, 255], [0, 212, 170], [245, 166, 35], [157, 149, 255], [255, 107, 138],
    ];
    const paletteLight = [
      [75, 50, 205],   // Deep Indigo
      [0, 160, 120],   // Forest Cyan
      [220, 110, 0],   // Deep Orange
      [50, 80, 200],   // Royal Blue
      [220, 50, 90],   // Deep Rose
    ];

    const pts = Array.from({ length: count }, () => {
      const colorIndex = Math.floor(Math.random() * paletteDark.length);
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      return {
        ox, oy, 
        x: ox, y: oy,
        vx: 0, vy: 0,
        len: 3 + Math.random() * 5,
        width: 1.5 + Math.random() * 1.5,
        colorIndex,
        alpha: 0.6 + Math.random() * 0.4,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.5 + Math.random() * 1.5
      };
    });

    const REPEL_RADIUS = 250;
    const REPEL_STRENGTH = 15.0; 
    const FRICTION = 0.88;
    const SPRING = 0.008; 
    let time = 0;

    const draw = () => {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      time += 0.016;

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const currentPalette = isLight ? paletteLight : paletteDark;

      pts.forEach(p => {
        // Natural wobble around origin
        const wox = p.ox + Math.cos(time * p.wobbleSpeed + p.wobbleOffset) * 15;
        const woy = p.oy + Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * 15;

        // Repel from mouse
        const dxM = p.x - mouse.x;
        const dyM = p.y - mouse.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);

        if (distM < REPEL_RADIUS && distM > 0) {
          const force = Math.pow((1 - distM / REPEL_RADIUS), 2) * REPEL_STRENGTH;
          p.vx += (dxM / distM) * force;
          p.vy += (dyM / distM) * force;
        }

        // Spring back to (wobble) origin
        p.vx += (wox - p.x) * SPRING;
        p.vy += (woy - p.y) * SPRING;

        // Apply friction and move
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // Render
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const angle = speed > 0.5 ? Math.atan2(p.vy, p.vx) : Math.atan2(p.y - p.oy, p.x - p.ox);
        const stretch = Math.min(speed * 1.2, 12);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.globalAlpha = p.alpha;
        const col = currentPalette[p.colorIndex];
        ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        const hw = p.width / 2;
        const hl = (p.len + stretch) / 2;
        ctx.beginPath();
        ctx.roundRect(-hl, -hw, hl * 2, hw * 2, hw);
        ctx.fill();
        ctx.restore();
      });
    };

    draw();
  },
};

export default AP3D;
