// FightSimulator Gameplay Engagement Lite 2.8.1
// Adds safe lightweight engagement: rivalries, rematch offers, close-fight people/news,
// and small player career stats. Keeps monthly economy. Does not add medicine/equipment.
// Edits existing files only. Does not copy itself into the repo.

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const childProcess = require("child_process");

const REPO = process.env.FIGHTSIM_REPO || "C:\\FightSimulator_GitHub";
const VERSION = "gameplay-engagement-lite-2.8.1";
const SCHEMA = 281;

function full(rel) { return path.join(REPO, rel); }
function exists(rel) { return fs.existsSync(full(rel)); }
function read(rel) { return fs.readFileSync(full(rel), "utf8"); }
function write(rel, text) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), text, "utf8");
}

function backupRepo() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.resolve(REPO, "..", "FightSimulator_backup_before_2_8_1_" + stamp);
  fs.cpSync(REPO, backup, {
    recursive: true,
    filter: (src) => !src.includes(path.sep + ".git" + path.sep) && !src.endsWith(path.sep + ".git")
  });
  console.log("backup:", backup);
}

function nodeCheck(rel) {
  const result = childProcess.spawnSync(process.execPath, ["--check", full(rel)], {
    encoding: "utf8",
    shell: false
  });
  if (result.status !== 0) {
    console.error(result.stdout || "");
    console.error(result.stderr || "");
    throw new Error("node --check failed: " + rel);
  }
  console.log("node --check OK:", rel);
}

function findBraceRange(source, start, open) {
  let depth = 0, inString = null, inLineComment = false, inBlockComment = false, escaped = false;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i], next = source[i + 1];

    if (inLineComment) { if (ch === "\n") inLineComment = false; continue; }
    if (inBlockComment) { if (ch === "*" && next === "/") { inBlockComment = false; i += 1; } continue; }
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === inString) { inString = null; }
      continue;
    }

    if (ch === "/" && next === "/") { inLineComment = true; i += 1; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i += 1; continue; }
    if (ch === "\"" || ch === "'" || ch === "`") { inString = ch; continue; }

    if (ch === "{") { depth += 1; }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) { return { start, end: i + 1 }; }
    }
  }
  throw new Error("Close brace not found");
}

function findFunctionRange(source, functionName) {
  const marker = "function " + functionName + "(";
  const start = source.indexOf(marker);
  if (start === -1) { throw new Error("Function not found: " + functionName); }
  const open = source.indexOf("{", start);
  if (open === -1) { throw new Error("Open brace not found: " + functionName); }
  return findBraceRange(source, start, open);
}

function replaceFunction(source, functionName, replacement) {
  const range = findFunctionRange(source, functionName);
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}

function insertBeforeFunction(source, beforeFunction, text) {
  const marker = "function " + beforeFunction + "(";
  const idx = source.indexOf(marker);
  if (idx === -1) { throw new Error("Insert function marker not found: " + beforeFunction); }
  return source.slice(0, idx) + text + "\n\n  " + source.slice(idx);
}

function replaceOptional(source, oldText, newText) {
  return source.includes(oldText) ? source.split(oldText).join(newText) : source;
}

function loadDataObject(source) {
  const context = { console: console };
  context.window = context;
  context.window.FS = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "game-data.js" });
  if (!context.window.FS.Data) { throw new Error("window.FS.Data not found"); }
  return context.window.FS.Data;
}

function patchData() {
  console.log("\n== patch data.js ==");
  const rel = "src/data/game-data.js";
  const data = loadDataObject(read(rel));
  data.appVersion = VERSION;
  data.saveSchemaVersion = SCHEMA;
  write(rel,
    "/* FightSimulator core data */\n" +
    "(function () {\n" +
    "  \"use strict\";\n" +
    "  window.FS = window.FS || {};\n" +
    "  window.FS.Data = " + JSON.stringify(data, null, 2) + ";\n" +
    "}());\n"
  );
}

function patchWorld() {
  console.log("\n== patch world.js news tones ==");
  const rel = "src/core/world.js";
  let source = read(rel);

  source = replaceOptional(
    source,
    'var allowed = ["club", "team", "tournament", "medal", "champion", "migration"];',
    'var allowed = ["club", "team", "tournament", "medal", "champion", "migration", "fight", "career"];'
  );

  write(rel, source);
}

function patchClubs() {
  console.log("\n== patch clubs.js people helpers ==");
  const rel = "src/core/clubs.js";
  let source = read(rel);

  const rememberPlayerRival = `function rememberPlayerRival(state, opponent, note) {
    if (!state || !opponent || opponent.isPlayer) { return false; }
    rememberFighterPerson(state, opponent, "formerOpponent", note || ("Бывший соперник · " + U.findTrack(opponent.trackId).label));
    return true;
  }`;

  if (source.includes("function rememberPlayerRival(")) {
    source = replaceFunction(source, "rememberPlayerRival", rememberPlayerRival);
  } else {
    source = insertBeforeFunction(source, "rememberFightRelationship", rememberPlayerRival);
  }

  if (!source.includes("rememberPlayerRival: rememberPlayerRival")) {
    source = source.replace("rememberFightRelationship: rememberFightRelationship,", "rememberFightRelationship: rememberFightRelationship,\n    rememberPlayerRival: rememberPlayerRival,");
  }

  write(rel, source);
}

function patchFight() {
  console.log("\n== patch fight.js engagement events ==");
  const rel = "src/core/fight.js";
  let source = read(rel);

  const engagementHelpers = `function decisionMargin(scoreLine) {
    var match;
    if (!scoreLine) { return 99; }
    match = String(scoreLine).match(/(\\d+)\\s*:\\s*(\\d+)/);
    if (!match) { return 99; }
    return Math.abs((Number(match[1]) || 0) - (Number(match[2]) || 0));
  }

  function isCloseFight(result, method, scoreLine) {
    if (result === "Ничья") { return true; }
    if (method === "KO/TKO") { return false; }
    return decisionMargin(scoreLine) <= 2;
  }

  function safeCreateFightNews(state, text, meta) {
    if (window.FS.World && window.FS.World.createNews) {
      window.FS.World.createNews(state, "fight", text, meta || {});
    }
  }

  function updatePlayerCareerStats(state, p, opponent, result, method) {
    var stats;
    var playerOvr;
    var opponentOvr;
    if (!p || !opponent) { return; }
    p.careerStats = p.careerStats && typeof p.careerStats === "object" ? p.careerStats : {};
    stats = p.careerStats;
    playerOvr = U.statAverage(p.stats);
    opponentOvr = U.statAverage(opponent.stats);

    stats.bestWinStreak = Number(stats.bestWinStreak) || 0;
    stats.currentWinStreak = Number(stats.currentWinStreak) || 0;
    stats.currentLossStreak = Number(stats.currentLossStreak) || 0;
    stats.rematchWins = Number(stats.rematchWins) || 0;
    stats.rematchLosses = Number(stats.rematchLosses) || 0;
    stats.rematchDraws = Number(stats.rematchDraws) || 0;
    stats.strongerWins = Number(stats.strongerWins) || 0;
    stats.bestDefeatedOvr = Number(stats.bestDefeatedOvr) || 0;
    stats.lastFightResult = result;
    stats.lastFightMethod = method;
    stats.lastFightWeek = state.week;

    if (result === "Победа") {
      stats.currentWinStreak += 1;
      stats.currentLossStreak = 0;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
      if (opponentOvr > playerOvr) {
        stats.strongerWins += 1;
        stats.bestDefeatedOvr = Math.max(stats.bestDefeatedOvr, opponentOvr);
      }
    } else if (result === "Поражение") {
      stats.currentLossStreak += 1;
      stats.currentWinStreak = 0;
    } else {
      stats.currentWinStreak = 0;
      stats.currentLossStreak = 0;
    }
  }

  function updatePlayerRivalry(state, p, opponent, result, method, scoreLine) {
    var rivalries;
    var key;
    var item;
    var close;
    var playerOvr;
    var opponentOvr;
    var note;
    if (!state || !p || !opponent || opponent.isPlayer) { return; }

    state.world = state.world && typeof state.world === "object" ? state.world : {};
    rivalries = state.world.playerRivalries && typeof state.world.playerRivalries === "object" ? state.world.playerRivalries : {};
    state.world.playerRivalries = rivalries;

    key = opponent.id;
    item = rivalries[key] || {
      opponentId: opponent.id,
      trackId: opponent.trackId,
      firstWeek: state.week,
      fights: 0,
      playerWins: 0,
      opponentWins: 0,
      draws: 0,
      closeFights: 0,
      rematchWeek: 0
    };

    close = isCloseFight(result, method, scoreLine);
    playerOvr = U.statAverage(p.stats);
    opponentOvr = U.statAverage(opponent.stats);

    item.fights += 1;
    item.lastWeek = state.week;
    item.lastResult = result;
    item.lastMethod = method;
    item.lastScoreLine = scoreLine || "";
    item.lastPlayerOvr = playerOvr;
    item.lastOpponentOvr = opponentOvr;

    if (result === "Победа") { item.playerWins += 1; }
    else if (result === "Поражение") { item.opponentWins += 1; }
    else { item.draws += 1; }

    if (close) { item.closeFights += 1; }

    if ((close || item.fights >= 2) && p.trackId !== "pro") {
      item.rematchWeek = state.week + U.randomInt(4, 8);
    }

    rivalries[key] = item;

    if (close || item.fights >= 2) {
      note = item.fights >= 2 ?
        ("Реванш · счёт " + item.playerWins + "-" + item.opponentWins + "-" + item.draws) :
        ("Близкий бой · реванш возможен");
      if (window.FS.Clubs && window.FS.Clubs.rememberPlayerRival) {
        window.FS.Clubs.rememberPlayerRival(state, opponent, note);
      }
    }

    if (close) {
      safeCreateFightNews(state, "Близкий бой: " + p.name + " — " + opponent.name + " · " + result + " (" + (scoreLine || method) + ").", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (item.fights === 2) {
      safeCreateFightNews(state, "Реванш: " + p.name + " снова встретился с " + opponent.name + ". Счёт серии " + item.playerWins + "-" + item.opponentWins + "-" + item.draws + ".", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (result === "Победа" && opponentOvr >= playerOvr + 6) {
      safeCreateFightNews(state, "Апсет: " + p.name + " победил соперника выше себя — " + opponent.name + " · OVR " + opponentOvr + ".", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (p.careerStats && p.careerStats.currentWinStreak && p.careerStats.currentWinStreak >= 3 && [3, 5, 8, 12].indexOf(p.careerStats.currentWinStreak) !== -1) {
      safeCreateFightNews(state, "Серия побед: " + p.name + " выиграл " + p.careerStats.currentWinStreak + " боя подряд.", { fighterId: p.id });
    }
  }

  function recordPlayerEngagement(state, p, opponent, result, method, scoreLine) {
    updatePlayerCareerStats(state, p, opponent, result, method);
    updatePlayerRivalry(state, p, opponent, result, method, scoreLine);
  }`;

  if (source.includes("function recordPlayerEngagement(")) {
    source = replaceFunction(source, "decisionMargin", engagementHelpers.match(/function decisionMargin[\s\S]*?function applyFightResult/));
  } else {
    source = insertBeforeFunction(source, "applyFightResult", engagementHelpers);
  }

  const applyFightResult = `function applyFightResult(state, p, opponent, result, method, scoreLine) {
    var oppLine;
    if (!p || !opponent) { return false; }
    p.record = p.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
    opponent.record = opponent.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
    p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
    opponent.careerLog = opponent.careerLog instanceof Array ? opponent.careerLog : [];
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.world = state.world && typeof state.world === "object" ? state.world : {};

    if (result === "Ничья") {
      p.record.draws = (Number(p.record.draws) || 0) + 1;
      opponent.record.draws = (Number(opponent.record.draws) || 0) + 1;
      oppLine = "Ничья с " + p.name + " решением.";
    } else if (result === "Победа") {
      p.record.wins = (Number(p.record.wins) || 0) + 1;
      opponent.record.losses = (Number(opponent.record.losses) || 0) + 1;
      if (method === "KO/TKO") { p.record.kos = (Number(p.record.kos) || 0) + 1; }
      oppLine = "Поражение от " + p.name + " " + (method === "KO/TKO" ? "KO/TKO." : "решением.");
    } else {
      p.record.losses = (Number(p.record.losses) || 0) + 1;
      opponent.record.wins = (Number(opponent.record.wins) || 0) + 1;
      if (method === "KO/TKO") { opponent.record.kos = (Number(opponent.record.kos) || 0) + 1; }
      oppLine = "Победа над " + p.name + " " + (method === "KO/TKO" ? "KO/TKO." : "решением.");
    }

    if (p.trackRecords) { p.trackRecords[p.trackId] = window.FS.State.cloneRecord(p.record); }
    if (opponent.trackRecords) { opponent.trackRecords[opponent.trackId] = window.FS.State.cloneRecord(opponent.record); }

    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);

    p.recentOpponentIds = p.recentOpponentIds instanceof Array ? p.recentOpponentIds : [];
    opponent.recentOpponentIds = opponent.recentOpponentIds instanceof Array ? opponent.recentOpponentIds : [];
    p.recentOpponentIds.unshift(opponent.id);
    opponent.recentOpponentIds.unshift(p.id);
    if (p.recentOpponentIds.length > 8) { p.recentOpponentIds.length = 8; }
    if (opponent.recentOpponentIds.length > 8) { opponent.recentOpponentIds.length = 8; }

    recordPlayerEngagement(state, p, opponent, result, method, scoreLine || "");

    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      if (result === "Ничья") { window.FS.Clubs.recordClubFight(state, p, opponent, true); }
      else { window.FS.Clubs.recordClubFight(state, result === "Победа" ? p : opponent, result === "Победа" ? opponent : p, false); }
    }
    if (window.FS.Clubs && window.FS.Clubs.rememberFightRelationship) { window.FS.Clubs.rememberFightRelationship(state, opponent); }
    if (window.FS.Clubs && window.FS.Clubs.syncCoachRecords) { window.FS.Clubs.syncCoachRecords(state); }
    if (State.invalidateCaches) { State.invalidateCaches(state); }
    return true;
  }`;

  source = replaceFunction(source, "applyFightResult", applyFightResult);

  source = replaceOptional(source,
    "applyFightResult(state, p, opponent, result, method);\n    completeFightEconomy(state, p, opponent, result, session.purse || (p.contractPurse || 0));",
    "applyFightResult(state, p, opponent, result, method, scoreLine);\n    completeFightEconomy(state, p, opponent, result, session.purse || (p.contractPurse || 0));"
  );

  source = replaceOptional(source,
    "applyFightResult(state, p, opponent, result, method);\n    completeFightEconomy(state, p, opponent, result, purse, Data.economy",
    "applyFightResult(state, p, opponent, result, method, scoreLine);\n    completeFightEconomy(state, p, opponent, result, purse, Data.economy"
  );

  write(rel, source);
}

function patchMatchmaking() {
  console.log("\n== patch matchmaking.js rematch offers ==");
  const rel = "src/core/matchmaking.js";
  let source = read(rel);

  const rematchHelpers = `function findDueRematchOpponent(state, player, used) {
    var rivalries = state.world && state.world.playerRivalries ? state.world.playerRivalries : {};
    var playerOvr = U.statAverage(player.stats);
    var entries = [];
    var key;
    var item;
    var opponent;
    for (key in rivalries) {
      if (!Object.prototype.hasOwnProperty.call(rivalries, key)) { continue; }
      item = rivalries[key];
      if (!item || !item.opponentId || used[item.opponentId]) { continue; }
      if (item.trackId !== player.trackId) { continue; }
      if (!item.rematchWeek || item.rematchWeek > state.week) { continue; }
      opponent = U.getFighterById(state, item.opponentId);
      if (!opponent || opponent.retired || opponent.trackId !== player.trackId) { continue; }
      if (player.trackId !== "street" && opponent.weightClassId !== player.weightClassId) { continue; }
      if ((player.trackId === "amateur" || player.trackId === "street") && Math.abs(U.statAverage(opponent.stats) - playerOvr) > 10) { continue; }
      if (opponent.lastFightWeek && state.week - opponent.lastFightWeek < 3) { continue; }
      entries.push({ opponent: opponent, rivalry: item });
    }

    entries.sort(function (left, right) {
      return (Number(right.rivalry.closeFights) || 0) - (Number(left.rivalry.closeFights) || 0) ||
        (Number(right.rivalry.lastWeek) || 0) - (Number(left.rivalry.lastWeek) || 0);
    });

    return entries.length ? entries[0].opponent : null;
  }`;

  if (source.includes("function findDueRematchOpponent(")) {
    source = replaceFunction(source, "findDueRematchOpponent", rematchHelpers.replace(/^function findDueRematchOpponent/, "function findDueRematchOpponent"));
  } else {
    source = insertBeforeFunction(source, "buildPlayerOffers", rematchHelpers);
  }

  const buildPlayerOffers = `function buildPlayerOffers(state) {
    var player = State.player(state);
    var track = U.findTrack(player.trackId);
    var offers = [];
    var used = {};
    var i;
    var opponent;
    var rematch;

    if (player.trackId === "pro") {
      return [];
    }

    rematch = findDueRematchOpponent(state, player, used);
    if (rematch) {
      used[rematch.id] = true;
      offers.push({
        id: U.uid("offer"),
        label: "Реванш",
        difficultyId: "even",
        opponentId: rematch.id,
        rounds: track.rounds,
        purse: window.FS.Fight && window.FS.Fight.computePurse ? window.FS.Fight.computePurse(player, rematch) : Math.max(25, U.statAverage(rematch.stats) * 5),
        opponentTier: careerTier(rematch).label,
        opponentStage: careerStage(rematch).label,
        risk: Math.max(1, U.statAverage(rematch.stats) - U.statAverage(player.stats) + 50),
        isRematch: true
      });
    }

    for (i = offers.length; i < 10; i += 1) {
      opponent = findOpponent(state, "even", i, used);

      offers.push({
        id: U.uid("offer"),
        label: "Бой",
        difficultyId: "even",
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: window.FS.Fight && window.FS.Fight.computePurse ? window.FS.Fight.computePurse(player, opponent) : Math.max(25, U.statAverage(opponent.stats) * 5),
        opponentTier: careerTier(opponent).label,
        opponentStage: careerStage(opponent).label,
        risk: Math.max(1, U.statAverage(opponent.stats) - U.statAverage(player.stats) + 50)
      });
    }

    return offers;
  }`;

  source = replaceFunction(source, "buildPlayerOffers", buildPlayerOffers);

  write(rel, source);
}

function patchVersions() {
  console.log("\n== patch version files ==");
  if (exists("version.json")) {
    write("version.json", JSON.stringify({
      version: VERSION,
      mode: "gameplay-engagement-lite",
      cacheVersion: "fight-simulator-gameplay-engagement-lite-2.8.1",
      resetPage: "reset-cache.html",
      localCleanPort: 5189
    }, null, 2) + "\n");
  }

  if (exists("sw.js")) {
    let sw = read("sw.js");
    sw = sw.replace(/const CACHE_VERSION = "[^"]*";/, 'const CACHE_VERSION = "fight-simulator-gameplay-engagement-lite-2.8.1";');
    write("sw.js", sw);
  }

  if (exists("reset-cache.html")) {
    let html = read("reset-cache.html");
    html = html.replace(/cacheReset=\d+\.\d+\.\d+(\.\d+)?/g, "cacheReset=2.8.1");
    write("reset-cache.html", html);
  }

  if (exists("src/app.js")) {
    let app = read("src/app.js");
    app = app.replace(/fromUpdateButton=\d+\.\d+\.\d+(\.\d+)?/g, "fromUpdateButton=2.8.1");
    app = app.replace(/target=\d+\.\d+\.\d+(\.\d+)?/g, "target=2.8.1");
    app = app.replace(/cacheReset=\d+\.\d+\.\d+(\.\d+)?/g, "cacheReset=2.8.1");
    write("src/app.js", app);
  }
}

function auditDeadFields() {
  console.log("\n== dead field audit ==");
  var needles = ["equipment", "medicine", "medical", "injury", "injuries"];
  var files = ["src/data/game-data.js", "src/core/state.js", "src/core/world.js", "src/core/fight.js", "src/core/storage.js", "src/ui/render.js", "src/app.js"];
  var hits = [];
  files.forEach(function (rel) {
    if (!exists(rel)) { return; }
    var text = read(rel);
    needles.forEach(function (needle) {
      if (text.indexOf(needle) !== -1) { hits.push(rel + ":" + needle); }
    });
  });
  if (hits.length) {
    console.log("found dead-field candidates, left untouched for manual review:", hits.join(", "));
  } else {
    console.log("no medicine/equipment fields found in checked core files");
  }
}

function verify() {
  console.log("\n== verify ==");
  const data = read("src/data/game-data.js");
  const world = read("src/core/world.js");
  const clubs = read("src/core/clubs.js");
  const fight = read("src/core/fight.js");
  const matchmaking = read("src/core/matchmaking.js");
  const errors = [];

  if (!data.includes('"appVersion": "' + VERSION + '"')) { errors.push("data version not updated"); }
  if (!world.includes('"fight", "career"')) { errors.push("fight/career news tones missing"); }
  if (!clubs.includes("rememberPlayerRival: rememberPlayerRival")) { errors.push("rememberPlayerRival not exported"); }
  if (!fight.includes("function recordPlayerEngagement(")) { errors.push("fight engagement helper missing"); }
  if (!fight.includes("state.world.playerRivalries")) { errors.push("player rivalry state missing"); }
  if (!fight.includes("applyFightResult(state, p, opponent, result, method, scoreLine)")) { errors.push("scoreLine not passed to fight result"); }
  if (!matchmaking.includes("function findDueRematchOpponent(")) { errors.push("rematch finder missing"); }
  if (!matchmaking.includes('label: "Реванш"')) { errors.push("rematch offer missing"); }

  if (errors.length) { throw new Error(errors.join("\n")); }
  console.log("verification OK");
}

function smokeSyntax() {
  [
    "src/data/game-data.js",
    "src/core/world.js",
    "src/core/clubs.js",
    "src/core/fight.js",
    "src/core/matchmaking.js",
    "src/app.js"
  ].forEach(function (rel) {
    if (exists(rel)) { nodeCheck(rel); }
  });
}

function main() {
  [
    "src/data/game-data.js",
    "src/core/world.js",
    "src/core/clubs.js",
    "src/core/fight.js",
    "src/core/matchmaking.js"
  ].forEach(function (rel) {
    if (!exists(rel)) { throw new Error("Missing " + rel); }
  });

  backupRepo();

  patchData();
  patchWorld();
  patchClubs();
  patchFight();
  patchMatchmaking();
  patchVersions();
  auditDeadFields();

  smokeSyntax();
  verify();

  console.log("\nDONE.");
  console.log("Changed files:");
  console.log("  src/data/game-data.js");
  console.log("  src/core/world.js");
  console.log("  src/core/clubs.js");
  console.log("  src/core/fight.js");
  console.log("  src/core/matchmaking.js");
  console.log("  src/app.js");
  console.log("  version.json / sw.js / reset-cache.html");
}

main();
