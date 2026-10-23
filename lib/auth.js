// Connexion administrateur : identifiant et mot de passe sont définis dans Vercel
// (variables d'environnement ADMIN_USER et ADMIN_PASSWORD), jamais dans le code.
import { createHmac, timingSafeEqual } from "node:crypto";

const DUREE = 1000 * 60 * 60 * 8; // une connexion reste valable 8 heures

const secret = () => {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD n'est pas configuré");
  return "rougemont-triathlon:" + (process.env.ADMIN_USER || "") + ":" + p;
};
const sign = data => createHmac("sha256", secret()).update(data).digest("base64url");

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkLogin(user, password) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD) return false;
  // on vérifie toujours les deux pour ne pas indiquer lequel est faux
  const okUser = same(String(user).trim().toLowerCase(), ADMIN_USER.trim().toLowerCase());
  const okPass = same(password, ADMIN_PASSWORD);
  return okUser && okPass;
}

export function createToken() {
  const exp = String(Date.now() + DUREE);
  return exp + "." + sign(exp);
}

export function isAuthorized(req) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const [exp, sig] = token.split(".");
    return !!exp && !!sig && Number(exp) > Date.now() && same(sig, sign(exp));
  } catch {
    return false;
  }
}
