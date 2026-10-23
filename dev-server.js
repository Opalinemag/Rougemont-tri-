// Serveur de test en local (pas utilisé sur Vercel).
// Lancer :  npm run dev   puis ouvrir http://localhost:3000
// Connexion admin en local : ADMIN_USER / ADMIN_PASSWORD, sinon "admin" / "test-local".
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
process.env.ADMIN_USER ||= "admin";
process.env.ADMIN_PASSWORD ||= "test-local";

const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };
const API = Object.fromEntries(["login", "content", "upload"].map(n => ["/api/" + n, `./api/${n}.js`]));

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (API[url.pathname]) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    const { default: handler } = await import(API[url.pathname]);
    return handler(req, res);
  }
  if (url.pathname.startsWith("/uploads/") && url.pathname.endsWith(".json")) return res.writeHead(403).end(); // données privées
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Introuvable");
  }
}).listen(PORT, () => console.log("Site en local : http://localhost:" + PORT));
