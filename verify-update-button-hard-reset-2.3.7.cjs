// Verify Fight World UPDATE BUTTON HARD RESET 2.3.7
"use strict";
const fs=require("fs"),path=require("path");let bad=false;
function fail(m){console.error("FAIL: "+m);bad=true} function ok(m){console.log("OK: "+m)}
function exists(rel){return fs.existsSync(path.join(process.cwd(),rel))}
function read(rel){const f=path.join(process.cwd(),rel);if(!fs.existsSync(f)){fail("missing file "+rel);return""}return fs.readFileSync(f,"utf8")}
const index=read("index.html"),data=read("src/data/game-data.js"),app=read("src/app.js"),sw=read("sw.js"),vj=read("version.json"),patch=read("src/patches/update-button-hard-reset-2.3.7.js");
if(exists("src/patches/update-button-hard-reset-2.3.7.js"))ok("update-button-hard-reset-2.3.7.js exists");else fail("missing update-button-hard-reset-2.3.7.js");
if(exists("reset-cache.html"))ok("reset-cache.html exists");else fail("missing reset-cache.html");
if(/src\/patches\/update-button-hard-reset-2\.3\.7\.js/.test(index))ok("index.html loads update-button-hard-reset-2.3.7.js");else fail("index.html does not load update-button-hard-reset-2.3.7.js");
if(/tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3|root-cache-fix-2\.3\.[456]/.test(index))fail("index.html still has old patch script");else ok("index.html has no old patch scripts");
if(/appVersion\s*:\s*["']update-button-hard-reset-2\.3\.7["']/.test(data))ok("game-data.js appVersion is 2.3.7");else fail("game-data.js appVersion is not 2.3.7");
if(/saveSchemaVersion\s*:\s*237/.test(data))ok("game-data.js saveSchemaVersion is 237");else fail("game-data.js saveSchemaVersion is not 237");
if(/fromUpdateButton=2\.3\.7/.test(app)&&/unregisterServiceWorkers/.test(app)&&/clearFightCaches/.test(app))ok("app.js update button does hard reset");else fail("app.js update button is not hard reset");
if(/update-button-hard-reset-2\.3\.7/.test(vj))ok("version.json is 2.3.7");else fail("version.json is not 2.3.7");
if(/fight-simulator-update-button-hard-reset-2\.3\.7/.test(sw))ok("sw.js cache version is 2.3.7");else fail("sw.js cache version is not 2.3.7");
if(/FWFix237/.test(patch)&&/FWHardUpdateNow237/.test(patch)&&/fw-fight-row/.test(patch)&&/data-preview-fight/.test(patch))ok("runtime patch includes hard update and fight rows");else fail("runtime patch incomplete");
["src/patches/tournament-ui-hotfix-2.3.0.js","src/patches/tournament-ui-layout-2.3.1.js","src/patches/tournament-ui-layout-2.3.2.js","src/patches/update-button-fix-2.3.2.js","src/patches/hard-fix-2.3.3.js","src/patches/root-cache-fix-2.3.4.js","src/patches/root-cache-fix-2.3.5.js","src/patches/root-cache-fix-2.3.6.js"].forEach(rel=>{if(exists(rel))fail("old patch file still exists: "+rel)});
if(bad){process.exitCode=1;throw new Error("Verification failed")}
console.log("");console.log("VERIFICATION PASSED: update button hard reset 2.3.7 is installed");
