// Verify Fight World ROOT CACHE FIX 2.3.5
// Run from repository root:
//   node verify-root-fix-2.3.5.cjs

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
const sw = read("sw.js");
const versionJson = read("version.json");

if (exists("src/patches/root-cache-fix-2.3.5.js")) ok("root-cache-fix-2.3.5.js exists"); else fail("missing root-cache-fix-2.3.5.js");
if (exists("reset-cache.html")) ok("reset-cache.html exists"); else fail("missing reset-cache.html");

if (/src\/patches\/root-cache-fix-2\.3\.5\.js/.test(index)) ok("index.html loads root-cache-fix-2.3.5.js"); else fail("index.html does not load root-cache-fix-2.3.5.js");
if (/tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3|root-cache-fix-2\.3\.4/.test(index)) fail("index.html still has an old patch script"); else ok("index.html has no old patch scripts");

if (/appVersion\s*:\s*["']root-cache-fix-2\.3\.5["']/.test(data)) ok("game-data.js appVersion is root-cache-fix-2.3.5"); else fail("game-data.js appVersion is not root-cache-fix-2.3.5");
if (/saveSchemaVersion\s*:\s*235/.test(data)) ok("game-data.js saveSchemaVersion is 235"); else fail("game-data.js saveSchemaVersion is not 235");

if (/root-cache-fix-2\.3\.5/.test(versionJson)) ok("version.json is root-cache-fix-2.3.5"); else fail("version.json is not root-cache-fix-2.3.5");
if (/fight-simulator-root-cache-fix-2\.3\.5/.test(sw)) ok("sw.js cache version is 2.3.5"); else fail("sw.js cache version is not 2.3.5");
if (/root-cache-fix-2\.3\.5\.js/.test(sw)) ok("sw.js precaches root-cache-fix-2.3.5.js"); else fail("sw.js does not precache root-cache-fix-2.3.5.js");

[
  "src/patches/tournament-ui-hotfix-2.3.0.js",
  "src/patches/tournament-ui-layout-2.3.1.js",
  "src/patches/tournament-ui-layout-2.3.2.js",
  "src/patches/update-button-fix-2.3.2.js",
  "src/patches/hard-fix-2.3.3.js",
  "src/patches/root-cache-fix-2.3.4.js"
].forEach((rel) => {
  if (exists(rel)) fail("old patch file still exists: " + rel);
});
if (!bad) ok("old patch files are gone");

const operational = [
  "index.html",
  "sw.js",
  "version.json",
  "src/data/game-data.js",
  "src/patches/root-cache-fix-2.3.5.js"
];

const oldTokens = /tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3|root-cache-fix-2\.3\.4|fight-simulator-fatigue-mobile-layout-2\.2\.9/;

operational.forEach((rel) => {
  if (!exists(rel)) return;
  const text = read(rel);
  if (oldTokens.test(text)) {
    fail("operational file still contains old token: " + rel);
  }
});

if (bad) {
  process.exitCode = 1;
  throw new Error("Verification failed: stale 2.3.x or SW/cache tail still exists.");
}

console.log("");
console.log("VERIFICATION PASSED: source files are root-cache-fix-2.3.5");
console.log("Clean local launch:");
console.log("  node start-clean-local-2.3.5.cjs");
