/* Trifonction du club portée par un buste de mannequin en 3D.
   - Les vues de face et de dos sont découpées dans images/tenues/trifonctions.webp
     (version garçon ou fille) et détourées (fond blanc retiré).
   - La forme du corps est calculée à partir du contour de la trifonction :
     à chaque hauteur, une section elliptique (torse) ou deux (jambes).
   - Le motif est projeté de face sur l'avant et de dos sur l'arrière,
     puis éclairé comme un vrai objet. */
window.initTrifonction3D = function (variante = "garcon") {
  const host = document.querySelector("[data-trifonction-3d]");
  if (!host || typeof THREE === "undefined") return;
  if (host._detruire) host._detruire(); // on remplace la version affichée
  host.classList.remove("is-ready");

  const SRC = "images/tenues/trifonctions.webp";
  // Zones (x, y, largeur, hauteur) de chaque vue dans la planche des trifonctions
  const ZONES = variante === "fille"
    ? { face: [815, 128, 305, 668], dos: [1128, 120, 290, 676] }
    : { face: [60, 116, 310, 680], dos: [420, 84, 330, 712] };
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
    { // adoucit le bord découpé (évite l'effet d'escalier)
      const a = new Float32Array(zw * zh);
      for (let p = 0; p < zw * zh; p++) a[p] = px[p * 4 + 3];
      for (let y = 1; y < zh - 1; y++) for (let x = 1; x < zw - 1; x++) {
        const p = y * zw + x;
        px[p * 4 + 3] = (4 * a[p] + 2 * (a[p - 1] + a[p + 1] + a[p - zw] + a[p + zw]) + a[p - zw - 1] + a[p - zw + 1] + a[p + zw - 1] + a[p + zw + 1]) / 16;
      }
    }
    let x0 = zw, y0 = zh, x1 = 0, y1 = 0;
    for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
      if (px[(y * zw + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    ctx.putImageData(data, 0, 0);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const octx = out.getContext("2d", { willReadFrequently: true });
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = (H * 0.98) / bh, dw = bw * s;
    octx.imageSmoothingQuality = "high";
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
    // Les rayures blanches du motif coupent certaines lignes en morceaux : sous les
    // emmanchures, on recolle chaque ligne en un torse, ou en deux jambes de part et
    // d'autre de l'entrejambe (le vide qui passe par le milieu), et on rebouche les trous.
    const opaque = (y, x) => op[(y * W + x) * 4 + 3] > 128;
    const remplir = (y, a, b) => { for (let x = a; x <= b; x++) op[(y * W + x) * 4 + 3] = 255; };
    // Les rayures blanches du bord sont aussi retirées par le détourage : le contour
    // extérieur ne peut pas rentrer d'un coup, on garde le plus large sur ±12 lignes.
    const y30 = Math.round(H * 0.3), Lb = [], Rb = [];
    for (let y = 0; y < H; y++) { const sg = rows[y]; Lb[y] = sg.length ? sg[0][0] : null; Rb[y] = sg.length ? sg[sg.length - 1][1] : null; }
    for (let y = y30; y < H; y++) {
      const segs = rows[y];
      if (!segs.length) continue;
      let L = Lb[y], R = Rb[y];
      for (let k = Math.max(y30, y - 12); k <= Math.min(H - 1, y + 12); k++) if (Lb[k] !== null) { L = Math.min(L, Lb[k]); R = Math.max(R, Rb[k]); }
      const m = W >> 1;
      let g0 = m, g1 = m;
      if (!opaque(y, m)) { while (g0 > L && !opaque(y, g0 - 1)) g0--; while (g1 < R && !opaque(y, g1 + 1)) g1++; }
      if (!opaque(y, m) && g1 - g0 > 6) {
        rows[y] = [[L, g0 - 1], [g1 + 1, R]];
        remplir(y, L, g0 - 1); remplir(y, g1 + 1, R);
      } else {
        rows[y] = [[L, R]];
        remplir(y, L, R);
      }
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
    let actif = true;
    host._detruire = () => { actif = false; renderer.dispose(); renderer.domElement.remove(); host._detruire = null; };
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

    const tex = cv => { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
    // alphaToCoverage + antialias : bords des emmanchures, de l'encolure et des cuisses lissés
    const tissu = cv => new THREE.MeshStandardMaterial({ map: tex(cv), alphaTest: 0.35, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 });
    const matFace = tissu(face.canvas), matDos = tissu(dos.canvas);
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
        // lissage en cloche : contour régulier, sans marches
        for (let k = -12; k <= 12; k++) { const q = list[i + k]; if (q) { const w = Math.exp(-(k * k) / 40); c += q.c * w; hw += q.hw * w; n += w; } }
        return { y: p.y, c: c / n, hw: hw / n };
      });
    }

    const dosOuter = y => (br[y] && br[y].length ? outer(br[y]) : null);

    /* Tube à section arrondie (super-ellipse, plus proche d'un corps qu'une ellipse) :
       moitié avant (photo de face) et moitié arrière (photo de dos), avec une
       profondeur différente devant (poitrine, ventre) et derrière (dos, fessiers). */
    function tube(prof, prof3d, leg, rondeur = 2.5) {
      const SEG = 72, STEP = 2, e = 2 / rondeur;
      const puis = v => Math.sign(v) * Math.abs(v) ** e;
      const rowsUsed = prof.filter((_, i) => i % STEP === 0 || i === prof.length - 1);
      const make = avant => {
        const pos = [], uv = [], idx = [];
        rowsUsed.forEach(p => {
          const p3 = prof3d(p.y, p.hw);
          for (let j = 0; j <= SEG; j++) {
            const a = (avant ? -Math.PI / 2 : Math.PI / 2) + (j / SEG) * Math.PI;
            const sx = puis(Math.sin(a)), cz = puis(Math.cos(a));
            const x = p.c + sx * p.hw;
            const z = cz * (cz >= 0 ? p3.av : p3.ar) + p3.dz;
            pos.push(wx(x), wy(p.y), z);
            // Répartition du motif selon l'angle et non en projection plate : sinon les
            // pixels du bord sont étirés sur les flancs et forment des traînées verticales.
            const f = Math.max(-1, Math.min(1, sx)), lin = (2 * Math.asin(f)) / Math.PI;
            const xc = p.c + (p.hw - 2) * (0.4 * f + 0.6 * lin);
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
    const cloche = (t, centre, largeur) => Math.exp(-((t - centre) ** 2) / largeur);

    /* Torse : de l'encolure à la fourche, avec les volumes d'un vrai corps */
    const torse = profil(top, fourche, y => (fr[y].length ? outer(fr[y]) : null));
    const poitrine = variante === "fille" ? 0.1 : 0.07;
    const profTorse = (y, hw) => {
      const t = (y - top) / Math.max(1, fourche - top);           // 0 = épaules, 1 = entrejambe
      // en haut, la tenue passe par-dessus les épaules : avant et arrière se rejoignent
      const epaules = 0.35 + 0.65 * Math.sqrt(Math.min(1, t / 0.1));
      const base = hw * K * (0.62 + 0.08 * Math.sin(t * Math.PI)) * epaules;
      return {
        av: base + (poitrine * cloche(t, 0.27, 0.012) + 0.02 * cloche(t, 0.62, 0.03)) * epaules, // poitrine, ventre
        ar: base + (0.03 * cloche(t, 0.2, 0.02) + 0.1 * cloche(t, 0.96, 0.012)) * epaules,       // omoplates, fessiers
        dz: 0,
      };
    };
    const [tf, tb] = tube(torse, profTorse, null);
    add(tf, matFace); add(tb, matDos);

    /* Jambes de la tenue : deux tubes depuis la fourche, qui prolongent bassin et fessiers */
    const jambe = cote => {
      const pickF = y => { const s = fr[y]; return s.length >= 2 ? (cote < 0 ? s[0] : s[s.length - 1]) : null; };
      const pickB = y => { const s = br[y]; return s && s.length >= 2 ? (cote < 0 ? s[s.length - 1] : s[0]) : null; };
      const prof = profil(fourche, bot, pickF);
      const bas = prof.slice(-40);
      finJambe[cote] = { ...prof[prof.length - 1], hwMoy: bas.reduce((m, p) => m + p.hw, 0) / bas.length };
      return tube(prof, (y, hw) => {
        const t = Math.min(1, (y - fourche) / 140), haut = (1 - t) ** 2;
        return { av: hw * K * (0.92 + 0.3 * haut), ar: hw * K * 0.92 + 0.12 * haut, dz: -0.02 };
      }, { dos: pickB }, 2.15);
    };
    const finJambe = {};
    for (const cote of [-1, 1]) { const [f, b] = jambe(cote); add(f, matFace); add(b, matDos); }

    /* ---------- Mannequin : corps complet sous la tenue ---------- */
    const peau = new THREE.Group();
    const corps = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) => {
      const m = new THREE.Mesh(geo, matPeau);
      m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.z = rz;
      peau.add(m);
      return m;
    };
    // Torse sous la tenue (visible aux emmanchures et à l'encolure)
    tube(torse, (y, hw) => { const p = profTorse(y, hw); return { av: p.av * 0.96, ar: p.ar * 0.96, dz: 0 }; }, null)
      .forEach(g => corps(g, 0, 0, 0, 0.97));
    // Formes de révolution lisses : profil (rayon, hauteur) tourné autour de l'axe
    const tour = pts => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)), 56);
    const aisselle = torse.slice(0, Math.round(torse.length * 0.4)).reduce((m, p) => (p.hw > m.hw ? p : m));
    const cx = wx(aisselle.c), demi = aisselle.hw * K, yHaut = wy(top);
    const epaisseur = profTorse(aisselle.y, aisselle.hw).av;

    // Épaules : une forme arrondie d'une épaule à l'autre, qui ressort par les emmanchures
    corps(new THREE.SphereGeometry(1, 48, 32), cx, yHaut - 0.22, -0.02, demi + 0.04, 0.17, epaisseur * 0.85);
    // Cou et tête de mannequin
    corps(tour([[0.17, 0], [0.15, 0.12], [0.14, 0.3], [0.15, 0.4]]), cx, yHaut - 0.08, -0.02);
    corps(new THREE.SphereGeometry(0.3, 48, 32), cx, yHaut + 0.58, 0.01, 0.76, 1.04, 0.88);
    // Bras jusqu'au coude : épaule arrondie, biceps, coude, fin arrondie
    const bras = tour([[0, 0.17], [0.09, 0.16], [0.15, 0.11], [0.165, 0.03], [0.16, -0.12], [0.15, -0.35],
      [0.13, -0.6], [0.115, -0.78], [0.11, -0.86], [0.09, -0.93], [0.05, -0.965], [0, -0.97]]);
    for (const s of [-1, 1]) {
      corps(bras, cx + s * (demi + 0.06), yHaut - 0.26, -0.03, 1, 1, 0.9, s * 0.08);
      // Jambe : de l'ourlet de la tenue au mollet (genou, mollet, fin arrondie)
      // largeur moyenne du bas de la cuisse (l'ourlet dessiné est souvent rétréci)
      const fin = finJambe[s], r0 = fin.hwMoy * K * 0.97;
      const jambeNue = tour([[r0, 0.1], [r0 * 0.97, -0.1], [r0 * 0.88, -0.32], [r0 * 0.8, -0.52], [r0 * 0.72, -0.66],
        [r0 * 0.74, -0.74], [r0 * 0.8, -0.86], [r0 * 0.8, -0.96], [r0 * 0.7, -1.12], [r0 * 0.56, -1.28],
        [r0 * 0.5, -1.36], [r0 * 0.4, -1.41], [r0 * 0.2, -1.44], [0, -1.45]]);
      corps(jambeNue, wx(fin.c), wy(bot), -0.02, 1, 1, 0.92, -s * 0.04); // genoux légèrement rapprochés
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
    ombre.position.y = wy(bot) - 1.5;
    scene.add(ombre);

    // Cadrage : de la tête au bas des jambes
    const yMin = wy(bot) - 1.5, yMax = yHaut + 0.95;
    camera.position.set(0, (yMin + yMax) / 2 + 0.1, ((yMax - yMin) / 2 + 0.3) / Math.tan((28 / 2) * Math.PI / 180));
    camera.lookAt(0, (yMin + yMax) / 2, 0);

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
      if (!actif) return;
      requestAnimationFrame(loop);
      if (!visible) return;
      group.rotation.y += vitesse;
      renderer.render(scene, camera);
    })();
    host.classList.add("is-ready");
  }
};
