/* Trifonction du club en 3D, présentée en « mannequin invisible » : seule la tenue
   est visible, avec le volume d'un corps.
   - Les vues de face et de dos sont découpées dans images/tenues/trifonctions.webp
     (version garçon ou fille) et détourées (fond blanc retiré).
   - La forme est calculée à partir du contour de la trifonction : à chaque hauteur,
     une section arrondie (torse) ou deux (jambes).
   - Le motif est projeté de face sur l'avant et de dos sur l'arrière ; les flancs
     sont raccordés avec la couleur commune aux deux vues, pour ne voir aucune couture. */
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
    // les pixels rebouchés sont les rayures blanches du motif, retirées par le détourage
    const remplir = (y, a, b) => {
      for (let x = a; x <= b; x++) {
        const i = (y * W + x) * 4;
        if (op[i + 3] < 200) op[i] = op[i + 1] = op[i + 2] = 245;
        op[i + 3] = 255;
      }
    };
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
  img.onload = () => {
    const face = decoupe(img, ZONES.face), dos = decoupe(img, ZONES.dos);
    raccorder(face, dos);
    build(face, dos);
  };

  // Bas de l'emmanchure : première ligne où le torse atteint presque sa largeur maximale
  function ligneAisselle(rows) {
    const largeur = y => (rows[y].length ? rows[y][rows[y].length - 1][1] - rows[y][0][0] : 0);
    let max = 0;
    for (let y = 0; y < H * 0.45; y++) max = Math.max(max, largeur(y));
    for (let y = 0; y < H * 0.45; y++) if (largeur(y) >= max * 0.97) return y;
    return Math.round(H * 0.25);
  }

  /* ---------- Raccord des flancs entre la vue de face et la vue de dos ----------
     Le long de chaque bord, on prend la couleur moyenne des deux vues, lissée sur la
     hauteur, et on y fond le motif : même couleur des deux côtés, donc pas de couture. */
  function raccorder(face, dos) {
    const fx = face.canvas.getContext("2d"), dx = dos.canvas.getContext("2d");
    const fd = fx.getImageData(0, 0, W, H), dd = dx.getImageData(0, 0, W, H);
    const FONDU = 30, BANDE = [5, 20], LISSAGE = 10;
    const moyenne = (px, y, bord, sens) => {
      const c = [0, 0, 0];
      let n = 0;
      for (let t = BANDE[0]; t < BANDE[1]; t++) {
        const x = bord + sens * t;
        if (x < 0 || x >= W) continue;
        const i = (y * W + x) * 4;
        if (px[i + 3] < 128) continue;
        c[0] += px[i]; c[1] += px[i + 1]; c[2] += px[i + 2]; n++;
      }
      return n ? c.map(v => v / n) : null;
    };
    // Bords qui se correspondent : le côté gauche de la face est le côté droit de la photo de dos
    const bords = y => {
      const f = face.rows[y], d = dos.rows[y];
      if (!f.length || !d.length) return [];
      const fL = f[f.length - 1], dL = d[d.length - 1];
      const liste = [[f[0][0], 1, dL[1], -1], [fL[1], -1, d[0][0], 1]];
      if (f.length >= 2 && d.length >= 2) liste.push([f[0][1], -1, dL[0], 1], [fL[0], 1, d[0][1], -1]);
      return liste;
    };
    const debut = Math.max(ligneAisselle(face.rows), ligneAisselle(dos.rows)); // au-dessus : emmanchures ouvertes
    for (let k = 0; k < 4; k++) {
      const couleurs = [];
      for (let y = 0; y < H; y++) {
        const b = y >= debut ? bords(y)[k] : null;
        if (!b) { couleurs.push(null); continue; }
        const a = moyenne(fd.data, y, b[0], b[1]), c = moyenne(dd.data, y, b[2], b[3]);
        couleurs.push(a && c ? a.map((v, i) => (v + c[i]) / 2) : a || c);
      }
      for (let y = 0; y < H; y++) {
        const b = y >= debut ? bords(y)[k] : null;
        if (!b || !couleurs[y]) continue;
        const col = [0, 0, 0];
        let n = 0;
        for (let q = -LISSAGE; q <= LISSAGE; q++) {
          const v = couleurs[y + q];
          if (v) { col[0] += v[0]; col[1] += v[1]; col[2] += v[2]; n++; }
        }
        const peint = (px, bord, sens) => {
          for (let t = -6; t < FONDU; t++) {
            const x = bord + sens * t;
            if (x < 0 || x >= W) continue;
            const i = (y * W + x) * 4;
            if (px[i + 3] === 0) continue;
            const u = Math.max(0, t) / FONDU, m = 1 - u * u * (3 - 2 * u);
            for (let c = 0; c < 3; c++) px[i + c] += (col[c] / n - px[i + c]) * m;
          }
        };
        peint(fd.data, b[0], b[1]);
        peint(dd.data, b[2], b[3]);
      }
    }
    fx.putImageData(fd, 0, 0);
    dx.putImageData(dd, 0, 0);
  }
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

    scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4cc, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 0.45);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdbe6ff, 0.3);
    rim.position.set(-3, 1.5, -3);
    scene.add(rim);

    const tex = cv => { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
    // alphaToCoverage + antialias : bords des emmanchures, de l'encolure et des cuisses lissés
    const tissu = cv => new THREE.MeshStandardMaterial({ map: tex(cv), alphaTest: 0.35, alphaToCoverage: true, side: THREE.FrontSide, roughness: 0.78, metalness: 0 });
    // Intérieur du vêtement, visible à l'encolure, aux emmanchures et aux cuisses
    const doublure = mat => new THREE.MeshBasicMaterial({ map: mat.map, color: 0x0c1019, alphaTest: 0.35, side: THREE.BackSide });
    const matFace = tissu(face.canvas), matDos = tissu(dos.canvas);
    const inFace = doublure(matFace), inDos = doublure(matDos);

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
            // ecart : avant et arrière ne se rejoignent pas sur le côté (emmanchure ouverte)
            const g = p3.ecart || 0, sens = avant ? 1 : -1;
            const z = (cz * (1 - g) + sens * g) * (avant ? p3.av : p3.ar) + p3.dz;
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
    const add = (geo, mat) => {
      group.add(new THREE.Mesh(geo, mat));
      group.add(new THREE.Mesh(geo, mat === matFace ? inFace : inDos));
    };
    const cloche = (t, centre, largeur) => Math.exp(-((t - centre) ** 2) / largeur);

    /* Torse : de l'encolure à la fourche, avec les volumes d'un vrai corps */
    const torse = profil(top, fourche, y => (fr[y].length ? outer(fr[y]) : null));
    const poitrine = variante === "fille" ? 0.1 : 0.07;
    const tAisselle = Math.max(0.12, (ligneAisselle(fr) - top) / Math.max(1, fourche - top));
    const profTorse = (y, hw) => {
      const t = (y - top) / Math.max(1, fourche - top);           // 0 = épaules, 1 = entrejambe
      // en haut, la tenue passe par-dessus les épaules : avant et arrière se rejoignent
      const epaules = 0.55 + 0.45 * Math.sqrt(Math.min(1, t / 0.1));
      const base = hw * K * (0.62 + 0.08 * Math.sin(t * Math.PI)) * epaules;
      return {
        av: base + (poitrine * cloche(t, 0.27, 0.012) + 0.02 * cloche(t, 0.62, 0.03)) * epaules, // poitrine, ventre
        ar: base + (0.03 * cloche(t, 0.2, 0.02) + 0.1 * cloche(t, 0.96, 0.012)) * epaules,       // omoplates, fessiers
        dz: 0,
        ecart: t < tAisselle ? 0.6 * Math.sin(Math.PI * t / tAisselle) ** 0.7 : 0,
      };
    };
    const [tf, tb] = tube(torse, profTorse, null);
    add(tf, matFace); add(tb, matDos);
    // Doublure sombre derrière les emmanchures : on ne voit pas à travers la tenue
    const debutDoublure = Math.round(torse.length * 0.1), finDoublure = Math.round(torse.length * Math.min(0.6, tAisselle + 0.08));
    const matDoublure = new THREE.MeshBasicMaterial({ color: 0x03050b, side: THREE.DoubleSide });
    tube(torse.slice(debutDoublure, finDoublure), (y, hw) => {
      const p = profTorse(y, hw);
      return { av: p.av * 0.8, ar: p.ar * 0.8, dz: 0 };
    }, null).forEach(g => { const m = new THREE.Mesh(g, matDoublure); m.scale.x = 0.86; group.add(m); });

    /* Jambes de la tenue : deux tubes depuis la fourche, qui prolongent bassin et fessiers */
    const jambe = cote => {
      const pickF = y => { const s = fr[y]; return s.length >= 2 ? (cote < 0 ? s[0] : s[s.length - 1]) : null; };
      const pickB = y => { const s = br[y]; return s && s.length >= 2 ? (cote < 0 ? s[s.length - 1] : s[0]) : null; };
      const prof = profil(fourche, bot, pickF);
      return tube(prof, (y, hw) => {
        const t = Math.min(1, (y - fourche) / 140), haut = (1 - t) ** 2;
        return { av: hw * K * (0.92 + 0.3 * haut), ar: hw * K * 0.92 + 0.12 * haut, dz: -0.02 };
      }, { dos: pickB }, 2.15);
    };
    for (const cote of [-1, 1]) { const [f, b] = jambe(cote); add(f, matFace); add(b, matDos); }

    scene.add(group);

    /* Ombre au sol */
    const sol = document.createElement("canvas");
    sol.width = sol.height = 128;
    const g2 = sol.getContext("2d");
    const grad = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(15,33,80,.32)");
    grad.addColorStop(1, "rgba(15,33,80,0)");
    g2.fillStyle = grad; g2.fillRect(0, 0, 128, 128);
    const ombre = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sol), transparent: true, depthWrite: false }));
    ombre.rotation.x = -Math.PI / 2;
    ombre.position.y = wy(bot) - 0.16;
    scene.add(ombre);

    // Cadrage : toute la tenue, en grand
    const yMin = wy(bot) - 0.2, yMax = wy(top) + 0.05;
    camera.position.set(0, (yMin + yMax) / 2 + 0.25, ((yMax - yMin) / 2 + 0.12) / Math.tan((28 / 2) * Math.PI / 180) + 0.3);
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
