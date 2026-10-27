// Sert les photos ajoutées depuis l'admin (le stockage Vercel Blob est privé).
// Exemple : /api/media?p=photos/1792...-ab12cd34.jpg
import { readImage } from "../lib/store.js";

export default async function handler(req, res) {
  try {
    const p = String(new URL(req.url, "http://localhost").searchParams.get("p") || "");
    // seules les photos du site sont accessibles
    if (!/^photos\/[\w.-]+\.(jpg|png)$/.test(p)) return res.status(400).json({ error: "Photo invalide." });
    const img = await readImage(p);
    if (!img) return res.status(404).json({ error: "Photo introuvable." });
    res.setHeader("Content-Type", img.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).end(img.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur : " + err.message });
  }
}
