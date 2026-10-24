// Diagnostic TEMPORAIRE du stockage (aucun secret affiché). À supprimer après usage.
export default async function handler(req, res) {
  const out = {
    blobStoreId: !!process.env.BLOB_STORE_ID,
    oidc: !!process.env.VERCEL_OIDC_TOKEN,
    readWriteToken: !!process.env.BLOB_READ_WRITE_TOKEN,
  };
  try {
    const { list, get, put, del } = await import("@vercel/blob");
    out.tousFichiers = (await list()).blobs.length;
    for (const access of ["public", "private"]) {
      try {
        const r = await put("diag/essai-" + Date.now() + ".json", "{}", { access, contentType: "application/json", addRandomSuffix: true });
        out["ecriture_" + access] = "ok " + new URL(r.url).host.replace(/^[^.]+\./, "*.");
        await del(r.url);
      } catch (e) {
        out["ecriture_" + access] = "erreur: " + e.message;
      }
    }
    const { blobs } = await list({ prefix: "donnees/" });
    out.fichiers = blobs.length;
    if (blobs.length) {
      const b = blobs.sort((a, c) => new Date(c.uploadedAt) - new Date(a.uploadedAt))[0];
      out.hote = new URL(b.url).host.replace(/^[^.]+\./, "*.");
      out.dernier = b.pathname;
      for (const access of ["public", "private"]) {
        try {
          const r = await get(b.pathname, { access, useCache: false });
          out["lecture_" + access] = r ? r.statusCode : "null";
        } catch (e) {
          out["lecture_" + access] = "erreur: " + e.message;
        }
      }
    }
  } catch (e) {
    out.erreur = e.message;
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(out);
}
