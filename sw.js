/* Fight World service worker - 2.3.8 */
'use strict';
const CACHE_VERSION='fight-simulator-gameplay-update-fix-2.3.8';
const STATIC_CACHE=CACHE_VERSION+'-static';
const RUNTIME_CACHE=CACHE_VERSION+'-runtime';
const PRECACHE_URLS=['./','./index.html','./reset-cache.html','./manifest.webmanifest','./version.json','./src/styles.css','./src/data/game-data.js','./src/core/utils.js','./src/core/storage.js','./src/core/state.js','./src/core/clubs.js','./src/core/titles.js','./src/core/stories.js','./src/core/matchmaking.js','./src/core/amateur.js','./src/core/world.js','./src/core/fight.js','./src/ui/render.js','./src/patches/gameplay-update-fix-2.3.8.js','./src/app.js'];
function fc(k){const v=String(k||'').toLowerCase();return v.includes('fight')||v.includes('simulator')||v.startsWith('fw-')}
function clean(){return caches.keys().then(keys=>Promise.all(keys.map(k=>(k!==STATIC_CACHE&&k!==RUNTIME_CACHE&&fc(k))?caches.delete(k):false)))}
self.addEventListener('install',e=>e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(PRECACHE_URLS.map(u=>new Request(u,{cache:'reload'}))).catch(()=>undefined)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(clean().then(()=>self.clients.claim())));
function fresh(u){return u.pathname.endsWith('.html')||u.pathname.endsWith('.js')||u.pathname.endsWith('.css')||u.pathname.endsWith('version.json')||u.pathname.endsWith('manifest.webmanifest')}
async function nf(r){const c=await caches.open(RUNTIME_CACHE);try{const res=await fetch(new Request(r,{cache:'no-store'}));if(res&&res.ok)c.put(r,res.clone()).catch(()=>undefined);return res}catch(e){const cached=await c.match(r);if(cached)return cached;if(r.mode==='navigate')return caches.match('./index.html');throw e}}
async function cf(r){const cached=await caches.match(r);if(cached)return cached;const res=await fetch(r);if(res&&res.ok){const c=await caches.open(RUNTIME_CACHE);c.put(r,res.clone()).catch(()=>undefined)}return res}
self.addEventListener('fetch',e=>{const r=e.request;if(!r||r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;e.respondWith((r.mode==='navigate'||fresh(u))?nf(r):cf(r))});
self.addEventListener('message',e=>{if((e.data||{}).type==='SKIP_WAITING')self.skipWaiting();if((e.data||{}).type==='CLEAR_FIGHT_WORLD_CACHES')e.waitUntil(clean())});
