// Diagnostic TEMPORAIRE : uniquement des oui/non et un nombre, aucun identifiant
// ni mot de passe. À supprimer dès que la connexion fonctionne.
export default function handler(req, res) {
  const brut = String(process.env.ADMIN_COMPTES || "");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    adminComptesPresente: brut.length > 0,
    nombreDeComptes: brut.split(/[;\r\n,]+/).filter(m => m.includes(":")).length,
    stockageRelie: !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN),
  });
}
