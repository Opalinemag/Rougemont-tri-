// Connexion à l'espace administrateur.
// - Les comptes sont définis dans Vercel (projet rougemont-triathlon), jamais dans le code :
//     ADMIN_COMPTES = "nom.prenom:motdepasse;nom.prenom:motdepasse;..."
// - La clé qui signe les connexions est créée automatiquement la première fois et
//   rangée dans le stockage privé du site.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readJson, writeJson } from "./store.js";

const DUREE = 1000 * 60 * 60 * 8; // une connexion reste valable 8 heures

// On ne garde que les caractères utiles : un copier-coller peut ajouter des guillemets,
// des espaces ou des caractères invisibles, un téléphone une correction automatique.
const nettoyer = v => String(v || "").normalize("NFKC").replace(/[\r\n,]+/g, ";").replace(/[^A-Za-z0-9._:;@-]/g, "");

function comptes() {
  const liste = [];
  for (const morceau of nettoyer(process.env.ADMIN_COMPTES).split(";")) {
    const i = morceau.indexOf(":");
    if (i > 0) liste.push({ user: morceau.slice(0, i).toLowerCase(), password: morceau.slice(i + 1) });
  }
  return liste.filter(c => c.user && c.password);
}

export const comptesConfigures = () => comptes().length > 0;

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

// Clé de signature des connexions
let cle = null;
async function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (cle) return cle;
  const data = await readJson("cle-session");
  if (data?.cle) return (cle = data.cle);
  cle = randomBytes(32).toString("hex");
  await writeJson("cle-session", { cle });
  return cle;
}
const sign = async data => createHmac("sha256", await secret()).update(data).digest("base64url");

export async function createToken() {
  const exp = String(Date.now() + DUREE);
  return exp + "." + (await sign(exp));
}

export async function isAuthorized(req) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const [exp, sig] = token.split(".");
    return !!exp && !!sig && Number(exp) > Date.now() && same(sig, await sign(exp));
  } catch {
    return false;
  }
}

// Accès « pilote » par lien privé (admin.html#cle=...), sans identifiant.
// Seule l'empreinte de la clé est ici : la clé elle-même n'est que dans le lien
// transmis au bureau. Pour changer de lien : nouvelle clé, nouvelle empreinte.
const EMPREINTE_LIEN = "b7c1136e2fb4805cb189b29739237f9b3ee878d7d0c3547973a013bb371c07da";

export function checkLien(cle) {
  const k = nettoyer(cle);
  return !!k && same(createHash("sha256").update(k).digest("hex"), EMPREINTE_LIEN);
}
