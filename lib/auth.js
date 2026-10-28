// Connexion administrateur. Les comptes sont définis dans Vercel, jamais dans le code :
//   ADMIN_COMPTES = "arnaud:motdepasse1;melanie:motdepasse2;..."   (plusieurs comptes)
//   ou ADMIN_USER + ADMIN_PASSWORD                                (un seul compte)
// Les mots de passe ne doivent contenir ni « : » ni « ; ».
import { createHmac, timingSafeEqual } from "node:crypto";

const DUREE = 1000 * 60 * 60 * 8; // une connexion reste valable 8 heures

// On ne garde que les caractères utiles : un copier-coller peut ajouter des
// guillemets, des espaces, des retours à la ligne ou des caractères invisibles.
const nettoyer = v => String(v || "").normalize("NFKC").replace(/[\r\n,]+/g, ";").replace(/[^A-Za-z0-9._:;@-]/g, "");

function comptes() {
  const liste = [];
  for (const morceau of nettoyer(process.env.ADMIN_COMPTES).split(";")) {
    const i = morceau.indexOf(":");
    if (i > 0) liste.push({ user: morceau.slice(0, i).trim().toLowerCase(), password: morceau.slice(i + 1).trim() });
  }
  if (process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    liste.push({ user: process.env.ADMIN_USER.trim().toLowerCase(), password: process.env.ADMIN_PASSWORD });
  }
  return liste.filter(c => c.user && c.password);
}

export const comptesConfigures = () => comptes().length > 0;

const secret = () => {
  const c = comptes();
  if (!c.length) throw new Error("Aucun compte administrateur n'est configuré");
  return "rougemont-triathlon:" + c.map(x => x.user + ":" + x.password).join(";");
};
const sign = data => createHmac("sha256", secret()).update(data).digest("base64url");

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkLogin(user, password) {
  const u = nettoyer(user).toLowerCase();
  const p = nettoyer(password);
  let ok = false;
  // on compare avec tous les comptes pour ne pas révéler lequel existe
  for (const c of comptes()) if (same(u, c.user) & same(p, c.password)) ok = true;
  return ok;
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
