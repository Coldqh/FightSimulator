import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function writeProjectFile(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function findFunctionRange(source, functionName) {
  const needle = `function ${functionName}`;
  const start = source.indexOf(needle);

  if (start < 0) {
    throw new Error(`Function not found: ${functionName}`);
  }

  const openBrace = source.indexOf("{", start);

  if (openBrace < 0) {
    throw new Error(`Opening brace not found for function: ${functionName}`);
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBrace; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
        quote = "";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === "\"" || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          end: i + 1
        };
      }
    }
  }

  throw new Error(`Closing brace not found for function: ${functionName}`);
}

function replaceFunction(relativePath, functionName, replacement) {
  const source = readProjectFile(relativePath);
  const range = findFunctionRange(source, functionName);
  const next = source.slice(0, range.start) + replacement.trimEnd() + source.slice(range.end);

  writeProjectFile(relativePath, next);
  console.log(`patched ${relativePath}: ${functionName}`);
}

const runWeeklyPass = String.raw`
  function runWeeklyPass(gameState, options) {
    var opts = options || {};
    var weekValue = typeof opts.absoluteWeek === "number" ? opts.absoluteWeek : currentWeek(gameState);
    var yearValue = currentYear(gameState);
    var root;
    var allFighters;
    var fighters;
    var scored;
    var lightweightMode;
    var player;
    var playerCountry;
    var maxWeeklyFighters;
    var i;
    var fighter;

    function fighterImportanceScore(target) {
      var score = 0;
      var trackId;

      if (!target || !target.id) {
        return -999999;
      }

      if (target.isPlayer) {
        return 999999;
      }

      trackId = fighterTrack(target);

      if (target.country === playerCountry) {
        score += 260;
      }

      if (target.nationalTeamStatus === "active") {
        score += 180;
      } else if (target.nationalTeamStatus === "reserve") {
        score += 140;
      } else if (target.nationalTeamStatus === "candidate") {
        score += 110;
      }

      if (trackId === "pro") {
        score += 100 + Math.round((target.rankingSeed || 0) * 0.7);
      } else if (trackId === "amateur") {
        score += 80 + Math.round(getNationalRankingScore(gameState, target) * 0.15);
      } else {
        score += 65 + Math.round((target.streetRating || 0) * 0.6);
      }

      if (target.encounterHooks instanceof Array && target.encounterHooks.length) {
        score += 160;
      }

      if (target.worldHistoryHooks instanceof Array && target.worldHistoryHooks.length) {
        score += 70;
      }

      score += Math.round((target.fame || 0) * 0.8);
      score += Math.max(0, 60 - Math.abs((target.age || 20) - (player && player.age ? player.age : 20)));

      return score;
    }

    function buildWeeklyWorklist(source) {
      var result = [];
      var seen = {};
      var j;

      scored = [];

      for (j = 0; j < source.length; j += 1) {
        fighter = source[j];

        if (!fighter || fighter.status === "retired") {
          continue;
        }

        scored.push({
          fighter: fighter,
          score: fighterImportanceScore(fighter)
        });
      }

      scored.sort(function (left, right) {
        return right.score - left.score;
      });

      for (j = 0; j < scored.length && result.length < maxWeeklyFighters; j += 1) {
        fighter = scored[j].fighter;

        if (fighter && fighter.id && !seen[fighter.id]) {
          seen[fighter.id] = true;
          result.push(fighter);
        }
      }

      return result;
    }

    if (!gameState) {
      return null;
    }

    allFighters = listRosterFighters(gameState);
    player = playerEntity(gameState);
    playerCountry = player ? player.country : "";
    maxWeeklyFighters = typeof opts.maxWeeklyFighters === "number" ? opts.maxWeeklyFighters : 140;
    lightweightMode = allFighters.length > 260 && opts.forceFullWorld !== true;
    fighters = lightweightMode ? buildWeeklyWorklist(allFighters) : allFighters;

    ensureState(gameState, fighters);
    root = worldCareerRoot(gameState);

    if (root.lastProcessedWeek >= weekValue) {
      return root;
    }

    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      normalizeNpcFighter(gameState, fighter, weekValue, yearValue, root);
    }

    spawnNewgens(gameState, weekValue, yearValue, root);

    if (!lightweightMode || weekValue % 4 === 0) {
      if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.ensureOrganizations) {
        AmateurEcosystem.ensureOrganizations(gameState);
      }

      if (typeof AmateurSeasonEngine !== "undefined" && AmateurSeasonEngine.ensureState) {
        AmateurSeasonEngine.ensureState(gameState);
      }

      if (typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.runWeeklyPass) {
        StreetCareerEngine.runWeeklyPass(gameState, {
          absoluteWeek: weekValue,
          action: opts.action || ""
        });
      }

      if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.runWeeklyPass) {
        ProCareerEngine.runWeeklyPass(gameState, {
          absoluteWeek: weekValue,
          action: opts.action || ""
        });
      }
    }

    fighters = lightweightMode ? buildWeeklyWorklist(listRosterFighters(gameState)) : listRosterFighters(gameState);

    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];

      if (!fighter) {
        continue;
      }

      ensureFighterLifecycle(fighter, gameState, weekValue, yearValue);
      maybeFlagOlympicHopeful(fighter);
    }

    if (!lightweightMode || weekValue % 4 === 0) {
      processSeasonHistory(gameState, root);
    }

    syncTeamStatusChanges(gameState, root, weekValue, fighters);
    syncTrackChanges(gameState, root, weekValue, fighters);
    syncPlayerEncounterMemory(gameState, root, weekValue, fighters);

    if ((!lightweightMode || weekValue % 4 === 0) && typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.syncWorldLinks) {
      EncounterHistoryEngine.syncWorldLinks(gameState, {
        week: weekValue
      });
    }

    emitRelevantWorldNotices(gameState, root, weekValue, fighters);

    root.lastProcessedWeek = weekValue;
    root.lastProcessedYear = yearValue;

    if (lightweightMode) {
      root.lastLightweightWeek = weekValue;
      root.lastLightweightFighterCount = fighters.length;
      root.totalFighterCountAtLastTick = allFighters.length;
    }

    return root;
  }`;

const identityForSlot = String.raw`
  function identityForSlot(countryId, trackId, slotIndex) {
    var pool = getCountryPool(countryId) || {
      firstNames: ["Alex"],
      lastNames: ["Stone"],
      nicknames: ["Rook"]
    };
    var seed = typeof ContentLoader !== "undefined" && ContentLoader.getCountrySeedConfig ? ContentLoader.getCountrySeedConfig(countryId) : null;
    var firstNames = seed ?
      ((seed.firstJoin === "join") ?
        (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]) :
        (seed.firstLeft && seed.firstLeft.length ? seed.firstLeft.slice(0) : (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]))) :
      (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]);
    var lastNames = seed ?
      ((seed.lastJoin === "join") ?
        (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]) :
        (seed.lastLeft && seed.lastLeft.length ? seed.lastLeft.slice(0) : (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]))) :
      (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]);
    var nicknames = pool.nicknames && pool.nicknames.length ? pool.nicknames : ["Rook"];
    var baseSeed = String(countryId || "") + "|" + String(trackId || "") + "|" + String(slotIndex || 0);
    var firstName = firstNames[deterministicRange(baseSeed + "|first", 0, firstNames.length - 1)];
    var lastName = lastNames[deterministicRange(baseSeed + "|last", 0, lastNames.length - 1)];
    var nickname = "";

    if (firstNames.length > 1 && slotIndex > 0 && firstName === firstNames[deterministicRange(String(countryId || "") + "|" + String(trackId || "") + "|" + String(slotIndex - 1) + "|first", 0, firstNames.length - 1)]) {
      firstName = firstNames[(deterministicRange(baseSeed + "|first_shift", 0, firstNames.length - 1) + slotIndex) % firstNames.length];
    }

    if (lastNames.length > 1 && slotIndex > 0 && lastName === lastNames[deterministicRange(String(countryId || "") + "|" + String(trackId || "") + "|" + String(slotIndex - 1) + "|last", 0, lastNames.length - 1)]) {
      lastName = lastNames[(deterministicRange(baseSeed + "|last_shift", 0, lastNames.length - 1) + slotIndex * 2) % lastNames.length];
    }

    if (trackId === "street") {
      nickname = sanitizeNicknameWord(nicknames[deterministicRange(baseSeed + "|street_nick", 0, nicknames.length - 1)]);
    } else if (trackId === "pro" && deterministicRange(baseSeed + "|pro_nick_roll", 0, 100) >= 64) {
      nickname = sanitizeNicknameWord(nicknames[deterministicRange(baseSeed + "|pro_nick", 0, nicknames.length - 1)]);
    }

    return {
      firstName: firstName,
      lastName: lastName,
      nickname: nickname
    };
  }`;

const buildWeeklyOffers = String.raw`
    function buildWeeklyOffers() {
      var fightOffers = buildFightOffers();
      var contractOffers = buildContractOffers();
      var summaries = [];
      var headline = "";
      var fallbackIds = [];
      var fallbackOffer;
      var i;

      if (!fightOffers.length) {
        if (isStreetTrack()) {
          fallbackIds = listStreetFightTemplateIds();
          if (!fallbackIds.length) {
            fallbackIds = ["street_even"];
          }
        } else if (isAmateurTrack()) {
          fallbackIds = listEligibleAmateurFightTemplateIds();
          if (!fallbackIds.length) {
            fallbackIds = ["adult_amateur_class"];
          }
        } else if (isProTrack()) {
          fallbackIds = listEligibleProFightTemplateIds();
          if (!fallbackIds.length) {
            fallbackIds = ["pro_debut"];
          }
        } else {
          fallbackIds = ["home_even", "away_even"];
        }

        for (i = 0; i < fallbackIds.length && fightOffers.length < 3; i += 1) {
          fallbackOffer = buildFightOffer(fallbackIds[i], null, null, {
            matchmakingNote: "Запасной матчмейкинг: игра не нашла рейтингового соперника, поэтому подобрала бой вручную."
          });

          if (fallbackOffer) {
            fightOffers.push(fallbackOffer);
          }
        }
      }

      if (fightOffers.length) {
        headline = fightOffers[0].label + ": $" + fightOffers[0].guaranteedPurse + " гарантии";
        summaries.push({
          id: fightOffers[0].id,
          type: "fight",
          title: fightOffers[0].label,
          text: "Гарантия $" + fightOffers[0].guaranteedPurse
        });
      }

      if (contractOffers.length) {
        summaries.push({
          id: contractOffers[0].id,
          type: "contract",
          title: contractOffers[0].label,
          text: "Контракт от " + contractOffers[0].promoterName + " с гарантией $" + contractOffers[0].guaranteedPurse + "."
        });

        if (!headline) {
          headline = contractOffers[0].label + " от " + contractOffers[0].promoterName;
        }
      }

      if (!headline) {
        headline = "На этой неделе новых вариантов мало.";
      }

      return {
        weekStamp: state.fighter.week,
        refreshStamp: currentOfferRefreshStamp(),
        available: summaries,
        headline: headline,
        fightOffers: fightOffers,
        contractOffers: contractOffers
      };
    }`;

replaceFunction("src/core/world_career_sim_engine.js", "runWeeklyPass", runWeeklyPass);
replaceFunction("src/core/world_rankings_engine.js", "identityForSlot", identityForSlot);
replaceFunction("index.html", "buildWeeklyOffers", buildWeeklyOffers);

const worldCareer = readProjectFile("src/core/world_career_sim_engine.js");
const rankings = readProjectFile("src/core/world_rankings_engine.js");
const index = readProjectFile("index.html");

if (!worldCareer.includes("lastLightweightWeek")) {
  throw new Error("WorldCareerSimEngine lightweight weekly patch was not applied.");
}

if (!rankings.includes("baseSeed = String(countryId")) {
  throw new Error("identityForSlot diversity patch was not applied.");
}

if (!index.includes("Запасной матчмейкинг")) {
  throw new Error("buildWeeklyOffers fallback patch was not applied.");
}

console.log("week freeze hotfix completed");