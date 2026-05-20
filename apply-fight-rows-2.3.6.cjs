// Fight World FIGHT ROWS FIX 2.3.6
// Run from repository root:
//   node apply-fight-rows-2.3.6.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const VERSION = "fight-rows-fix-2.3.6";
const SCHEMA = 236;
const ROOT = process.cwd();
const PACK = __dirname;

function log(text) {
  console.log("== " + text + " ==");
}

function mustExist(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    throw new Error("Missing required path: " + rel + ". Run this from the FightSimulator repository root.");
  }
  return full;
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
mustExist("src");
mustExist(path.join("src", "data", "game-data.js"));

log("Remove old patch files");
[
  "src/patches/tournament-ui-hotfix-2.3.0.js",
  "src/patches/tournament-ui-layout-2.3.1.js",
  "src/patches/tournament-ui-layout-2.3.2.js",
  "src/patches/update-button-fix-2.3.2.js",
  "src/patches/hard-fix-2.3.3.js",
  "src/patches/root-cache-fix-2.3.4.js",
  "src/patches/root-cache-fix-2.3.5.js"
].forEach(removeIfExists);

copy("src/patches/root-cache-fix-2.3.6.js");

log("Patch index.html");
let index = read("index.html");

index = index.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g, "");

if (!/http-equiv=["']Cache-Control["']/i.test(index)) {
  index = index.replace(
    /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
    '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
  );
}

const patchScript = '  <script src="src/patches/root-cache-fix-2.3.6.js?v=2.3.6"></script>';
if (!index.includes(patchScript)) {
  const appScriptRe = /(\s*<script\s+src=["']src\/app\.js["']><\/script>)/i;
  if (!appScriptRe.test(index)) {
    throw new Error("Could not find src/app.js script tag in index.html");
  }
  index = index.replace(appScriptRe, "\n" + patchScript + "$1");
}

write("index.html", index);

log("Patch src/data/game-data.js");
let data = read(path.join("src", "data", "game-data.js"));

if (!/appVersion\s*:/.test(data)) {
  throw new Error("game-data.js has no appVersion field");
}
if (!/saveSchemaVersion\s*:/.test(data)) {
  throw new Error("game-data.js has no saveSchemaVersion field");
}

data = data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/, `appVersion: "${VERSION}"`);
data = data.replace(/saveSchemaVersion\s*:\s*\d+/, `saveSchemaVersion: ${SCHEMA}`);

write(path.join("src", "data", "game-data.js"), data);

log("Copy root files");
[
  "sw.js",
  "reset-cache.html",
  "version.json",
  "verify-fight-rows-2.3.6.cjs",
  "start-clean-local-2.3.6.cjs",
  "README_FIGHT_ROWS_2.3.6.md",
  ".github/workflows/pages.yml",
  ".nojekyll"
].forEach(copy);

console.log("");
console.log("FIGHT ROWS FIX APPLIED: " + VERSION);
console.log("");
console.log("Run now:");
console.log("  node verify-fight-rows-2.3.6.cjs");
console.log("  node start-clean-local-2.3.6.cjs");
console.log("");
console.log("Use this fresh local URL:");
console.log("  http://127.0.0.1:5186/reset-cache.html");
