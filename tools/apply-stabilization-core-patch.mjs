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

const defaultRosterVersionToken = String.raw`
  function defaultRosterVersionToken(gameState) {
    var roster = rosterRoot(gameState);
    var calendar = gameState && gameState.career ? gameState.career.calendar || {} : {};
    var calendarView = typeof TimeSystem !== "undefined" && TimeSystem.getCalendarView ? TimeSystem.getCalendarView(calendar) : null;
    var totalWeeks = typeof calendar.totalWeeks === "number" ? calendar.totalWeeks : 0;
    var currentWeek = calendarView && typeof calendarView.weekNumber === "number" ? calendarView.weekNumber : (gameState && gameState.career && typeof gameState.career.week === "number" ? gameState.career.week : totalWeeks + 1);
    var currentYear = calendarView && typeof calendarView.year === "number" ? calendarView.year : (typeof calendar.startYear === "number" ? calendar.startYear : 2026);

    return [
      roster.fighterIds.length,
      roster.gymIds ? roster.gymIds.length : 0,
      roster.trainerIds ? roster.trainerIds.length : 0,
      totalWeeks,
      currentWeek,
      currentYear
    ].join("|");
  }`;

const defaultRankingVersionToken = String.raw`
  function defaultRankingVersionToken(gameState) {
    var roster = rosterRoot(gameState);
    var calendar = gameState && gameState.career ? gameState.career.calendar || {} : {};
    var calendarView = typeof TimeSystem !== "undefined" && TimeSystem.getCalendarView ? TimeSystem.getCalendarView(calendar) : null;
    var totalWeeks = typeof calendar.totalWeeks === "number" ? calendar.totalWeeks : 0;
    var currentWeek = calendarView && typeof calendarView.weekNumber === "number" ? calendarView.weekNumber : (gameState && gameState.career && typeof gameState.career.week === "number" ? gameState.career.week : totalWeeks + 1);
    var currentYear = calendarView && typeof calendarView.year === "number" ? calendarView.year : (typeof calendar.startYear === "number" ? calendar.startYear : 2026);
    var seasonState = getSeasonState(gameState);
    var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};

    return [
      roster.fighterIds.length,
      totalWeeks,
      currentWeek,
      currentYear,
      seasonState.currentSeasonYear || 0,
      seasonState.currentSeasonWeek || 0,
      seasonState.resultHistory instanceof Array ? seasonState.resultHistory.length : 0,
      orgState.rankingTableIds instanceof Array ? orgState.rankingTableIds.length : 0,
      orgState.organizationIds instanceof Array ? orgState.organizationIds.length : 0
    ].join("|");
  }`;

const generateConfiguredOpponent = String.raw`
    function generateConfiguredOpponent(tier, countryKeyOverride, snapshotOverride) {
      var fighter = state.fighter;
      var opponentCountryKey;
      var persistentEntity;
      var country;
      var arena;
      var identity;
      var bonus;
      var tierData;
      var tierBonus;
      var base;
      var stats;
      var opponentType;
      var gym;
      var trainerType;
      var development;
      var styleSnapshot;
      var archetype;
      var opponentClone;
      var types;
      var camp;
      var i;

      if (!fighter) {
        return null;
      }

      opponentCountryKey = countryKeyOverride || fighter.currentCountry;

      if (snapshotOverride && snapshotOverride.fighterId) {
        persistentEntity = getPersistentFighterEntity(snapshotOverride.fighterId);

        if (persistentEntity) {
          snapshotOverride = buildPersistentOpponentSnapshot(persistentEntity, snapshotOverride);
          opponentCountryKey = snapshotOverride.countryKey || persistentEntity.country || opponentCountryKey;
        }
      }

      if (!snapshotOverride) {
        persistentEntity = choosePersistentOpponentEntity(tier, opponentCountryKey);

        if (!persistentEntity) {
          ensurePersistentGameState(false);
          persistentEntity = choosePersistentOpponentEntity(tier, opponentCountryKey);
        }

        if (persistentEntity) {
          snapshotOverride = buildPersistentOpponentSnapshot(persistentEntity, null);
          opponentCountryKey = snapshotOverride.countryKey || persistentEntity.country || opponentCountryKey;
        }
      }

      if (snapshotOverride) {
        opponentClone = clonePlainData(snapshotOverride);

        if (opponentClone) {
          opponentCountryKey = opponentClone.countryKey || countryKeyOverride || fighter.currentCountry;
          opponentClone.stats = safeFightStats(opponentClone.stats || baseStats());
          opponentClone.condition = clamp(finiteNumber(opponentClone.condition, 100), 1, 100);

          types = listOpponentTypes();
          opponentType = null;

          for (i = 0; i < types.length; i += 1) {
            if (types[i].id === opponentClone.profileId || types[i].label === opponentClone.profile) {
              opponentType = types[i];
              break;
            }
          }

          opponentType = opponentType || (types.length ? choice(types) : {
            id: "pressure",
            label: "Прессингует и душит темпом"
          });

          camp = resolveOpponentCamp(
            opponentCountryKey,
            opponentClone.gymId,
            opponentClone.trainerTypeId,
            opponentClone.currentTrack || currentOpponentTrackId()
          );

          gym = camp.gym;
          trainerType = camp.trainerType;

          if (!opponentClone.development) {
            development = buildOpponentDevelopment(opponentType, tier, gym, trainerType, opponentClone.stats || baseStats());
            opponentClone.development = development;
          }

          styleSnapshot = currentStyleSnapshot({
            stats: opponentClone.stats || baseStats(),
            development: opponentClone.development
          });

          opponentClone.profileId = opponentType.id;
          opponentClone.profile = opponentClone.profile || opponentType.label;
          opponentClone.gymId = gym ? gym.id : "";
          opponentClone.gymName = gym ? gym.name : "";
          opponentClone.trainerTypeId = trainerType ? trainerType.id : "";
          opponentClone.trainerLabel = trainerType ? (trainerType.fullName || trainerType.name || "") : "";
          opponentClone.styleLabel = styleSnapshot && styleSnapshot.style ? styleSnapshot.style.label : "";
        }

        applyOpponentMetadata(opponentClone, opponentType, gym, trainerType, tier);
        return opponentClone;
      }

      opponentCountryKey = countryKeyOverride || fighter.currentCountry;
      country = getCountryInfo(opponentCountryKey);
      arena = ContentLoader.getRandomArena(opponentCountryKey);

      identity = makeIdentity(opponentCountryKey, currentOpponentTrackId()) || {
        firstName: "Unknown",
        lastName: "Fighter",
        nickname: "",
        fullName: "Unknown Fighter"
      };

      bonus = effectiveTravelBonusForCountry(opponentCountryKey) || {
        money: 1,
        fame: 1
      };

      tierData = ContentLoader.getOpponentTier(tier) || ContentLoader.getOpponentTier("even") || {
        tierBonus: 0,
        purseBase: 40,
        fameBase: 2,
        rounds: [4],
        danger: 1
      };

      tierBonus = tierData.tierBonus || 0;
      base = clamp(Math.round(combatRating(fighter)) + tierBonus + rand(-1, 1), 1, 40);

      opponentType = choice(listOpponentTypes()) || {
        id: "pressure",
        label: "Прессингует и душит темпом"
      };

      stats = {
        str: clamp(base + rand(-1, 2), 1, 45),
        tec: clamp(base + rand(-1, 2), 1, 45),
        spd: clamp(base + rand(-1, 2), 1, 45),
        end: clamp(base + rand(-1, 2), 1, 45),
        vit: clamp(base + rand(-1, 2), 1, 45)
      };

      camp = resolveOpponentCamp(opponentCountryKey, "", "", currentOpponentTrackId());
      gym = camp.gym;
      trainerType = camp.trainerType;
      development = buildOpponentDevelopment(opponentType, tier, gym, trainerType, stats);

      styleSnapshot = currentStyleSnapshot({
        stats: stats,
        development: development
      });

      archetype = opponentArchetypeForProfile(opponentType);

      opponentClone = {
        firstName: identity.firstName,
        lastName: identity.lastName,
        nickname: identity.nickname,
        fullName: identity.fullName,
        countryKey: opponentCountryKey,
        profileId: opponentType.id,
        profile: opponentType.label,
        stats: stats,
        gymId: gym ? gym.id : "",
        gymName: gym ? gym.name : "",
        trainerTypeId: trainerType ? trainerType.id : "",
        trainerLabel: trainerType ? (trainerType.fullName || trainerType.name || "") : "",
        development: development,
        styleLabel: styleSnapshot && styleSnapshot.style ? styleSnapshot.style.label : "",
        purse: Math.round(((tierData.purseBase || 40) + base * 8 + rand(0, 24)) * bonus.money),
        fameReward: Math.round(((tierData.fameBase || 2) + Math.max(0, base - 5) * 2 + rand(0, 4)) * bonus.fame),
        condition: rand(72, 100),
        rounds: choice(tierData.rounds || [4]),
        danger: tierData.danger || 1,
        venue: arena ? arena.name : (country ? country.venueName : "")
      };

      if (archetype) {
        opponentClone.archetypeId = archetype.id;
        opponentClone.archetypeLabel = archetype.label;
      }

      applyOpponentMetadata(opponentClone, opponentType, gym, trainerType, tier);
      return opponentClone;
    }`;

const runPersistentWorldCareerSimulation = String.raw`
    function runPersistentWorldCareerSimulation(action, gameState) {
      var activeGameState = gameState || ensurePersistentGameState(false);
      var absoluteWeek;
      var calendarView;

      if (!activeGameState) {
        return activeGameState;
      }

      if (state && state.fighter && activeGameState.career) {
        activeGameState.career.week = state.fighter.week || activeGameState.career.week || 1;
        activeGameState.career.calendar = clonePlainData(state.fighter.calendar || activeGameState.career.calendar || {});
      }

      if (activeGameState.career && activeGameState.career.calendar && typeof TimeSystem !== "undefined" && TimeSystem.getCalendarView) {
        calendarView = TimeSystem.getCalendarView(activeGameState.career.calendar);
        activeGameState.career.week = calendarView.weekNumber || activeGameState.career.week || 1;

        if (activeGameState.worldState && activeGameState.worldState.timeline) {
          activeGameState.worldState.timeline.currentWeek = activeGameState.career.week;
          activeGameState.worldState.timeline.totalWeeks = activeGameState.career.calendar.totalWeeks || 0;
          activeGameState.worldState.timeline.currentMonthIndex = calendarView.monthIndex || 0;
          activeGameState.worldState.timeline.currentYear = calendarView.year || 2026;
          activeGameState.worldState.timeline.weekOfMonth = calendarView.weekOfMonth || 1;
        }
      }

      if (typeof WorldCareerSimEngine === "undefined" || !WorldCareerSimEngine.runWeeklyPass) {
        return activeGameState;
      }

      absoluteWeek = activeGameState && activeGameState.career ? activeGameState.career.week || 1 : (state && state.fighter ? state.fighter.week || 1 : 1);

      WorldCareerSimEngine.runWeeklyPass(activeGameState, {
        action: action && action.type ? action.type : "",
        actionType: action && action.type ? action.type : "",
        absoluteWeek: absoluteWeek
      });

      return activeGameState;
    }`;

const applyWeeklyPlayerMutationPhase = String.raw`
    function applyWeeklyPlayerMutationPhase() {
      var fighter = state.fighter;
      var previousCalendar;
      var nextCalendar;
      var previousAge;
      var nextAge;
      var action;
      var housingCost;
      var weeklyCosts;
      var supportShift;

      ensureLifeState();

      if (!fighter) {
        return {
          type: "idle"
        };
      }

      if (!fighter.calendar && typeof TimeSystem !== "undefined" && TimeSystem.createCalendar) {
        fighter.calendar = TimeSystem.createCalendar({
          totalWeeks: Math.max(0, (fighter.week || 1) - 1)
        });
      }

      previousCalendar = currentCalendarView(fighter);
      previousAge = currentAgeView(fighter);

      fighter.calendar = TimeSystem.advanceWeek(fighter.calendar);

      nextCalendar = currentCalendarView(fighter);
      nextAge = currentAgeView(fighter);

      fighter.week = nextCalendar.weekNumber || ((fighter.calendar && typeof fighter.calendar.totalWeeks === "number") ? fighter.calendar.totalWeeks + 1 : (fighter.week || 1) + 1);

      weeklyCosts = 0;

      if (WEEKLY_EXPENSE > 0) {
        fighter.money -= WEEKLY_EXPENSE;
        weeklyCosts += WEEKLY_EXPENSE;
      }

      housingCost = weeklyHousingCost(fighter);

      if (housingCost > 0) {
        fighter.money -= housingCost;
        weeklyCosts += housingCost;
      }

      weeklyCosts += payGymAndTrainerUpkeep();
      recordBalanceWeeks(1);

      if (weeklyCosts > 0) {
        recordBalanceEconomy(-weeklyCosts, "расходы недели");
        pushLog("Расходы за неделю: -$" + weeklyCosts + ".", "warn");
      }

      updateContractsForWeek();

      if (previousCalendar.monthIndex !== nextCalendar.monthIndex || previousCalendar.year !== nextCalendar.year) {
        pushLog("Начинается " + nextCalendar.monthName + " " + nextCalendar.year + ".", "warn");
      }

      if (previousAge.years !== nextAge.years) {
        pushLog("Новый возраст: " + nextAge.label + ".", "good");
      }

      action = state.world.lastWeekAction || {
        type: "idle"
      };

      applyHousingWeekEffects(fighter);
      applyInjuryWeekEffects(fighter, action);

      fighter.fatigue = clamp(fighter.fatigue - 3, 0, 100);
      fighter.wear = clamp(fighter.wear - 1, 0, 100);

      if (action.type === "recover") {
        fighter.fatigue = clamp(fighter.fatigue - 4, 0, 100);
        fighter.wear = clamp(fighter.wear - 1, 0, 100);
      }

      if (String(action.type || "").indexOf("social_") === 0 || action.type === "npc") {
        fighter.support += 1;
      } else if (action.type !== "fight" && action.type !== "idle") {
        fighter.support -= 1;
      }

      supportShift = socialSupportBuffer(fighter);

      if (supportShift > 0 && (action.type === "fight" || action.type === "recover")) {
        fighter.stress -= supportShift;
        fighter.morale += Math.max(1, supportShift - 1);
      } else if (supportShift < 0) {
        fighter.stress += Math.abs(supportShift);
        fighter.morale += supportShift;
      }

      if (fighter.stress > 70) {
        fighter.health -= 1;
      }

      if (fighter.stress >= 75) {
        fighter.fatigue += 2;
        fighter.morale -= 2;
      }

      if (fighter.health <= 35) {
        fighter.morale -= 1;
      }

      if (fighter.fatigue >= 75) {
        fighter.health -= 1;
      }

      if (fighter.wear >= 70) {
        fighter.health -= 1;
      }

      if (fighter.morale >= 70 && fighter.stress > 0) {
        fighter.stress -= 1;
      }

      if (fighter.morale <= 30) {
        fighter.stress += 1;
      }

      if (fighter.money < 0) {
        fighter.debtWeeks += 1;
        pushLog("Баланс в минусе: $" + fighter.money + ". Нужно выбраться за " + Math.max(0, 3 - fighter.debtWeeks) + " нед.", "bad");
      } else {
        fighter.debtWeeks = 0;
      }

      if (previousAge.years < 18 && nextAge.years >= 18) {
        applyAdultTransition(fighter);

        if (!state.activeEvent) {
          state.activeEvent = buildAdultTransitionEvent(fighter);
        }
      }

      applyBounds(fighter);
      syncAmateurRankState(fighter, true);
      updateNpcWorldForWeek(action);

      return action;
    }`;

replaceFunction("src/core/persistent_fighter_registry.js", "defaultRosterVersionToken", defaultRosterVersionToken);
replaceFunction("src/core/world_rankings_engine.js", "defaultRankingVersionToken", defaultRankingVersionToken);
replaceFunction("index.html", "generateConfiguredOpponent", generateConfiguredOpponent);
replaceFunction("index.html", "runPersistentWorldCareerSimulation", runPersistentWorldCareerSimulation);
replaceFunction("index.html", "applyWeeklyPlayerMutationPhase", applyWeeklyPlayerMutationPhase);

const index = readProjectFile("index.html");

if (index.includes("return null;\n      opponentCountryKey = countryKeyOverride || fighter.currentCountry;")) {
    throw new Error("generateConfiguredOpponent still contains unreachable fallback after return null.");
}

if (!index.includes("fighter.week = nextCalendar.weekNumber")) {
    throw new Error("applyWeeklyPlayerMutationPhase did not receive fighter.week synchronization.");
}

console.log("stabilization patch completed");