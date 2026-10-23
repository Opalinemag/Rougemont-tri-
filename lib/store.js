// Stockage des données modifiables (contenu du site, photos ajoutées dans l'admin).
// En ligne (Vercel) : Vercel Blob. La connexion se fait soit par le nouveau mode
// automatique de Vercel (BLOB_STORE_ID + jeton OIDC), soit par l'ancienne clé
// BLOB_READ_WRITE_TOKEN. Le stockage doit être en accès PUBLIC.
// En local : simples fichiers dans le dossier "uploads".
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const blobConfigure = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const surVercel = () => !!process.env.VERCEL;
const LOCAL_DIR = path.join(process.cwd(), "uploads");
const prefixe = nom => `donnees/${nom}-`;

function useBlob() {
  if (blobConfigure()) return true;
  if (surVercel()) {
    throw new Error("Le stockage Vercel Blob n'est pas relié au projet (Stockage → Blob → Connecter, puis Redéployer).");
  }
  return false;
}

const blob = () => import("@vercel/blob");

// Lit la dernière version d'un fichier JSON (« site »…)
export async function readJson(nom) {
  if (useBlob()) {
    const { list, get } = await blob();
    const { blobs } = await list({ prefix: prefixe(nom) });
    if (!blobs.length) return null;
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const res = await get(latest.pathname, { access: "public", useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text());
  }
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, nom + ".json"), "utf8"));
  } catch {
    return null;
  }
}

export async function writeJson(nom, data) {
  const json = JSON.stringify(data);
  if (useBlob()) {
    const { put, list, del } = await blob();
    // Chaque sauvegarde a une adresse unique : pas de problème de cache.
    await put(prefixe(nom) + Date.now() + ".json", json, { access: "public", contentType: "application/json", addRandomSuffix: true });
    const { blobs } = await list({ prefix: prefixe(nom) });
    const old = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(5);
    if (old.length) await del(old.map(b => b.url)); // on garde les 5 dernières versions
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, nom + ".json"), json);
}

export const readContent = () => readJson("site");
export const writeContent = content => writeJson("site", content);

export async function saveImage(buffer, contentType) {
  const ext = contentType === "image/png" ? "png" : "jpg";
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  if (useBlob()) {
    const { put } = await blob();
    const res = await put("photos/" + name, buffer, { access: "public", contentType, addRandomSuffix: false });
    return res.url;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), buffer);
  return "/uploads/" + name;
}
