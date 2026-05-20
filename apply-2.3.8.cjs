
'use strict';
const fs=require('fs'),path=require('path');const ROOT=process.cwd(),PACK=__dirname;
function read(p){return fs.readFileSync(path.join(ROOT,p),'utf8')}function write(p,s){fs.writeFileSync(path.join(ROOT,p),s,'utf8')}function copy(p){const a=path.join(PACK,p),b=path.join(ROOT,p);fs.mkdirSync(path.dirname(b),{recursive:true});if(path.resolve(a)!==path.resolve(b))fs.copyFileSync(a,b)}
if(!fs.existsSync(path.join(ROOT,'index.html'))||!fs.existsSync(path.join(ROOT,'src','data','game-data.js')))throw new Error('Run from FightSimulator root');
['tournament-ui-hotfix-2.3.0.js','tournament-ui-layout-2.3.1.js','tournament-ui-layout-2.3.2.js','update-button-fix-2.3.2.js','hard-fix-2.3.3.js','root-cache-fix-2.3.4.js','root-cache-fix-2.3.5.js','root-cache-fix-2.3.6.js','update-button-hard-reset-2.3.7.js'].forEach(f=>{const p=path.join(ROOT,'src','patches',f);if(fs.existsSync(p))fs.rmSync(p,{force:true});});
copy('src/patches/gameplay-update-fix-2.3.8.js');
let index=read('index.html');index=index.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g,'');if(!/Cache-Control/i.test(index))index=index.replace(/(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,'$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">');const tag='  <script src="src/patches/gameplay-update-fix-2.3.8.js?v=2.3.8"></script>';if(!index.includes(tag))index=index.replace(/(\s*<script\s+src=["']src\/app\.js["']><\/script>)/i,'\n'+tag+'$1');write('index.html',index);
let data=read('src/data/game-data.js');data=data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/,'appVersion: "gameplay-update-fix-2.3.8"');data=data.replace(/saveSchemaVersion\s*:\s*\d+/,'saveSchemaVersion: 238');write('src/data/game-data.js',data);
let app=read('src/app.js');const hard=`function applyUpdateNow() {
    updateReloading = true;
    persistNow();
    function go() { window.location.replace("./reset-cache.html?fromUpdateButton=2.3.8&t=" + Date.now()); }
    function clearFightCaches() { if (!window.caches || !caches.keys) { return Promise.resolve(); } return caches.keys().then(function (keys) { return Promise.all(keys.map(function (key) { var low = String(key || "").toLowerCase(); if (low.indexOf("fight") !== -1 || low.indexOf("simulator") !== -1 || low.indexOf("fw-") === 0) { return caches.delete(key); } return false; })); }); }
    function unregisterServiceWorkers() { if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) { return Promise.resolve(); } return navigator.serviceWorker.getRegistrations().then(function (registrations) { return Promise.all(registrations.map(function (registration) { return registration.unregister(); })); }); }
    unregisterServiceWorkers().then(clearFightCaches).then(go).catch(go);
  }`;app=app.replace(/function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/,hard+'\n\n  function checkRemoteVersion');write('src/app.js',app);
copy('sw.js');copy('reset-cache.html');copy('version.json');copy('verify-2.3.8.cjs');copy('start-clean-local-2.3.8.cjs');copy('README_2.3.8.md');console.log('Applied gameplay-update-fix-2.3.8');
