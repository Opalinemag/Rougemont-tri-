import { checkLogin, createToken } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "L'identifiant et le mot de passe administrateur ne sont pas encore configurés dans Vercel (ADMIN_USER et ADMIN_PASSWORD)." });
  }
  // petite pause pour ralentir les tentatives au hasard
  await new Promise(r => setTimeout(r, 600));
  if (!checkLogin(req.body?.user || "", req.body?.password || "")) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
  }
  res.status(200).json({ token: createToken() });
}
