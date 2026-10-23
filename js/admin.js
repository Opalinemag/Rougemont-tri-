/* Espace administrateur – Rougemont Triathlon */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

let token = sessionStorage.getItem("rt-admin") || "";
let content = null;

/* ---------- Outils ---------- */
let toastTimer;
function toast(msg, error = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (error ? " is-error" : "");
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), error ? 6000 : 2500);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/login") { logout(); throw new Error(json.error || "Session expirée"); }
  if (!res.ok) throw new Error(json.error || "Erreur " + res.status);
  return json;
}

async function save(msg = "Enregistré, le site est à jour") {
  try {
    await api("/api/content", content);
    toast(msg);
    return true;
  } catch (e) {
    toast("Échec de l'enregistrement : " + e.message, true);
    return false;
  }
}

// Réduit la photo dans le navigateur (max 1600 px) puis l'envoie
async function uploadImage(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.82));
  const data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
  const { url } = await api("/api/upload", { data, type: "image/jpeg" });
  return url;
}

/* ---------- Connexion ---------- */
$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#login-error");
  err.hidden = true;
  const btn = $("button", e.target);
  btn.disabled = true;
  try {
    const { token: t } = await api("/api/login", { user: e.target.user.value, password: e.target.password.value });
    token = t;
    sessionStorage.setItem("rt-admin", t);
    e.target.reset();
    await start();
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

function logout() {
  token = "";
  sessionStorage.removeItem("rt-admin");
  $("#app").hidden = true;
  $("#login").hidden = false;
}
$("#logout").addEventListener("click", logout);

async function start() {
  let saved = {};
  try { saved = await api("/api/content"); } catch (e) { toast("Impossible de lire le contenu : " + e.message, true); }
  // Premier lancement : on part du contenu d'origine du site
  content = {
    actualites: saved.actualites || (typeof ACTUALITES !== "undefined" ? structuredClone(ACTUALITES) : []),
    albums: saved.albums || (typeof ALBUMS !== "undefined" ? structuredClone(ALBUMS) : []),
    entrainements: saved.entrainements || (typeof ENTRAINEMENTS !== "undefined" ? structuredClone(ENTRAINEMENTS) : []),
    info: saved.info ?? (typeof INFO_DU_MOMENT !== "undefined" ? INFO_DU_MOMENT : ""),
    sponsors: saved.sponsors || (typeof SPONSORS !== "undefined" ? structuredClone(SPONSORS) : []),
    maillot: saved.maillot || (typeof MAILLOT !== "undefined" ? structuredClone(MAILLOT) : { image: "", texte: "" }),
  };
  $("#login").hidden = true;
  $("#app").hidden = false;
  renderNews();
  renderAlbums();
  renderPlanning();
  renderSponsorsAdmin();
  renderMaillot();
}

/* ---------- Onglets ---------- */
document.querySelectorAll(".adm-tabs button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".adm-tabs button").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll("[data-panel]").forEach(p => (p.hidden = p.dataset.panel !== b.dataset.tab));
}));

/* ---------- Actualités ---------- */
const newsForm = $("#news-form");
let editing = -1;      // index de l'actu modifiée (-1 = nouvelle)
let newsImage = "";    // adresse de la photo choisie

function setNewsImage(url) {
  newsImage = url || "";
  const img = $("#news-img-preview");
  img.hidden = !newsImage;
  if (newsImage) img.src = newsImage;
  $("#news-img-remove").hidden = !newsImage;
}

function openNewsForm(i = -1) {
  editing = i;
  const a = i >= 0 ? content.actualites[i] : { date: new Date().toISOString().slice(0, 10), categorie: "Vie du club" };
  $("#news-form-title").textContent = i >= 0 ? "Modifier l'actualité" : "Nouvelle actualité";
  newsForm.titre.value = a.titre || "";
  newsForm.date.value = a.date || "";
  newsForm.categorie.value = a.categorie || "";
  newsForm.resume.value = a.resume || "";
  newsForm.texte.value = (a.texte || []).join("\n\n");
  setNewsImage(a.image);
  newsForm.hidden = false;
  newsForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
const closeNewsForm = () => { newsForm.hidden = true; newsForm.reset(); };

$("#news-new").addEventListener("click", () => openNewsForm());
$("#news-cancel").addEventListener("click", closeNewsForm);
$("#news-img-remove").addEventListener("click", () => setNewsImage(""));
$("#news-img").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Envoi de la photo…");
  try { setNewsImage(await uploadImage(file)); toast("Photo ajoutée"); }
  catch (ex) { toast("Échec de l'envoi : " + ex.message, true); }
  e.target.value = "";
});

newsForm.addEventListener("submit", async e => {
  e.preventDefault();
  const a = {
    date: newsForm.date.value,
    titre: newsForm.titre.value.trim(),
    categorie: newsForm.categorie.value.trim() || "Vie du club",
    image: newsImage,
    resume: newsForm.resume.value.trim(),
    texte: newsForm.texte.value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
  };
  if (!a.texte.length) a.texte = [a.resume];
  if (editing >= 0) content.actualites[editing] = a; else content.actualites.unshift(a);
  if (await save(editing >= 0 ? "Actualité modifiée" : "Actualité publiée")) { closeNewsForm(); renderNews(); }
});

function renderNews() {
  const list = $("#news-admin-list");
  const sorted = content.actualites.map((a, i) => ({ a, i })).sort((x, y) => (y.a.date || "").localeCompare(x.a.date || ""));
  list.innerHTML = sorted.length ? sorted.map(({ a, i }) => `
    <div class="item">
      ${a.image ? `<img src="${esc(a.image)}" alt="">` : '<span class="noimg"></span>'}
      <div><h4>${esc(a.titre)}</h4><small>${esc(a.categorie)} · ${esc(a.date)}</small></div>
      <div class="item__actions">
        <button class="btn btn--outline btn--xs" data-edit="${i}">Modifier</button>
        <button class="btn btn--danger btn--xs" data-del="${i}">Supprimer</button>
      </div>
    </div>`).join("") : '<p class="adm-card">Aucune actualité pour le moment.</p>';
}
$("#news-admin-list").addEventListener("click", async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if (ed) openNewsForm(+ed.dataset.edit);
  if (del) {
    const a = content.actualites[+del.dataset.del];
    if (!confirm(`Supprimer l'actualité « ${a.titre} » ?`)) return;
    content.actualites.splice(+del.dataset.del, 1);
    await save("Actualité supprimée");
    renderNews();
  }
});

/* ---------- Photos ---------- */
const albumForm = $("#album-form");
$("#album-new").addEventListener("click", () => { albumForm.hidden = false; albumForm.titre.focus(); });
$("#album-cancel").addEventListener("click", () => { albumForm.hidden = true; albumForm.reset(); });
albumForm.addEventListener("submit", async e => {
  e.preventDefault();
  content.albums.unshift({ titre: albumForm.titre.value.trim(), date: albumForm.date.value.trim(), photos: [] });
  albumForm.hidden = true;
  albumForm.reset();
  await save("Album créé, ajoutez maintenant vos photos");
  renderAlbums();
});

function renderAlbums() {
  $("#albums-admin").innerHTML = content.albums.length ? content.albums.map((al, ai) => `
    <div class="album-adm" data-album="${ai}">
      <div class="album-adm__head">
        <div><h3>${esc(al.titre)}</h3><span>${esc(al.date)} · ${al.photos.length} photo(s)</span></div>
        <div class="item__actions">
          <label class="btn btn--red btn--xs file-btn">+ Ajouter des photos<input type="file" accept="image/*" multiple data-add="${ai}"></label>
          <button class="btn btn--danger btn--xs" data-del-album="${ai}">Supprimer l'album</button>
        </div>
      </div>
      <div class="thumbs">
        ${al.photos.map((p, pi) => `
          <div class="thumb">
            <img src="${esc(p.src)}" alt="" loading="lazy">
            <input value="${esc(p.legende)}" placeholder="Légende" data-legende="${ai}:${pi}">
            <button data-del-photo="${ai}:${pi}">Supprimer</button>
          </div>`).join("")}
      </div>
    </div>`).join("") : '<p class="adm-card">Aucun album. Créez-en un pour ajouter des photos.</p>';
}

$("#albums-admin").addEventListener("change", async e => {
  if (e.target.dataset.add !== undefined) {
    const ai = +e.target.dataset.add;
    const files = [...e.target.files];
    const grid = $(`[data-album="${ai}"] .thumbs`);
    let ok = 0;
    for (const file of files) {
      const ph = document.createElement("div");
      ph.className = "thumb thumb--loading";
      ph.textContent = "Envoi…";
      grid.appendChild(ph);
      try {
        const url = await uploadImage(file);
        content.albums[ai].photos.push({ src: url, legende: "" });
        ok++;
      } catch (ex) {
        toast(`Échec pour ${file.name} : ${ex.message}`, true);
      }
    }
    if (ok) await save(`${ok} photo(s) ajoutée(s)`);
    renderAlbums();
  }
  if (e.target.dataset.legende !== undefined) {
    const [ai, pi] = e.target.dataset.legende.split(":").map(Number);
    content.albums[ai].photos[pi].legende = e.target.value.trim();
    await save("Légende enregistrée");
  }
});

$("#albums-admin").addEventListener("click", async e => {
  const dp = e.target.closest("[data-del-photo]"), da = e.target.closest("[data-del-album]");
  if (dp) {
    const [ai, pi] = dp.dataset.delPhoto.split(":").map(Number);
    if (!confirm("Retirer cette photo du site ?")) return;
    content.albums[ai].photos.splice(pi, 1);
    await save("Photo retirée");
    renderAlbums();
  }
  if (da) {
    const al = content.albums[+da.dataset.delAlbum];
    if (!confirm(`Supprimer l'album « ${al.titre} » et ses ${al.photos.length} photo(s) du site ?`)) return;
    content.albums.splice(+da.dataset.delAlbum, 1);
    await save("Album supprimé");
    renderAlbums();
  }
});

/* ---------- Planning ---------- */
function rowHtml(s = {}) {
  return `<tr>
    <td><select data-f="jour">${JOURS.map(j => `<option${j === s.jour ? " selected" : ""}>${j}</option>`).join("")}</select></td>
    <td><input data-f="debut" value="${esc(s.debut)}" placeholder="14h00"></td>
    <td><input data-f="fin" value="${esc(s.fin)}" placeholder="15h30"></td>
    <td><input data-f="groupe" value="${esc(s.groupe)}" placeholder="Enfants 5 – 10 ans"></td>
    <td><input data-f="activite" value="${esc(s.activite)}" placeholder="Vélo & course"></td>
    <td><input data-f="lieu" value="${esc(s.lieu)}" placeholder="Place de la Mairie"></td>
    <td><input data-f="note" value="${esc(s.note)}" placeholder="Casque obligatoire"></td>
    <td style="text-align:center"><input type="checkbox" data-f="annule"${s.annule === true || s.annule === "true" ? " checked" : ""}></td>
    <td><button class="btn btn--danger btn--xs" data-row-del type="button">×</button></td>
  </tr>`;
}
function renderPlanning() {
  $("#info-input").value = content.info || "";
  $("#planning-rows").innerHTML = content.entrainements.map(rowHtml).join("");
}
$("#row-add").addEventListener("click", () => $("#planning-rows").insertAdjacentHTML("beforeend", rowHtml({ jour: "Mercredi" })));
$("#planning-rows").addEventListener("click", e => { if (e.target.closest("[data-row-del]")) e.target.closest("tr").remove(); });
$("#planning-save").addEventListener("click", async () => {
  content.info = $("#info-input").value.trim();
  content.entrainements = [...document.querySelectorAll("#planning-rows tr")].map(tr => {
    const o = {};
    tr.querySelectorAll("[data-f]").forEach(el => (o[el.dataset.f] = el.type === "checkbox" ? el.checked : el.value.trim()));
    return o;
  }).filter(s => s.debut || s.groupe);
  await save("Planning enregistré");
  renderPlanning();
});

/* ---------- Sponsors ---------- */
const sponsorForm = $("#sponsor-form");
let sponsorEditing = -1, sponsorLogo = "";

function setSponsorLogo(url) {
  sponsorLogo = url || "";
  const img = $("#sponsor-logo-preview");
  img.hidden = !sponsorLogo;
  if (sponsorLogo) img.src = sponsorLogo;
  $("#sponsor-logo-remove").hidden = !sponsorLogo;
}
function openSponsorForm(i = -1) {
  sponsorEditing = i;
  const s = i >= 0 ? content.sponsors[i] : {};
  $("#sponsor-form-title").textContent = i >= 0 ? "Modifier le sponsor" : "Nouveau sponsor";
  ["nom", "activite", "description", "site"].forEach(k => (sponsorForm[k].value = s[k] || ""));
  setSponsorLogo(s.logo);
  sponsorForm.hidden = false;
  sponsorForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
const closeSponsorForm = () => { sponsorForm.hidden = true; sponsorForm.reset(); };
$("#sponsor-new").addEventListener("click", () => openSponsorForm());
$("#sponsor-cancel").addEventListener("click", closeSponsorForm);
$("#sponsor-logo-remove").addEventListener("click", () => setSponsorLogo(""));

// Les logos sont souvent en PNG transparent : on garde le PNG
async function uploadLogo(file) {
  if (file.type !== "image/png") return uploadImage(file);
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const data = c.toDataURL("image/png").split(",")[1];
  return (await api("/api/upload", { data, type: "image/png" })).url;
}
$("#sponsor-logo").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Envoi du logo…");
  try { setSponsorLogo(await uploadLogo(file)); toast("Logo ajouté"); }
  catch (ex) { toast("Échec de l'envoi : " + ex.message, true); }
  e.target.value = "";
});
sponsorForm.addEventListener("submit", async e => {
  e.preventDefault();
  const s = {
    nom: sponsorForm.nom.value.trim(),
    activite: sponsorForm.activite.value.trim(),
    description: sponsorForm.description.value.trim(),
    site: sponsorForm.site.value.trim(),
    logo: sponsorLogo,
  };
  if (sponsorEditing >= 0) content.sponsors[sponsorEditing] = s; else content.sponsors.push(s);
  if (await save(sponsorEditing >= 0 ? "Sponsor modifié" : "Sponsor ajouté")) { closeSponsorForm(); renderSponsorsAdmin(); }
});
function renderSponsorsAdmin() {
  $("#sponsors-admin").innerHTML = content.sponsors.length ? content.sponsors.map((s, i) => `
    <div class="item">
      ${s.logo ? `<img src="${esc(s.logo)}" alt="" class="contain">` : '<span class="noimg"></span>'}
      <div><h4>${esc(s.nom)}</h4><small>${esc(s.activite)}</small></div>
      <div class="item__actions">
        <button class="btn btn--outline btn--xs" data-sp-edit="${i}">Modifier</button>
        <button class="btn btn--danger btn--xs" data-sp-del="${i}">Supprimer</button>
      </div>
    </div>`).join("") : "<p class=\"adm-card\">Aucun sponsor pour le moment. En attendant, le bandeau de l'accueil fait défiler le logo du club.</p>";
}
$("#sponsors-admin").addEventListener("click", async e => {
  const ed = e.target.closest("[data-sp-edit]"), del = e.target.closest("[data-sp-del]");
  if (ed) openSponsorForm(+ed.dataset.spEdit);
  if (del) {
    const s = content.sponsors[+del.dataset.spDel];
    if (!confirm(`Supprimer le sponsor « ${s.nom} » ?`)) return;
    content.sponsors.splice(+del.dataset.spDel, 1);
    await save("Sponsor supprimé");
    renderSponsorsAdmin();
  }
});

/* Maillot */
function setMaillot(url) {
  content.maillot.image = url || "";
  const img = $("#maillot-preview");
  img.hidden = !url;
  if (url) img.src = url;
  $("#maillot-remove").hidden = !url;
}
function renderMaillot() {
  setMaillot(content.maillot.image);
  $("#maillot-texte").value = content.maillot.texte || "";
}
$("#maillot-img").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Envoi de la photo…");
  try { setMaillot(await uploadImage(file)); toast("Photo prête, cliquez sur « Enregistrer le maillot »"); }
  catch (ex) { toast("Échec de l'envoi : " + ex.message, true); }
  e.target.value = "";
});
$("#maillot-remove").addEventListener("click", () => setMaillot(""));
$("#maillot-save").addEventListener("click", async () => {
  content.maillot.texte = $("#maillot-texte").value.trim();
  await save("Maillot enregistré");
});

/* ---------- Démarrage ---------- */
if (token) start();
