// Stockage des données modifiables (contenu du site, comptes administrateurs).
// En ligne (Vercel) : Vercel Blob, activé quand BLOB_READ_WRITE_TOKEN existe.
// En local : simples fichiers dans le dossier "uploads".
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), "uploads");
const prefixe = nom => `donnees/${nom}-`;

// Lit la dernière version d'un fichier JSON (« site », « comptes »…)
export async function readJson(nom) {
  if (useBlob()) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: prefixe(nom) });
    if (!blobs.length) return null;
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const res = await fetch(latest.url, { cache: "no-store" });
    return res.ok ? res.json() : null;
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
    const { put, list, del } = await import("@vercel/blob");
    // Chaque sauvegarde a une adresse unique et imprévisible : pas de problème de cache.
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
    const { put } = await import("@vercel/blob");
    const blob = await put("photos/" + name, buffer, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), buffer);
  return "/uploads/" + name;
}
