// Verify Fight World FIGHT ROWS FIX 2.3.6
// Run from repository root:
//   node verify-fight-rows-2.3.6.cjs

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
const patch = read("src/patches/root-cache-fix-2.3.6.js");

if (exists("src/patches/root-cache-fix-2.3.6.js")) ok("root-cache-fix-2.3.6.js exists"); else fail("missing root-cache-fix-2.3.6.js");
if (exists("reset-cache.html")) ok("reset-cache.html exists"); else fail("missing reset-cache.html");

if (/src\/patches\/root-cache-fix-2\.3\.6\.js/.test(index)) ok("index.html loads root-cache-fix-2.3.6.js"); else fail("index.html does not load root-cache-fix-2.3.6.js");
if (/tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3|root-cache-fix-2\.3\.4|root-cache-fix-2\.3\.5/.test(index)) fail("index.html still has an old patch script"); else ok("index.html has no old patch scripts");

if (/appVersion\s*:\s*["']fight-rows-fix-2\.3\.6["']/.test(data)) ok("game-data.js appVersion is fight-rows-fix-2.3.6"); else fail("game-data.js appVersion is not fight-rows-fix-2.3.6");
if (/saveSchemaVersion\s*:\s*236/.test(data)) ok("game-data.js saveSchemaVersion is 236"); else fail("game-data.js saveSchemaVersion is not 236");

if (/fight-rows-fix-2\.3\.6/.test(versionJson)) ok("version.json is fight-rows-fix-2.3.6"); else fail("version.json is not fight-rows-fix-2.3.6");
if (/fight-simulator-fight-rows-fix-2\.3\.6/.test(sw)) ok("sw.js cache version is 2.3.6"); else fail("sw.js cache version is not 2.3.6");
if (/root-cache-fix-2\.3\.6\.js/.test(sw)) ok("sw.js precaches root-cache-fix-2.3.6.js"); else fail("sw.js does not precache root-cache-fix-2.3.6.js");

if (/FWFixFightRows236/.test(patch) && /fw-fight-row/.test(patch) && /data-preview-fight/.test(patch)) {
  ok("fight row renderer is included");
} else {
  fail("fight row renderer is missing");
}

[
  "src/patches/tournament-ui-hotfix-2.3.0.js",
  "src/patches/tournament-ui-layout-2.3.1.js",
  "src/patches/tournament-ui-layout-2.3.2.js",
  "src/patches/update-button-fix-2.3.2.js",
  "src/patches/hard-fix-2.3.3.js",
  "src/patches/root-cache-fix-2.3.4.js",
  "src/patches/root-cache-fix-2.3.5.js"
].forEach((rel) => {
  if (exists(rel)) fail("old patch file still exists: " + rel);
});
if (!bad) ok("old patch files are gone");

if (bad) {
  process.exitCode = 1;
  throw new Error("Verification failed: stale patch/cache tail or fight rows renderer missing.");
}

console.log("");
console.log("VERIFICATION PASSED: fight rows fix 2.3.6 is installed");
console.log("Clean local launch:");
console.log("  node start-clean-local-2.3.6.cjs");
