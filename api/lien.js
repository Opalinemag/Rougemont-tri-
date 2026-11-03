import { checkLien, createToken } from "../lib/auth.js";

// Connexion par le lien privé de l'espace administrateur
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  try {
    // petite pause pour ralentir les tentatives au hasard
    await new Promise(r => setTimeout(r, 600));
    if (!checkLien(req.body?.cle || "")) return res.status(401).json({ error: "Lien d'accès invalide." });
    res.status(200).json({ token: await createToken() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur du serveur : " + err.message });
  }
}
