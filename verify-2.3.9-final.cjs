// Verify Fight World FINAL VERSION FIX 2.3.9
// Run from repository root:
//   node verify-2.3.9-final.cjs

"use strict";

const fs = require("fs");
const path = require("path");

let bad = false;

function fail(message) {
  console.error("FAIL: " + message);
  bad = true;
}

function ok(message) {
  console.log("OK: " + message);
}

function exists(rel) {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel) {
  const full = path.join(process.cwd(), rel);
  if (!fs.existsSync(full)) {
    fail("missing file " + rel);
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

const index = read("index.html");
const data = read("src/data/game-data.js");
const app = read("src/app.js");
const sw = read("sw.js");
const versionJson = read("version.json");
const patch = read("src/patches/final-version-fix-2.3.9.js");

if (/src\/patches\/final-version-fix-2\.3\.9\.js/.test(index)) ok("index.html loads final 2.3.9 patch"); else fail("index.html does not load final 2.3.9 patch");
if (/appVersion\s*:\s*["']final-version-fix-2\.3\.9["']/.test(data)) ok("game-data appVersion is final-version-fix-2.3.9"); else fail("game-data appVersion is wrong");
if (/saveSchemaVersion\s*:\s*239/.test(data)) ok("schema is 239"); else fail("schema is not 239");
if (/fromUpdateButton=2\.3\.9/.test(app) && /target=2\.3\.9/.test(app)) ok("app.js update target is 2.3.9"); else fail("app.js update target is not 2.3.9");
if (/final-version-fix-2\.3\.9/.test(versionJson)) ok("version.json is 2.3.9"); else fail("version.json is not 2.3.9");
if (/fight-simulator-final-version-fix-2\.3\.9/.test(sw)) ok("sw cache version is 2.3.9"); else fail("sw cache version is not 2.3.9");
if (/final-version-fix-2\.3\.9\.js/.test(sw)) ok("sw precaches final 2.3.9 patch"); else fail("sw does not precache final patch");
if (/FWFinalFix239/.test(patch) && /rank-pill/.test(patch) && /fw-person-row/.test(patch)) ok("runtime UI fixes included"); else fail("runtime UI fixes missing");

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
].forEach((rel) => {
  if (exists(rel)) fail("old patch file still exists: " + rel);
});

const operational = [
  "index.html",
  "src/data/game-data.js",
  "src/app.js",
  "sw.js",
  "version.json",
  "src/patches/final-version-fix-2.3.9.js",
  "reset-cache.html"
];

const stale = /gameplay-update-fix-2\.3\.8|fromUpdateButton=2\.3\.8|fromUpdateButton=2\.3\.7|cacheReset=2\.3\.8|cacheReset=2\.3\.7|update-button-hard-reset-2\.3\.7|root-cache-fix-2\.3\.[456]|tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.[12]/;

operational.forEach((rel) => {
  const text = read(rel);
  if (stale.test(text)) {
    fail("stale version token in " + rel);
  }
});

if (bad) {
  process.exitCode = 1;
  throw new Error("Verification failed: final 2.3.9 is not clean.");
}

console.log("");
console.log("VERIFICATION PASSED 2.3.9 FINAL");
