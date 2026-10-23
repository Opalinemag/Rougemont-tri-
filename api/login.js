import { checkLogin, comptesConfigures, createToken } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!comptesConfigures()) {
    return res.status(500).json({ error: "Aucun compte administrateur n'est encore configuré dans Vercel (ADMIN_COMPTES)." });
  }
  // petite pause pour ralentir les tentatives au hasard
  await new Promise(r => setTimeout(r, 600));
  if (!checkLogin(req.body?.user || "", req.body?.password || "")) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
  }
  res.status(200).json({ token: createToken() });
}
