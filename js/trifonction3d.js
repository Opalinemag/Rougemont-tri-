/* Trifonction du club portée par un buste de mannequin en 3D.
   - Les vues de face et de dos sont découpées dans images/trifonction-3d.jpg
     et détourées (fond blanc retiré).
   - La forme du corps est calculée à partir du contour de la trifonction :
     à chaque hauteur, une section elliptique (torse) ou deux (jambes).
   - Le motif est projeté de face sur l'avant et de dos sur l'arrière,
     puis éclairé comme un vrai objet. */
window.initTrifonction3D = function () {
  const host = document.querySelector("[data-trifonction-3d]");
  if (!host || host.dataset.init || typeof THREE === "undefined") return;
  host.dataset.init = "1";

  const SRC = "images/trifonction-3d.jpg";
  const ZONES = { face: [0, 0, 308, 690], dos: [308, 0, 250, 690] };
  const W = 512, H = 1024;

  /* ---------- Découpe et détourage d'une vue ---------- */
  function decoupe(img, [zx, zy, zw, zh]) {
    const c = document.createElement("canvas");
    c.width = zw; c.height = zh;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, zx, zy, zw, zh, 0, 0, zw, zh);
    const data = ctx.getImageData(0, 0, zw, zh), px = data.data;
    const clair = i => Math.min(px[i], px[i + 1], px[i + 2]) > 165 && Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]) < 34;
    const vu = new Uint8Array(zw * zh), pile = [];
    for (let x = 0; x < zw; x++) pile.push(x, (zh - 1) * zw + x);
    for (let y = 0; y < zh; y++) pile.push(y * zw, y * zw + zw - 1);
    while (pile.length) {
      const p = pile.pop();
      if (vu[p]) continue;
      vu[p] = 1;
      if (!clair(p * 4)) continue;
      px[p * 4 + 3] = 0;
      const x = p % zw, y = (p / zw) | 0;
      if (x > 0) pile.push(p - 1);
      if (x < zw - 1) pile.push(p + 1);
      if (y > 0) pile.push(p - zw);
      if (y < zh - 1) pile.push(p + zw);
    }
    for (let pass = 0; pass < 2; pass++) { // rogne le liseré clair
      const a = new Uint8Array(zw * zh);
      for (let p = 0; p < zw * zh; p++) a[p] = px[p * 4 + 3] > 0 ? 1 : 0;
      for (let y = 1; y < zh - 1; y++) for (let x = 1; x < zw - 1; x++) {
        const p = y * zw + x;
        if (a[p] && (!a[p - 1] || !a[p + 1] || !a[p - zw] || !a[p + zw])) px[p * 4 + 3] = 0;
      }
    }
    let x0 = zw, y0 = zh, x1 = 0, y1 = 0;
    for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
      if (px[(y * zw + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    ctx.putImageData(data, 0, 0);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const octx = out.getContext("2d", { willReadFrequently: true });
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = (H * 0.98) / bh, dw = bw * s;
    octx.drawImage(c, x0, y0, bw, bh, (W - dw) / 2, H * 0.01, dw, bh * s);

    // Analyse ligne par ligne : segments opaques (1 = torse, 2 = jambes)
    const od = octx.getImageData(0, 0, W, H), op = od.data;
    const rows = [];
    for (let y = 0; y < H; y++) {
      const segs = [];
      let start = -1;
      for (let x = 0; x < W; x++) {
        const on = op[(y * W + x) * 4 + 3] > 128;
        if (on && start < 0) start = x;
        if ((!on || x === W - 1) && start >= 0) { const end = on ? x : x - 1; if (end - start > 3) segs.push([start, end]); start = -1; }
      }
      rows.push(segs);
    }
    // Bavure des couleurs vers l'extérieur : évite les trous sur les côtés
    for (let y = 0; y < H; y++) {
      const segs = rows[y];
      if (!segs.length) continue;
      const L = segs[0][0], R = segs[segs.length - 1][1];
      const copy = (from, to) => { for (let k = 0; k < 3; k++) op[(y * W + to) * 4 + k] = op[(y * W + from) * 4 + k]; op[(y * W + to) * 4 + 3] = 255; };
      for (let x = 0; x < L; x++) copy(L + 1, x);
      for (let x = R + 1; x < W; x++) copy(R - 1, x);
    }
    octx.putImageData(od, 0, 0);
    return { canvas: out, rows };
  }

  const img = new Image();
  img.onload = () => build(decoupe(img, ZONES.face), decoupe(img, ZONES.dos));
  img.src = SRC;

  function build(face, dos) {
    /* ---------- Scène ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7.3);
    camera.lookAt(0, 0.02, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96b0, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdbe6ff, 0.45);
    rim.position.set(-3, 1.5, -3);
    scene.add(rim);

    const tex = cv => { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
    const matFace = new THREE.MeshStandardMaterial({ map: tex(face.canvas), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 });
    const matDos = new THREE.MeshStandardMaterial({ map: tex(dos.canvas), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 });
    const matPeau = new THREE.MeshStandardMaterial({ color: 0xe4e7ec, roughness: 0.7, metalness: 0 }); // mannequin

    /* ---------- Conversion pixels -> monde ---------- */
    const HAUT = 2.7, K = HAUT / H;
    const wx = px => (px - W / 2) * K;
    const wy = py => (H / 2 - py) * K;

    const fr = face.rows, br = dos.rows;
    let top = 0; while (top < H && !fr[top].length) top++;
    let bot = H - 1; while (bot > 0 && !fr[bot].length) bot--;
    const outer = segs => [segs[0][0], segs[segs.length - 1][1]];
    let fourche = bot;
    for (let y = Math.floor((top + bot) * 0.6); y < bot; y++) {
      const s = fr[y];
      if (s.length >= 2 && s[0][1] - s[0][0] > 20 && s[s.length - 1][1] - s[s.length - 1][0] > 20) { fourche = y; break; }
    }

    // Profil lissé : centre et demi-largeur à chaque hauteur
    function profil(y0, y1, pick) {
      const list = [];
      for (let y = y0; y <= y1; y++) {
        const seg = pick(y);
        list.push(seg ? { y, c: (seg[0] + seg[1]) / 2, hw: (seg[1] - seg[0]) / 2 } : null);
      }
      const first = list.find(Boolean);
      for (let i = 0; i < list.length; i++) if (!list[i]) list[i] = { ...(list[i - 1] || first), y: y0 + i };
      return list.map((p, i) => {
        let c = 0, hw = 0, n = 0;
        for (let k = -6; k <= 6; k++) { const q = list[i + k]; if (q) { c += q.c; hw += q.hw; n++; } }
        return { y: p.y, c: c / n, hw: hw / n };
      });
    }

    const dosOuter = y => (br[y] && br[y].length ? outer(br[y]) : null);

    /* Tube elliptique : moitié avant (face) et moitié arrière (dos) */
    function tube(prof, prof3d, leg) {
      const SEG = 48, STEP = 4;
      const rowsUsed = prof.filter((_, i) => i % STEP === 0 || i === prof.length - 1);
      const make = avant => {
        const pos = [], uv = [], idx = [];
        rowsUsed.forEach(p => {
          const p3 = prof3d(p.y, p.hw);
          for (let j = 0; j <= SEG; j++) {
            const a = (avant ? -Math.PI / 2 : Math.PI / 2) + (j / SEG) * Math.PI;
            const x = p.c + Math.sin(a) * p.hw;
            const z = Math.cos(a) * p3.prof + p3.dz;
            pos.push(wx(x), wy(p.y), z);
            const xc = Math.min(Math.max(x, p.c - p.hw + 1.5), p.c + p.hw - 1.5);
            if (avant) {
              uv.push(xc / W, 1 - p.y / H);
            } else {
              // côté droit du corps = côté gauche de la photo de dos
              const seg = leg ? leg.dos(p.y) : dosOuter(p.y);
              const L = p.c - p.hw, R = p.c + p.hw;
              const t = (R - xc) / Math.max(1, R - L);
              const u = seg ? seg[0] + 1.5 + t * (seg[1] - seg[0] - 3) : W - xc;
              uv.push(u / W, 1 - p.y / H);
            }
          }
        });
        for (let r = 0; r < rowsUsed.length - 1; r++) for (let j = 0; j < SEG; j++) {
          const a = r * (SEG + 1) + j, b = a + SEG + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
      };
      return [make(true), make(false)];
    }

    const group = new THREE.Group();
    const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); group.add(m); return m; };

    /* Torse : de l'encolure à la fourche */
    const torse = profil(top, fourche, y => (fr[y].length ? outer(fr[y]) : null));
    const profTorse = (y, hw) => {
      const t = (y - top) / Math.max(1, fourche - top);           // 0 = épaules, 1 = bassin
      const ratio = 0.6 + 0.12 * Math.sin(t * Math.PI);            // épaisseur relative
      const poitrine = 0.06 * Math.exp(-((t - 0.28) ** 2) / 0.02); // léger volume pectoral
      return { prof: hw * K * ratio + poitrine * 0.5, dz: poitrine * 0.5 };
    };
    const [tf, tb] = tube(torse, profTorse, null);
    add(tf, matFace); add(tb, matDos);

    /* Jambes : deux tubes depuis la fourche */
    const jambe = cote => {
      const pickF = y => { const s = fr[y]; return s.length >= 2 ? (cote < 0 ? s[0] : s[s.length - 1]) : null; };
      const pickB = y => { const s = br[y]; return s && s.length >= 2 ? (cote < 0 ? s[s.length - 1] : s[0]) : null; };
      const prof = profil(fourche, bot, pickF);
      finJambe[cote] = prof[prof.length - 1];
      return tube(prof, (y, hw) => ({ prof: hw * K * 0.92, dz: -0.02 }), { dos: pickB });
    };
    const finJambe = {};
    for (const cote of [-1, 1]) { const [f, b] = jambe(cote); add(f, matFace); add(b, matDos); }

    /* ---------- Mannequin : corps sous la tenue, cou, épaules, cuisses ---------- */
    const peau = new THREE.Group();
    tube(torse, (y, hw) => { const p = profTorse(y, hw); return { prof: p.prof * 0.96, dz: p.dz }; }, null)
      .forEach(g => { const m = new THREE.Mesh(g, matPeau); m.scale.set(0.97, 1, 1); peau.add(m); });
    const ep = torse[Math.min(torse.length - 1, 30)];
    const yEp = wy(top + 18), demiEp = ep.hw * K;
    const cou = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.4, 32), matPeau);
    cou.position.set(wx(ep.c), yEp + 0.16, 0);
    peau.add(cou);
    const dessus = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), matPeau);
    dessus.position.set(wx(ep.c), yEp + 0.36, 0);
    peau.add(dessus);
    for (const s of [-1, 1]) {
      const epaule = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), matPeau);
      epaule.scale.set(0.9, 0.75, 0.95);
      epaule.position.set(wx(ep.c) + s * (demiEp + 0.02), yEp - 0.12, 0);
      peau.add(epaule);
      const fin = finJambe[s];
      const r = fin.hw * K * 0.86;
      const yb = wy(bot);
      const cuisse = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, 0.32, 32), matPeau);
      cuisse.position.set(wx(fin.c), yb - 0.14, -0.02);
      peau.add(cuisse);
      const fond = new THREE.Mesh(new THREE.CircleGeometry(r * 0.88, 32), matPeau);
      fond.rotation.x = Math.PI / 2;
      fond.position.set(cuisse.position.x, yb - 0.3, -0.02);
      peau.add(fond);
    }
    group.add(peau);
    scene.add(group);

    /* Ombre au sol */
    const sol = document.createElement("canvas");
    sol.width = sol.height = 128;
    const g2 = sol.getContext("2d");
    const grad = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(15,33,80,.32)");
    grad.addColorStop(1, "rgba(15,33,80,0)");
    g2.fillStyle = grad; g2.fillRect(0, 0, 128, 128);
    const ombre = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sol), transparent: true, depthWrite: false }));
    ombre.rotation.x = -Math.PI / 2;
    ombre.position.y = wy(bot) - 0.4;
    scene.add(ombre);

    /* ---------- Taille et rotation ---------- */
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(host);

    // Rotation continue, sans interaction
    const vitesse = 0.008;
    let visible = true;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(host);
    window.__trifonction = { group, renderer, scene, camera }; // pour les tests
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      group.rotation.y += vitesse;
      renderer.render(scene, camera);
    })();
    host.classList.add("is-ready");
  }
};
