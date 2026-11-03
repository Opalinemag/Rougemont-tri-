// Demandes envoyées depuis la page Contact.
// POST sans action       : nouvelle demande (public) → enregistrée, puis mail de notification si activé
// GET                    : liste des demandes (site pilote, connexion obligatoire)
// POST { action, ... }   : lu / supprimer / reglage / essai (site pilote, connexion obligatoire)
// La notification passe par Resend (gratuit) : sa clé est saisie dans le site pilote et
// rangée dans le stockage privé, jamais renvoyée au navigateur.
import { randomUUID } from "node:crypto";
import { readJson, writeJson, readContent } from "../lib/store.js";
import { isAuthorized } from "../lib/auth.js";

const MAX_DEMANDES = 300;
const EMAIL_CLUB = "rougemont.triathlon@outlook.fr";
const champ = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Limite simple contre les envois en rafale (par instance du serveur)
const recents = new Map();
function tropDEnvois(ip) {
  const maintenant = Date.now(), fenetre = 10 * 60 * 1000;
  const liste = (recents.get(ip) || []).filter(t => maintenant - t < fenetre);
  liste.push(maintenant);
  recents.set(ip, liste);
  return liste.length > 5;
}

const lireDemandes = async () => (await readJson("demandes"))?.demandes || [];
const ecrireDemandes = demandes => writeJson("demandes", { demandes: demandes.slice(0, MAX_DEMANDES) });

async function emailDuClub() {
  const c = await readContent().catch(() => null);
  return c?.club?.email || EMAIL_CLUB;
}

// Envoie le mail de notification ; renvoie un message d'erreur, ou "" si tout va bien
async function notifier(d, cle) {
  if (!cle) return "Notification non activée";
  const lignes = [
    ["Nom", d.nom], ["Objet", d.objet], ["Âge de l'enfant", d.age], ["Téléphone", d.telephone],
    ["E-mail", d.email], ["À recontacter", d.rappel], ["Message", d.message],
  ].filter(([, v]) => v);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Site Rougemont Triathlon <onboarding@resend.dev>",
      to: [await emailDuClub()],
      subject: `Nouvelle demande : ${d.objet} – ${d.nom}`,
      ...(d.email ? { reply_to: d.email } : {}),
      html: `<p>Nouvelle demande reçue sur le site du club :</p>
        <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${lignes.map(([k, v]) => `<tr><td style="font-weight:bold;color:#17306f;border-bottom:1px solid #e3e7ef">${esc(k)}</td><td style="border-bottom:1px solid #e3e7ef">${esc(v)}</td></tr>`).join("")}
        </table>
        <p>Toutes les demandes sont aussi dans le site pilote, onglet « Demandes ».</p>`,
    }),
  });
  if (res.ok) return "";
  const j = await res.json().catch(() => ({}));
  return j.message || "Erreur " + res.status;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const b = req.body || {};

    if (req.method === "GET" || (req.method === "POST" && b.action)) {
      if (!(await isAuthorized(req))) return res.status(401).json({ error: "Session expirée, rouvrez le site pilote avec votre lien." });
      const reglages = (await readJson("reglages-prives")) || {};

      if (req.method === "GET") {
        return res.status(200).json({ demandes: await lireDemandes(), notification: !!reglages.cleNotification, email: await emailDuClub() });
      }
      if (b.action === "lu" || b.action === "supprimer") {
        let demandes = await lireDemandes();
        demandes = b.action === "supprimer"
          ? demandes.filter(d => d.id !== b.id)
          : demandes.map(d => (d.id === b.id ? { ...d, lu: b.lu !== false } : d));
        await ecrireDemandes(demandes);
        return res.status(200).json({ ok: true });
      }
      if (b.action === "reglage") {
        await writeJson("reglages-prives", { ...reglages, cleNotification: champ(b.cleNotification, 200) });
        return res.status(200).json({ ok: true, notification: !!champ(b.cleNotification, 200) });
      }
      if (b.action === "essai") {
        const erreur = await notifier({ nom: "Essai du site pilote", objet: "Essai", message: "Si vous lisez ce mail, les notifications fonctionnent." }, reglages.cleNotification);
        return erreur ? res.status(400).json({ error: erreur }) : res.status(200).json({ ok: true, email: await emailDuClub() });
      }
      return res.status(400).json({ error: "Action inconnue" });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

    // ----- Nouvelle demande depuis la page Contact -----
    if (b._honey) return res.status(200).json({ ok: true }); // robot : on ignore
    const d = {
      id: randomUUID(),
      date: new Date().toISOString(),
      nom: champ(b.nom, 120),
      age: champ(b.age, 40),
      telephone: champ(b.telephone, 40),
      email: champ(b.email, 160),
      rappel: champ(b.rappel, 40),
      objet: champ(b.objet, 60) || "Demande",
      message: champ(b.message, 3000),
      lu: false,
    };
    if (!d.nom) return res.status(400).json({ error: "Indiquez votre nom." });
    if (!d.telephone && !d.email) return res.status(400).json({ error: "Indiquez un téléphone ou un e-mail." });
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
    if (tropDEnvois(ip)) return res.status(429).json({ error: "Trop de demandes envoyées, réessayez plus tard." });

    await ecrireDemandes([d, ...(await lireDemandes())]);
    // La demande est enregistrée : un échec de la notification ne doit pas la bloquer
    const reglages = (await readJson("reglages-prives")) || {};
    if (reglages.cleNotification) await notifier(d, reglages.cleNotification).catch(err => console.error("Notification", err));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur du serveur : " + err.message });
  }
}
