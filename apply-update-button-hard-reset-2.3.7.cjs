// Fight World UPDATE BUTTON HARD RESET 2.3.7
// Run from repository root:
//   node apply-update-button-hard-reset-2.3.7.cjs
"use strict";
const fs=require("fs"),path=require("path");
const VERSION="update-button-hard-reset-2.3.7",SCHEMA=237,ROOT=process.cwd(),PACK=__dirname;
function must(rel){const f=path.join(ROOT,rel);if(!fs.existsSync(f))throw new Error("Missing required path: "+rel+". Run this from the FightSimulator repository root.");return f}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),"utf8")}
function write(rel,text){fs.writeFileSync(path.join(ROOT,rel),text,"utf8")}
function copy(rel){const from=path.join(PACK,rel),to=path.join(ROOT,rel);fs.mkdirSync(path.dirname(to),{recursive:true});if(path.resolve(from)!==path.resolve(to))fs.copyFileSync(from,to)}
function rm(rel){const f=path.join(ROOT,rel);if(fs.existsSync(f)){fs.rmSync(f,{force:true});console.log("removed "+rel)}}
must("index.html");must("src");must("src/data/game-data.js");must("src/app.js");
console.log("== Remove old patch files ==");
["src/patches/tournament-ui-hotfix-2.3.0.js","src/patches/tournament-ui-layout-2.3.1.js","src/patches/tournament-ui-layout-2.3.2.js","src/patches/update-button-fix-2.3.2.js","src/patches/hard-fix-2.3.3.js","src/patches/root-cache-fix-2.3.4.js","src/patches/root-cache-fix-2.3.5.js","src/patches/root-cache-fix-2.3.6.js"].forEach(rm);
copy("src/patches/update-button-hard-reset-2.3.7.js");
console.log("== Patch index.html ==");
let index=read("index.html");
index=index.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g,"");
if(!/http-equiv=["']Cache-Control["']/i.test(index)){
  index=index.replace(/(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,'$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">');
}
const patchScript='  <script src="src/patches/update-button-hard-reset-2.3.7.js?v=2.3.7"></script>';
if(!index.includes(patchScript)){
  const re=/(\s*<script\s+src=["']src\/app\.js["']><\/script>)/i;
  if(!re.test(index))throw new Error("Could not find src/app.js script tag in index.html");
  index=index.replace(re,"\n"+patchScript+"$1");
}
write("index.html",index);
console.log("== Patch game-data.js ==");
let data=read("src/data/game-data.js");
if(!/appVersion\s*:/.test(data))throw new Error("game-data.js has no appVersion field");
if(!/saveSchemaVersion\s*:/.test(data))throw new Error("game-data.js has no saveSchemaVersion field");
data=data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/,`appVersion: "${VERSION}"`);
data=data.replace(/saveSchemaVersion\s*:\s*\d+/,`saveSchemaVersion: ${SCHEMA}`);
write("src/data/game-data.js",data);
console.log("== Patch app.js update button ==");
let app=read("src/app.js");
const fn=`function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function hardReload() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.3.7&t=" + Date.now());
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
if(/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/.test(app)){
  app=app.replace(/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/,fn+"\n\n  function checkRemoteVersion");
}else if(!app.includes("fromUpdateButton=2.3.7")){
  throw new Error("Could not patch applyUpdateNow() in src/app.js");
}
write("src/app.js",app);
console.log("== Copy root files ==");
["sw.js","reset-cache.html","version.json","verify-update-button-hard-reset-2.3.7.cjs","start-clean-local-2.3.7.cjs","README_UPDATE_BUTTON_FIX_2.3.7.md",".github/workflows/pages.yml",".nojekyll"].forEach(copy);
console.log("");
console.log("UPDATE BUTTON HARD RESET APPLIED: "+VERSION);
console.log("Run now:");
console.log("  node verify-update-button-hard-reset-2.3.7.cjs");
console.log("  node start-clean-local-2.3.7.cjs");
