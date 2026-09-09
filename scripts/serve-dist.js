// Minimal static server for local QA of dist/ (no deps). Usage: node scripts/serve-dist.js [port]
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "dist");
const port = Number(process.argv[2] || 8123);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".map": "application/json", ".txt": "text/plain" };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(root, urlPath === "/" ? "index.html" : urlPath.slice(1));
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) file = path.join(root, "index.html");
    fs.readFile(file, (e, data) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
}).listen(port, "127.0.0.1", () => console.log(`serve-dist on 127.0.0.1:${port}`));
