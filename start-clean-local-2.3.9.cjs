// Clean local static server for Fight World 2.3.9
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const PORT = 5189;
const ROOT = process.cwd();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function safe(url) {
  let clean = decodeURIComponent(String(url || "/").split("?")[0]);
  if (clean === "/") clean = "/index.html";
  clean = clean.replace(/^\/+/, "");
  const full = path.resolve(ROOT, clean);
  return full.startsWith(ROOT) ? full : null;
}

http.createServer((req, res) => {
  const full = safe(req.url);
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { "Cache-Control": "no-store" });
    res.end("404");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(full).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  fs.createReadStream(full).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  const url = "http://127.0.0.1:" + PORT + "/reset-cache.html?t=" + Date.now();
  console.log(url);
  if (process.platform === "win32") {
    childProcess.spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  }
});
