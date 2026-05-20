// Fight World 2.3.9 installer
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PACK = __dirname;

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

if (!fs.existsSync(path.join(ROOT, "index.html")) ||
    !fs.existsSync(path.join(ROOT, "src", "app.js")) ||
    !fs.existsSync(path.join(ROOT, "src", "data", "game-data.js"))) {
  throw new Error("Run from FightSimulator repository root.");
}

[
  "tournament-ui-hotfix-2.3.0.js",
  "tournament-ui-layout-2.3.1.js",
  "tournament-ui-layout-2.3.2.js",
  "update-button-fix-2.3.2.js",
  "hard-fix-2.3.3.js",
  "root-cache-fix-2.3.4.js",
  "root-cache-fix-2.3.5.js",
  "root-cache-fix-2.3.6.js",
  "update-button-hard-reset-2.3.7.js",
  "gameplay-update-fix-2.3.8.js"
].forEach((file) => {
  const full = path.join(ROOT, "src", "patches", file);
  if (fs.existsSync(full)) fs.rmSync(full, { force: true });
});

copy("src/patches/gameplay-update-fix-2.3.9.js");

let index = read("index.html");
index = index.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g, "");

if (!/http-equiv=["']Cache-Control["']/i.test(index)) {
  index = index.replace(
    /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
    '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
  );
}

const patchScript = '  <script src="src/patches/gameplay-update-fix-2.3.9.js?v=2.3.9"></script>';
if (!index.includes(patchScript)) {
  const appScriptRe = /(\s*<script\s+src=["']src\/app\.js["']><\/script>)/i;
  if (!appScriptRe.test(index)) throw new Error("Could not find src/app.js script tag in index.html.");
  index = index.replace(appScriptRe, "\n" + patchScript + "$1");
}
write("index.html", index);

let data = read("src/data/game-data.js");
data = data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/, 'appVersion: "gameplay-update-fix-2.3.9"');
data = data.replace(/saveSchemaVersion\s*:\s*\d+/, "saveSchemaVersion: 239");
write("src/data/game-data.js", data);

let app = read("src/app.js");
const newApplyUpdateNow = `function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function hardReload() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.3.9&t=" + Date.now());
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
  app = app.replace(/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/, newApplyUpdateNow + "\n\n  function checkRemoteVersion");
} else if (!app.includes("fromUpdateButton=2.3.9")) {
  throw new Error("Could not patch applyUpdateNow() in src/app.js.");
}

app = app.replace(/fromUpdateButton=2\.3\.[0-8]/g, "fromUpdateButton=2.3.9");
write("src/app.js", app);

copy("sw.js");
copy("reset-cache.html");
copy("version.json");
copy("verify-2.3.9.cjs");
copy("start-clean-local-2.3.9.cjs");
copy("README_2.3.9.md");
copy(".github/workflows/pages.yml");
copy(".nojekyll");

console.log("Applied gameplay-update-fix-2.3.9");
console.log("Run:");
console.log("  node verify-2.3.9.cjs");
console.log("  node start-clean-local-2.3.9.cjs");
