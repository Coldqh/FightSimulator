// Fight World 2.3.9 verifier
"use strict";
const fs = require("fs");

let bad = false;
function fail(text) { console.error("FAIL:", text); bad = true; }
function ok(text) { console.log("OK:", text); }
function read(path) { return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : ""; }

const index = read("index.html");
const data = read("src/data/game-data.js");
const app = read("src/app.js");
const sw = read("sw.js");
const reset = read("reset-cache.html");
const patch = read("src/patches/gameplay-update-fix-2.3.9.js");
const version = read("version.json");

if (/src\/patches\/gameplay-update-fix-2\.3\.9\.js/.test(index)) ok("index loads 2.3.9 patch"); else fail("index does not load 2.3.9 patch");
if (/appVersion\s*:\s*["']gameplay-update-fix-2\.3\.9["']/.test(data)) ok("game-data version is 2.3.9"); else fail("game-data version is not 2.3.9");
if (/saveSchemaVersion\s*:\s*239/.test(data)) ok("schema is 239"); else fail("schema is not 239");
if (/fromUpdateButton=2\.3\.9/.test(app) && !/fromUpdateButton=2\.3\.[0-8]/.test(app)) ok("app update button points to 2.3.9"); else fail("app update button still points to old version");
if (/gameplay-update-fix-2\.3\.9/.test(version)) ok("version.json is 2.3.9"); else fail("version.json is not 2.3.9");
if (/fight-simulator-gameplay-update-fix-2\.3\.9/.test(sw)) ok("service worker cache is 2.3.9"); else fail("service worker cache is not 2.3.9");
if (/index\.html\?cacheReset=2\.3\.9/.test(reset)) ok("reset page opens 2.3.9"); else fail("reset page does not open 2.3.9");
if (/rank-pill/.test(patch) && /fw-person-row/.test(patch) && /FWGameplayFix239/.test(patch)) ok("runtime UI patch is included"); else fail("runtime UI patch incomplete");

[
  "src/patches/root-cache-fix-2.3.5.js",
  "src/patches/root-cache-fix-2.3.6.js",
  "src/patches/update-button-hard-reset-2.3.7.js",
  "src/patches/gameplay-update-fix-2.3.8.js"
].forEach((path) => {
  if (fs.existsSync(path)) fail("old patch file still exists: " + path);
});

if (bad) process.exit(1);
console.log("VERIFICATION PASSED 2.3.9");
