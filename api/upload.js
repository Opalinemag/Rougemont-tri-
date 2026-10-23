// Envoi d'une photo depuis l'espace admin.
// La photo est réduite dans le navigateur avant l'envoi (max ~1600 px).
import { saveImage } from "../lib/store.js";
import { isAuthorized } from "../lib/auth.js";

const TYPES = ["image/jpeg", "image/png"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!isAuthorized(req)) return res.status(401).json({ error: "Session expirée, reconnectez-vous." });
  try {
    const { data, type } = req.body || {};
    if (!TYPES.includes(type) || typeof data !== "string") return res.status(400).json({ error: "Image invalide." });
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > 4 * 1024 * 1024) return res.status(413).json({ error: "Image trop lourde." });
    const url = await saveImage(buffer, type);
    res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi : " + err.message });
  }
}
