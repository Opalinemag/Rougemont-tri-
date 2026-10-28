/* Rougemont Triathlon – fonctionnement du site.
   Il n'est pas nécessaire de modifier ce fichier : les contenus
   (horaires, actualités, photos, coordonnées) sont dans le dossier "donnees". */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const telHref = t => "tel:+33" + String(t).replace(/\D/g, "").replace(/^0/, "");

const ICONES = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17 5.8a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21 8.1c-.1-1.5-.4-2.9-1.5-4s-2.5-1.4-4-1.5C14 2.5 10 2.5 8.5 2.6c-1.5.1-2.9.4-4 1.5S3.1 6.6 3 8.1C2.9 9.6 2.9 14.4 3 15.9c.1 1.5.4 2.9 1.5 4s2.5 1.4 4 1.5c1.5.1 5.5.1 7 0 1.5-.1 2.9-.4 4-1.5s1.4-2.5 1.5-4c.1-1.5.1-6.3 0-7.8zm-2 9.6a3.2 3.2 0 0 1-1.8 1.8c-1.2.5-4.2.4-5.2.4s-4 .1-5.2-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.2-.4-4.2-.4-5.7s-.1-4.5.4-5.7A3.2 3.2 0 0 1 6.8 4.5C8 4 11 4.1 12 4.1s4-.1 5.2.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.2.4 4.2.4 5.7s.1 4.5-.4 5.7z"/></svg>',
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  lieu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
};

const reseaux = () => [
  ["facebook", "Facebook", CLUB.facebook],
  ["instagram", "Instagram", CLUB.instagram],
];

/* ---------- En-tête et pied de page (identiques sur toutes les pages) ---------- */
const PAGES = [
  ["index.html", "Accueil"],
  ["le-club.html", "Le club"],
  ["disciplines.html", "Nos disciplines"],
  ["entrainements.html", "Entraînements"],
  ["actualites.html", "Actualités"],
  ["partenaires.html", "Partenaires"],
  ["contact.html", "Contact"],
];
const PAGES_PIED = [...PAGES.slice(0, 5), ["rejoindre.html", "Rejoindre le club"], ["photos.html", "Photos"], ...PAGES.slice(5)];

function renderLayout() {
  const page = document.body.dataset.page;
  const socialLinks = cls => reseaux()
    .map(([k, label, url]) => `<a class="${cls}" href="${esc(url || "#")}" ${url ? 'target="_blank" rel="noopener"' : ""} aria-label="${label}" title="${label}">${ICONES[k]}</a>`)
    .join("");

  $("#site-header").innerHTML = `
    <div class="topbar">
      <div class="container topbar__inner">
        <span class="topbar__item">${ICONES.lieu}${esc(CLUB.ville)}</span>
        <a class="topbar__item" href="${telHref(CLUB.telephone)}">${ICONES.tel}${esc(CLUB.telephone)}</a>
        <a class="topbar__item topbar__mail" href="mailto:${esc(CLUB.email)}">${ICONES.mail}${esc(CLUB.email)}</a>
        <span class="topbar__social">${socialLinks("topbar__icon")}</span>
      </div>
    </div>
    <div class="mainbar">
      <div class="container mainbar__inner">
        <a href="index.html" class="brand">
          <img src="images/logo.png" alt="">
          <span><strong>Rougemont</strong><em>Triathlon</em></span>
        </a>
        <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
        <nav class="nav">
          ${PAGES.map(([href, label]) => `<a href="${href}"${href.startsWith(page) ? ' class="active" aria-current="page"' : ""}>${label}</a>`).join("")}
          <a href="rejoindre.html" class="btn btn--red btn--sm${page === "rejoindre" ? " is-active" : ""}">Rejoindre le club</a>
        </nav>
      </div>
    </div>`;

  $("#site-footer").innerHTML = `
    <div class="container footer__grid">
      <div>
        <img src="images/logo.png" alt="Rougemont Triathlon" class="footer__logo">
        <p>Le sport ensemble, l'aventure en équipe ! Duathlon, course à pied, vélo et Bike &amp; Run, avec une place privilégiée pour les jeunes.</p>
        <p class="footer__fftri">Club affilié à la Fédération Française de Triathlon (FFTri)</p>
      </div>
      <div>
        <h4>Le site</h4>
        <ul>${PAGES_PIED.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>${esc(CLUB.adresse)}</li>
          <li><a href="${telHref(CLUB.telephone)}">${esc(CLUB.telephone)}</a></li>
          <li><a href="mailto:${esc(CLUB.email)}">${esc(CLUB.email)}</a></li>
        </ul>
      </div>
      <div>
        <h4>Suivez-nous</h4>
        <div class="footer__social">${socialLinks("social")}</div>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© ${new Date().getFullYear()} ${esc(CLUB.nom)}</span>
      ${CLUB.credit ? `<span>${esc(CLUB.credit)}</span>` : ""}
      <a href="admin.html" class="admin-btn" rel="nofollow">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7zm3 9.7V18h-2v-1.3a1.5 1.5 0 1 1 2 0z"/></svg>
        Connexion administrateur
      </a>
    </div>`;

  const burger = $(".burger"), nav = $(".nav");
  burger.addEventListener("click", () => burger.setAttribute("aria-expanded", nav.classList.toggle("open")));

  // Blocs « réseaux sociaux » et coordonnées présents dans les pages
  document.querySelectorAll("[data-socials]").forEach(el => {
    el.innerHTML = reseaux().map(([k, label, url]) => `
      <a class="social-card" href="${esc(url || "#")}" ${url ? 'target="_blank" rel="noopener"' : ""}>
        <span class="social">${ICONES[k]}</span>
        <span><strong>${label}</strong><small>${url ? "Suivre le club" : "Bientôt disponible"}</small></span>
      </a>`).join("");
  });
  document.querySelectorAll("[data-club]").forEach(el => {
    const k = el.dataset.club;
    el.textContent = CLUB[k];
    if (k === "telephone") el.href = telHref(CLUB.telephone);
    if (k === "email") el.href = "mailto:" + CLUB.email;
  });
}

/* ---------- Visionneuse photos ---------- */
function lightbox() {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.innerHTML = '<button class="lightbox__close" aria-label="Fermer">×</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);
  const img = $("img", box), cap = $("figcaption", box);
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-zoom]");
    if (a) {
      e.preventDefault();
      img.src = a.getAttribute("href");
      cap.textContent = a.dataset.zoom;
      box.hidden = false;
    } else if (!box.hidden && e.target !== img) box.hidden = true;
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") box.hidden = true; });
}

/* ---------- Entraînements ---------- */
const ORDRE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const minutes = h => {
  const m = String(h || "").match(/(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : 0;
};
const isTrue = v => v === true || ["true", "oui", "x", "1", "annule"].includes(norm(v));
function prepareSessions(list) {
  return list
    .filter(s => s && s.jour)
    .map(s => ({ ...s, annule: isTrue(s.annule) }))
    .sort((a, b) => (ORDRE.indexOf(norm(a.jour)) - ORDRE.indexOf(norm(b.jour))) || minutes(a.debut) - minutes(b.debut));
}

// Encart affiché tant qu'aucun créneau n'est confirmé
const horairesAConfirmer = () => `
  <div class="horaires-vide">
    <strong>Les créneaux d'entraînement sont en cours de validation.</strong>
    <p>Contactez-nous pour connaître les horaires.</p>
    <div class="hero__actions">
      <a href="${telHref(CLUB.telephone)}" class="btn btn--red btn--sm">${esc(CLUB.telephone)}</a>
      <a href="mailto:${esc(CLUB.email)}" class="btn btn--outline btn--sm" style="text-transform:none">${esc(CLUB.email)}</a>
    </div>
  </div>`;

// Planning hebdomadaire, regroupé par jour
function renderTrainings(list, info) {
  const sessions = prepareSessions(list);
  document.querySelectorAll("[data-info]").forEach(el => { el.hidden = !info; el.textContent = info || ""; });

  const jours = [];
  sessions.forEach(s => {
    const j = jours.find(x => norm(x.jour) === norm(s.jour));
    j ? j.items.push(s) : jours.push({ jour: s.jour, items: [s] });
  });

  const html = !sessions.length
    ? horairesAConfirmer()
    : `<table class="planning">
        <thead><tr><th>Jour</th><th>Horaire</th><th>Groupe</th><th>Activité</th><th>Lieu</th></tr></thead>
        ${jours.map(j => `<tbody>${j.items.map((s, i) => `
          <tr class="${s.annule ? "is-cancel" : ""}">
            ${i === 0 ? `<th scope="rowgroup" rowspan="${j.items.length}" class="planning__day">${esc(j.jour)}</th>` : ""}
            <td class="planning__time" data-label="Horaire">${esc(s.debut)}${s.fin ? " – " + esc(s.fin) : ""}</td>
            <td data-label="Groupe"><strong>${esc(s.groupe)}</strong>${s.annule ? ' <span class="tag tag--red">Annulé</span>' : ""}</td>
            <td data-label="Activité">${esc(s.activite)}</td>
            <td data-label="Lieu">${esc(s.lieu)}${s.note ? `<small>${esc(s.note)}</small>` : ""}</td>
          </tr>`).join("")}</tbody>`).join("")}
      </table>`;
  document.querySelectorAll("[data-planning]").forEach(el => { el.innerHTML = html; });
}

// Contenu : celui de l'espace admin s'il existe, sinon les fichiers du dossier "donnees"
const DATA = {
  actualites: typeof ACTUALITES !== "undefined" ? ACTUALITES : null,
  albums: typeof ALBUMS !== "undefined" ? ALBUMS : null,
  entrainements: typeof ENTRAINEMENTS !== "undefined" ? ENTRAINEMENTS : null,
  info: typeof INFO_DU_MOMENT !== "undefined" ? INFO_DU_MOMENT : "",
  sponsors: typeof SPONSORS !== "undefined" ? SPONSORS : [],
  maillot: typeof MAILLOT !== "undefined" ? MAILLOT : {},
};
async function loadAdminContent() {
  try {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (!res.ok) return;
    const c = await res.json();
    if (Array.isArray(c.actualites)) DATA.actualites = c.actualites;
    if (Array.isArray(c.albums)) DATA.albums = c.albums;
    if (Array.isArray(c.sponsors)) DATA.sponsors = c.sponsors;
    if (c.maillot && typeof c.maillot === "object") DATA.maillot = c.maillot;
    if (Array.isArray(c.entrainements)) { DATA.entrainements = c.entrainements; DATA.info = c.info || ""; }
  } catch { /* pas de serveur : on garde les fichiers du dossier donnees */ }
}

function loadTrainings() {
  if (DATA.entrainements) renderTrainings(DATA.entrainements, DATA.info);
}

/* ---------- Actualités ---------- */
const slug = a => (a.date + "-" + norm(a.titre)).replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
const parseDate = str => {
  const m = String(str || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};
const dateLongue = d => { const x = parseDate(d); return x ? x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : d; };
const actusTriees = () => [...DATA.actualites].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

function newsCard(a) {
  return `
    <article class="news-card">
      <a href="actualites.html?a=${slug(a)}" class="news-card__img">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : ""}</a>
      <div class="news-card__body">
        <p class="meta"><span class="cat">${esc(a.categorie)}</span><time>${esc(dateLongue(a.date))}</time></p>
        <h3><a href="actualites.html?a=${slug(a)}">${esc(a.titre)}</a></h3>
        <p>${esc(a.resume)}</p>
        <a href="actualites.html?a=${slug(a)}" class="more">Lire la suite</a>
      </div>
    </article>`;
}

function renderNews() {
  if (!DATA.actualites) return;
  const latest = $("#news-latest");
  if (latest) latest.innerHTML = actusTriees().slice(0, 3).map(newsCard).join("");

  const list = $("#news-list");
  if (!list) return;
  const id = new URLSearchParams(location.search).get("a");
  const art = id && DATA.actualites.find(a => slug(a) === id);
  if (art) {
    document.title = art.titre + " – Rougemont Triathlon";
    $("#news-title").textContent = art.titre;
    $("#news-intro").innerHTML = `<span class="cat">${esc(art.categorie)}</span> ${esc(dateLongue(art.date))}`;
    list.className = "article";
    list.innerHTML = `
      ${art.image ? `<img src="${esc(art.image)}" alt="" class="article__img">` : ""}
      <div class="article__text">${(art.texte || []).map(p => `<p>${esc(p)}</p>`).join("")}</div>
      <a href="actualites.html" class="btn btn--outline">← Toutes les actualités</a>`;
  } else {
    list.innerHTML = actusTriees().map(newsCard).join("");
  }
}

/* ---------- Photos ---------- */
function renderPhotos() {
  if (!DATA.albums) return;
  const strip = $("#photo-strip");
  if (strip) {
    const all = DATA.albums.flatMap(al => al.photos).slice(0, 5);
    strip.innerHTML = all.map(p => `<a href="${esc(p.src)}" data-zoom="${esc(p.legende)}"><img src="${esc(p.src)}" alt="${esc(p.legende)}" loading="lazy"></a>`).join("");
  }
  const albums = $("#albums");
  if (!albums) return;
  albums.innerHTML = DATA.albums.map(al => `
    <section class="album">
      <div class="album__head"><h2>${esc(al.titre)}</h2><span>${esc(al.date)} · ${al.photos.length} photo${al.photos.length > 1 ? "s" : ""}</span></div>
      <div class="album__grid">
        ${al.photos.map(p => `
          <a href="${esc(p.src)}" data-zoom="${esc(p.legende)}" class="album__item">
            <img src="${esc(p.src)}" alt="${esc(p.legende)}" loading="lazy">
            <span>${esc(p.legende)}</span>
          </a>`).join("")}
      </div>
    </section>`).join("");
}

/* ---------- Sponsors ---------- */
function renderSponsors() {
  const sponsors = (DATA.sponsors || []).filter(s => s && (s.nom || s.logo));

  // Bandeau défilant : les logos des sponsors, ou le logo du club en attendant
  const band = $("[data-sponsor-band]");
  if (band) {
    const items = sponsors.length
      ? sponsors.map(s => `<a href="partenaires.html" class="marquee__item" title="${esc(s.nom)}">${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.nom)}">` : `<span>${esc(s.nom)}</span>`}</a>`)
      : [`<span class="marquee__item"><img src="images/logo.png" alt="Rougemont Triathlon"></span>`];
    // on répète les logos pour remplir la largeur, puis on double pour une boucle sans coupure
    let row = [];
    while (row.length < 10) row = row.concat(items);
    const half = row.join("");
    band.innerHTML = `<div class="marquee__track">${half}${half.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div>`;
  }

  const list = $("#sponsors-list");
  if (list) {
    list.innerHTML = sponsors.map(s => `
      <article class="sponsor-card">
        <div class="sponsor-card__logo">${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.nom)}" loading="lazy">` : `<span>${esc(s.nom)}</span>`}</div>
        <div class="sponsor-card__body">
          <h3>${esc(s.nom)}</h3>
          ${s.activite ? `<p class="cat">${esc(s.activite)}</p>` : ""}
          ${s.description ? `<p>${esc(s.description)}</p>` : ""}
          ${s.site ? `<a href="${esc(s.site)}" target="_blank" rel="noopener" class="more">Voir le site</a>` : ""}
        </div>
      </article>`).join("") + `
      <article class="sponsor-card sponsor-card--empty">
        <div class="sponsor-card__logo"><span>Votre logo ici</span></div>
        <div class="sponsor-card__body">
          <h3>${sponsors.length ? "Rejoignez nos partenaires" : "Nos premiers partenaires arrivent bientôt"}</h3>
          <p>Vous souhaitez soutenir un club de jeunes à Rougemont ? Appelez le <a href="${telHref(CLUB.telephone)}">${esc(CLUB.telephone)}</a> ou écrivez à <a href="mailto:${esc(CLUB.email)}">${esc(CLUB.email)}</a>.</p>
        </div>
      </article>`;
  }

  const maillot = $("#maillot");
  if (maillot) {
    const m = DATA.maillot || {};
    maillot.innerHTML = `
      <div class="prose">
        <span class="kicker">La tenue officielle</span>
        <h2>Le maillot du club</h2>
        <p>${esc(m.texte) || "Le maillot officiel du Rougemont Triathlon est en préparation, aux couleurs du club et de nos partenaires. Il sera dévoilé ici très prochainement."}</p>
      </div>
      <figure class="maillot">
        ${typeof THREE !== "undefined" ? `
          <div class="trifonction-3d" data-trifonction-3d aria-label="Trifonction du club en 3D"></div>
          <figcaption>La trifonction officielle du club.</figcaption>`
        : m.image ? `<img src="${esc(m.image)}" alt="Le maillot du Rougemont Triathlon">`
        : `<div class="maillot__empty"><img src="images/logo.png" alt=""><span>Maillot bientôt dévoilé</span></div>`}
      </figure>
      ${typeof THREE !== "undefined" && m.image ? `
      <figure class="maquettes">
        <a href="${esc(m.image)}" data-zoom="Maquettes de la tenue du club"><img src="${esc(m.image)}" alt="Maquettes à plat de la tenue : trifonction de face et de dos, et tee-shirt" loading="lazy"></a>
        <figcaption>Les maquettes à plat : trifonction (face et dos) et tee-shirt du club.</figcaption>
      </figure>` : ""}`;
    if (window.initTrifonction3D) window.initTrifonction3D();
  }
}

/* ---------- Formulaire de demande d'essai ----------
   La demande arrive directement dans la boîte mail du club (CLUB.email)
   grâce au service gratuit FormSubmit (formsubmit.co).
   La toute première fois, FormSubmit envoie un e-mail d'activation au
   club : il suffit de cliquer sur le lien qu'il contient. */
function contactForm() {
  const f = $("#contact-form");
  if (!f) return;
  const status = $(".form__status", f);
  const btn = $("button[type=submit]", f);
  const show = (msg, ok) => { status.hidden = false; status.className = "form__status " + (ok ? "is-ok" : "is-error"); status.textContent = msg; };

  f.addEventListener("submit", async e => {
    e.preventDefault();
    if (f._honey.value) return; // robot
    if (!f.telephone.value.trim() && !f.email.value.trim()) {
      show("Indiquez au moins un numéro de téléphone ou une adresse e-mail pour que le club puisse vous recontacter.", false);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Envoi en cours…";
    const rappel = f.rappel.value;
    const data = {
      "Nom": f.nom.value,
      "Objet": f.objet.value,
      "Âge de l'enfant": f.age.value || "—",
      "Téléphone": f.telephone.value || "—",
      "E-mail": f.email.value || "—",
      "À recontacter": rappel === "Par téléphone"
        ? "Par téléphone : appeler le " + (f.telephone.value || "(numéro non indiqué)")
        : "Par e-mail : répondre à " + (f.email.value || "(e-mail non indiqué)"),
      "Message": f.message.value || "—",
      _subject: `Site web : ${f.objet.value} – ${f.nom.value} (${rappel.toLowerCase()})`,
      _template: "table",
      _captcha: "false",
    };
    if (f.email.value) data._replyto = f.email.value;
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + CLUB.email.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== "true") throw new Error(json.message || res.status);
      f.reset();
      show(`Merci ! Votre demande a bien été envoyée. Le club vous recontactera ${rappel.toLowerCase()} très rapidement.`, true);
    } catch (err) {
      console.warn("Envoi du formulaire impossible", err);
      show(`L'envoi n'a pas fonctionné. Vous pouvez joindre le club directement au ${CLUB.telephone} ou à ${CLUB.email}.`, false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Envoyer la demande";
    }
  });
}

renderLayout();
lightbox();
contactForm();
loadAdminContent().then(() => {
  loadTrainings();
  renderNews();
  renderPhotos();
  renderSponsors();
});
