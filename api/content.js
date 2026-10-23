// GET  : contenu publié (lu par le site)
// POST : enregistrement depuis l'espace admin (connexion obligatoire)
import { readContent, writeContent } from "../lib/store.js";
import { isAuthorized } from "../lib/auth.js";

const asArray = v => (Array.isArray(v) ? v : []);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json((await readContent()) || {});
    }
    if (req.method === "POST") {
      if (!isAuthorized(req)) return res.status(401).json({ error: "Session expirée, reconnectez-vous." });
      const b = req.body || {};
      const content = {
        actualites: asArray(b.actualites),
        albums: asArray(b.albums),
        entrainements: asArray(b.entrainements),
        info: String(b.info || ""),
        sponsors: asArray(b.sponsors),
        maillot: { image: String(b.maillot?.image || ""), texte: String(b.maillot?.texte || "") },
        modifie: new Date().toISOString(),
      };
      await writeContent(content);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur du serveur : " + err.message });
  }
}
