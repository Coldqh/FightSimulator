#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const child = require('child_process');

const root = process.cwd();
const failures = [];
const warnings = [];

function rel(p) { return p.split(path.sep).join('/'); }
function abs(p) { return path.join(root, p); }
function exists(p) { return fs.existsSync(abs(p)); }
function read(p) { return fs.readFileSync(abs(p), 'utf8'); }
function fail(msg) { failures.push(msg); }
function warn(msg) { warnings.push(msg); }

function requiredFilesCheck() {
  [
    'index.html',
    'version.json',
    'sw.js',
    'src/data/game-data.js',
    'src/core/utils.js',
    'src/core/storage.js',
    'src/core/state.js',
    'src/core/clubs.js',
    'src/core/titles.js',
    'src/core/stories.js',
    'src/core/matchmaking.js',
    'src/core/amateur.js',
    'src/core/world.js',
    'src/core/fight.js',
    'src/ui/render.js',
    'src/app.js'
  ].forEach((file) => { if (!exists(file)) fail('missing required file: ' + file); });
}

function mojibakeCheck() {
  const files = ['src/data/game-data.js', 'src/ui/render.js', 'src/app.js', 'src/core/state.js', 'src/core/fight.js'];
  const patterns = [
    /\uFFFD/,
    /\u0420\u203A/,
    /\u0421\u040B/,
    /\u0420\u00B1/,
    /\u0420\u00B8/,
    /\u0421\u201A/,
    /\u0420\u00B5/,
    /\u0420\u00BB/,
    /\u0420\u00BD/,
    /\u0420\u00BE/,
    /\u0420\u00B0/,
    /\u0421\u0403/,
    /\u0421\u040C/
  ];
  files.forEach((file) => {
    if (!exists(file)) return;
    const text = read(file);
    if (patterns.some((rx) => rx.test(text))) fail('possible broken Cyrillic/mojibake in ' + file);
  });
}

function versionSyncCheck() {
  if (!exists('src/data/game-data.js') || !exists('version.json') || !exists('sw.js')) return;
  const dataText = read('src/data/game-data.js');
  const versionText = read('version.json');
  const swText = read('sw.js');
  const dataMatch = dataText.match(/"appVersion"\s*:\s*"([^"]+)"/);
  if (!dataMatch) { fail('appVersion not found in src/data/game-data.js'); return; }
  let versionJson;
  try { versionJson = JSON.parse(versionText); }
  catch (error) { fail('version.json is invalid JSON: ' + error.message); return; }
  if (!versionJson.version) fail('version.json version missing');
  if (!versionJson.cacheVersion) fail('version.json cacheVersion missing');
  if (versionJson.version && dataMatch[1] !== versionJson.version) {
    fail('version mismatch: game-data appVersion=' + dataMatch[1] + ', version.json=' + versionJson.version);
  }
  if (versionJson.cacheVersion && swText.indexOf(versionJson.cacheVersion) === -1) {
    fail('sw.js CACHE_VERSION does not include version.json cacheVersion');
  }
}

function collectJsFiles(dir, out) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectJsFiles(p, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(p);
  });
}

function syntaxCheck() {
  const files = [];
  collectJsFiles(abs('src'), files);
  ['sw.js', 'scripts/patch-check.cjs'].forEach((file) => { if (exists(file)) files.push(abs(file)); });
  files.forEach((file) => {
    try { child.execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
    catch (error) { fail('syntax error in ' + rel(path.relative(root, file)) + ': ' + String((error.stderr && error.stderr.toString()) || error.message).split('\n')[0]); }
  });
}

function indexOrderCheck() {
  if (!exists('index.html')) return;
  const html = read('index.html');
  const scripts = [];
  html.replace(/<script\s+src="([^"]+)"\s*>\s*<\/script>/g, (m, src) => { scripts.push(src); return m; });
  const required = [
    'src/data/game-data.js',
    'src/core/utils.js',
    'src/core/storage.js',
    'src/core/state.js',
    'src/core/clubs.js',
    'src/core/titles.js',
    'src/core/stories.js',
    'src/core/matchmaking.js',
    'src/core/amateur.js',
    'src/core/world.js',
    'src/core/fight.js',
    'src/ui/render.js',
    'src/app.js'
  ];
  required.forEach((file) => { if (scripts.indexOf(file) === -1) fail('index.html script missing: ' + file); });
  for (let i = 1; i < required.length; i += 1) {
    const prev = scripts.indexOf(required[i - 1]);
    const cur = scripts.indexOf(required[i]);
    if (prev !== -1 && cur !== -1 && cur < prev) fail('index.html script order broken near ' + required[i]);
  }
}

function exportCheck() {
  if (!exists('index.html')) return;
  const html = read('index.html');
  const scripts = [];
  html.replace(/<script\s+src="([^"]+)"\s*>\s*<\/script>/g, (m, src) => { if (src !== 'src/app.js') scripts.push(src); return m; });
  const context = {
    console,
    window: { FS: {} },
    Image: function Image() {},
    setTimeout: function () {},
    clearTimeout: function () {},
    localStorage: { getItem(){return null;}, setItem(){}, removeItem(){}, clear(){} },
    indexedDB: undefined,
    navigator: { onLine: true },
    document: { getElementById(){ return null; }, addEventListener(){}, body: { classList: { add(){}, remove(){} } } }
  };
  context.self = context.window;
  context.globalThis = context;
  vm.createContext(context);
  scripts.forEach((src) => {
    if (!exists(src)) return;
    try { vm.runInContext(read(src), context, { filename: src }); }
    catch (error) { fail('module load failed in ' + src + ': ' + error.message); }
  });
  const FS = context.window.FS || {};
  ['Data','Utils','Storage','State','Clubs','Titles','Stories','Matchmaking','Amateur','World','Fight','Render'].forEach((key) => {
    if (!FS[key]) fail('window.FS.' + key + ' was not exported');
  });
  if (FS.Render && typeof FS.Render.dashboard !== 'function') fail('window.FS.Render.dashboard is not a function');
}

function backupWarningCheck() {
  const names = fs.readdirSync(root);
  const matches = names.filter((name) => /^(apply-|fix-)|\.bak-|\.broken-|\.patch$/i.test(name) || name === 'patch-files' || name === '.patch_backups');
  if (matches.length) warn('local patch/backups present; do not commit these: ' + matches.slice(0, 12).join(', ') + (matches.length > 12 ? ' ...' : ''));
}

function main() {
  console.log('Fight Simulator patch check');
  console.log('root: ' + root);
  requiredFilesCheck();
  mojibakeCheck();
  versionSyncCheck();
  syntaxCheck();
  indexOrderCheck();
  exportCheck();
  backupWarningCheck();
  if (warnings.length) {
    console.log('\nWARNINGS:');
    warnings.forEach((msg) => console.log('- ' + msg));
  }
  if (failures.length) {
    console.error('\nFAILED:');
    failures.forEach((msg) => console.error('- ' + msg));
    process.exit(1);
  }
  console.log('\nPASS: patch safety checks passed.');
}

main();
