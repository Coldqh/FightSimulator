// Fight World FINAL VERSION FIX 2.3.9
// Run from repository root:
//   node apply-2.3.9-final.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PACK = __dirname;
const VERSION = "final-version-fix-2.3.9";
const SCHEMA = 239;
const PATCH = "src/patches/final-version-fix-2.3.9.js";

function mustExist(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    throw new Error("Missing required path: " + rel + ". Run this from the FightSimulator repository root.");
  }
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text, "utf8");
}

function copy(rel) {
  const from = path.join(PACK, rel);
  const to = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (path.resolve(from) !== path.resolve(to)) {
    fs.copyFileSync(from, to);
  }
}

function removeIfExists(rel) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { force: true, recursive: false });
    console.log("removed " + rel);
  }
}

mustExist("index.html");
mustExist("src/data/game-data.js");
mustExist("src/app.js");

console.log("== remove stale patch files ==");
[
  "src/patches/tournament-ui-hotfix-2.3.0.js",
  "src/patches/tournament-ui-layout-2.3.1.js",
  "src/patches/tournament-ui-layout-2.3.2.js",
  "src/patches/update-button-fix-2.3.2.js",
  "src/patches/hard-fix-2.3.3.js",
  "src/patches/root-cache-fix-2.3.4.js",
  "src/patches/root-cache-fix-2.3.5.js",
  "src/patches/root-cache-fix-2.3.6.js",
  "src/patches/update-button-hard-reset-2.3.7.js",
  "src/patches/gameplay-update-fix-2.3.8.js"
].forEach(removeIfExists);

copy(PATCH);

console.log("== patch index.html ==");
let index = read("index.html");
index = index.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g, "");

if (!/http-equiv=["']Cache-Control["']/i.test(index)) {
  index = index.replace(
    /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
    '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
  );
}

const patchScript = '  <script src="src/patches/final-version-fix-2.3.9.js?v=2.3.9"></script>';
if (!index.includes(patchScript)) {
  const appScript = /(\s*<script\s+src=["']src\/app\.js["']><\/script>)/i;
  if (!appScript.test(index)) {
    throw new Error("Could not find src/app.js script tag in index.html");
  }
  index = index.replace(appScript, "\n" + patchScript + "$1");
}

write("index.html", index);

console.log("== patch game-data.js ==");
let data = read("src/data/game-data.js");
data = data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/, `appVersion: "${VERSION}"`);
data = data.replace(/saveSchemaVersion\s*:\s*\d+/, `saveSchemaVersion: ${SCHEMA}`);
write("src/data/game-data.js", data);

console.log("== patch app.js update target ==");
let app = read("src/app.js");

const finalApplyUpdateNow = `function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function hardReload() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.3.9&target=2.3.9&t=" + Date.now());
    }

    function clearFightCaches() {
      if (!window.caches || !caches.keys) { return Promise.resolve(); }
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          var low = String(key || "").toLowerCase();
          if (low.indexOf("fight") !== -1 || low.indexOf("simulator") !== -1 || low.indexOf("fw-") === 0) {
            return caches.delete(key);
          }
          return false;
        }));
      });
    }

    function unregisterServiceWorkers() {
      if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) {
        return Promise.resolve();
      }
      return navigator.serviceWorker.getRegistrations().then(function (registrations) {
        return Promise.all(registrations.map(function (registration) {
          return registration.unregister();
        }));
      });
    }

    unregisterServiceWorkers()
      .then(clearFightCaches)
      .then(hardReload)
      .catch(hardReload);
  }`;

if (/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/.test(app)) {
  app = app.replace(/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/, finalApplyUpdateNow + "\n\n  function checkRemoteVersion");
} else {
  app = app.replace(/fromUpdateButton=\d+\.\d+\.\d+/g, "fromUpdateButton=2.3.9");
  app = app.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.3.9");
}

write("src/app.js", app);

console.log("== copy root files ==");
[
  "sw.js",
  "reset-cache.html",
  "version.json",
  "verify-2.3.9-final.cjs",
  "start-clean-local-2.3.9-final.cjs",
  "README_2.3.9_FINAL.md",
  ".github/workflows/pages.yml",
  ".nojekyll"
].forEach(copy);

console.log("");
console.log("APPLIED: " + VERSION);
console.log("Now run:");
console.log("  node verify-2.3.9-final.cjs");
console.log("  node start-clean-local-2.3.9-final.cjs");
