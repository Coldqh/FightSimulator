// Clean local static server for Fight World ROOT CACHE FIX 2.3.5
// Run from repository root:
//   node start-clean-local-2.3.5.cjs

"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const childProcess = require("child_process");

const HOST = "127.0.0.1";
const PORT = 5185;
const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, "index.html")) || !fs.existsSync(path.join(ROOT, "reset-cache.html"))) {
  throw new Error("Run this from the FightSimulator repository root after node apply-root-fix-2.3.5.cjs");
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safePath(urlPath) {
  let clean = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  if (clean === "/" || clean === "") clean = "/index.html";
  clean = clean.replace(/^\/+/, "");
  const full = path.resolve(ROOT, clean);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  try {
    const full = safePath(req.url || "/");
    if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("404");
      return;
    }

    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    fs.createReadStream(full).pipe(res);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    res.end(String(error && error.stack ? error.stack : error));
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/reset-cache.html?start=clean&t=${Date.now()}`;
  console.log("Clean Fight World local server:");
  console.log("  " + url);
  console.log("");
  console.log("This is a new origin, so localhost:5173 Service Worker cannot control it.");
  console.log("If localhost:5173 still shows 2.3.0, open once:");
  console.log("  http://localhost:5173/reset-cache.html");
  console.log("");
  console.log("Press Ctrl+C to stop.");

  if (process.platform === "win32") {
    childProcess.spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    childProcess.spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    childProcess.spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
});
