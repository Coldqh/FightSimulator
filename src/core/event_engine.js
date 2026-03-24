var EventEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function uniqueStrings(list) {
    var out = [];
    var i;
    var j;
    var exists;
    if (!(list instanceof Array)) {
      return out;
    }
    for (i = 0; i < list.length; i += 1) {
      if (typeof list[i] !== "string" || !list[i]) {
        continue;
      }
      exists = false;
      for (j = 0; j < out.length; j += 1) {
        if (out[j] === list[i]) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        out.push(list[i]);
      }
    }
    return out;
  }

  function listNpcsByRole(world, roleId) {
    var npcs = world && world.npcs instanceof Array ? world.npcs : [];
    var out = [];
    var i;
    for (i = 0; i < npcs.length; i += 1) {
      if (npcs[i] && npcs[i].role === roleId) {
        out.push(npcs[i]);
      }
    }
    return out;
  }

  function findNpcById(world, npcId) {
    var npcs = world && world.npcs instanceof Array ? world.npcs : [];
    var i;
    for (i = 0; i < npcs.length; i += 1) {
      if (npcs[i] && npcs[i].id === npcId) {
        return npcs[i];
      }
    }
    return null;
  }

  function listRelationsForRole(world, roleId) {
    var relations = world && world.relationships instanceof Array ? world.relationships : [];
    var out = [];
    var i;
    var npc;
    for (i = 0; i < relations.length; i += 1) {
      npc = findNpcById(world, relations[i].npcId);
      if (npc && npc.role === roleId) {
        out.push(relations[i]);
      }
    }
    return out;
  }

  function findLatestFightAction(actionHistory) {
    var i;
    if (!(actionHistory instanceof Array)) {
      return null;
    }
    for (i = 0; i < actionHistory.length; i += 1) {
      if (actionHistory[i] && actionHistory[i].type === "fight") {
        return actionHistory[i];
      }
    }
    return null;
  }

  function deriveDiscipline(conditions, life) {
    var morale = typeof conditions.morale === "number" ? conditions.morale : 55;
    var fatigue = typeof conditions.fatigue === "number" ? conditions.fatigue : 0;
    var wear = typeof conditions.wear === "number" ? conditions.wear : 0;
    var stress = typeof life.stress === "number" ? life.stress : 0;
    var support = typeof life.support === "number" ? life.support : 50;
    var housingBonus = 0;
    if (life.housingId === "rough") {
      housingBonus = -6;
    } else if (life.housingId === "comfortable") {
      housingBonus = 6;
    }
    return Math.max(0, Math.min(100, Math.round(20 + morale * 0.3 + support * 0.2 - stress * 0.15 - fatigue * 0.12 - wear * 0.08 + housingBonus)));
  }

  function buildContext(gameState) {
    var world = gameState && gameState.world ? gameState.world : {};
    var eventState = world.eventState || {};
    var actionHistory = eventState.actionHistory instanceof Array ? eventState.actionHistory : [];
    var player = gameState && gameState.player ? gameState.player : {};
    var profile = player.profile || {};
    var resources = player.resources || {};
    var conditions = player.conditions || {};
    var life = player.life || {};
    var biography = player.biography || {};
    var calendar = gameState && gameState.career ? gameState.career.calendar : null;
    var ageView = TimeSystem.getAgeView(conditions.startingAge, calendar);
    var lastAction = actionHistory.length ? actionHistory[0] : (world.lastWeekAction || null);
    var lastFight = findLatestFightAction(actionHistory);
    var npcs = world.npcs instanceof Array ? world.npcs : [];
    var roles = [];
    var bioFlags = biography.flags instanceof Array ? uniqueStrings(biography.flags) : [];
    var recentEvents = eventState.recentEvents instanceof Array ? eventState.recentEvents : [];
    var recentEventIds = [];
    var encounterContext = typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.buildPlayerEncounterContext ?
      EncounterHistoryEngine.buildPlayerEncounterContext(gameState) :
      { knownOpponentOffers: [], knownOpponentOfferCount: 0, sharedPastOfferCount: 0, encounterTags: [], recentEncounterSummaries: [] };
    var i;

    for (i = 0; i < npcs.length; i += 1) {
      if (npcs[i] && typeof npcs[i].role === "string") {
        roles.push(npcs[i].role);
      }
    }
    for (i = 0; i < recentEvents.length; i += 1) {
      if (recentEvents[i] && typeof recentEvents[i].id === "string") {
        recentEventIds.push(recentEvents[i].id);
      }
    }

    return {
      week: gameState && gameState.career ? gameState.career.week : 1,
      age: ageView.years,
      ageLabel: ageView.label,
      currentCountry: profile.currentCountry || "",
      homeCountry: profile.homeCountry || "",
      abroad: !!profile.currentCountry && !!profile.homeCountry && profile.currentCountry !== profile.homeCountry,
      fame: typeof resources.fame === "number" ? resources.fame : 0,
      money: typeof resources.money === "number" ? resources.money : 0,
      stress: typeof resources.stress === "number" ? resources.stress : 0,
      health: typeof resources.health === "number" ? resources.health : 100,
      fatigue: typeof conditions.fatigue === "number" ? conditions.fatigue : 0,
      wear: typeof conditions.wear === "number" ? conditions.wear : 0,
      morale: typeof conditions.morale === "number" ? conditions.morale : 55,
      housingId: life.housingId || "rough",
      support: typeof life.support === "number" ? life.support : 50,
      discipline: deriveDiscipline(conditions, {
        stress: typeof resources.stress === "number" ? resources.stress : 0,
        support: typeof life.support === "number" ? life.support : 50,
        housingId: life.housingId || "rough"
      }),
      biographyFlags: bioFlags,
      roles: uniqueStrings(roles),
      npcs: npcs,
      world: world,
      lastAction: lastAction,
      lastActionType: lastAction && lastAction.type ? lastAction.type : "",
      lastFight: lastFight,
      lastFightResult: lastFight && lastFight.meta ? lastFight.meta.result : "",
      lastFightMethod: lastFight && lastFight.meta ? lastFight.meta.method : "",
      actionHistory: actionHistory,
      recentEventIds: uniqueStrings(recentEventIds),
      encounterTags: encounterContext.encounterTags instanceof Array ? uniqueStrings(encounterContext.encounterTags) : [],
      knownOpponentOffers: encounterContext.knownOpponentOffers instanceof Array ? encounterContext.knownOpponentOffers : [],
      knownOpponentOfferCount: typeof encounterContext.knownOpponentOfferCount === "number" ? encounterContext.knownOpponentOfferCount : 0,
      sharedPastOfferCount: typeof encounterContext.sharedPastOfferCount === "number" ? encounterContext.sharedPastOfferCount : 0,
      recentEncounterSummaries: encounterContext.recentEncounterSummaries instanceof Array ? encounterContext.recentEncounterSummaries : [],
      eventState: eventState
    };
  }

  function hasRole(context, roleId) {
    var i;
    for (i = 0; i < context.roles.length; i += 1) {
      if (context.roles[i] === roleId) {
        return true;
      }
    }
    return false;
  }

  function hasAny(list, targets) {
    var i;
    var j;
    if (!(list instanceof Array) || !(targets instanceof Array)) {
      return false;
    }
    for (i = 0; i < list.length; i += 1) {
      for (j = 0; j < targets.length; j += 1) {
        if (list[i] === targets[j]) {
          return true;
        }
      }
    }
    return false;
  }

  function hasAll(list, targets) {
    var i;
    if (!(targets instanceof Array)) {
      return true;
    }
    for (i = 0; i < targets.length; i += 1) {
      if (!hasAny(list, [targets[i]])) {
        return false;
      }
    }
    return true;
  }

  function relationMeets(world, requirement) {
    var relations = listRelationsForRole(world, requirement.role || "");
    var score;
    var i;
    for (i = 0; i < relations.length; i += 1) {
      score = typeof relations[i].score === "number" ? relations[i].score : 0;
      if ((typeof requirement.score !== "number" || score >= requirement.score) &&
          (typeof requirement.affinity !== "number" || score >= (requirement.affinity * 2 - 100)) &&
          (typeof requirement.respect !== "number" || score >= (requirement.respect * 2 - 100)) &&
          (typeof requirement.trust !== "number" || score >= (requirement.trust * 2 - 100)) &&
          (typeof requirement.tension !== "number" || score <= (100 - requirement.tension * 2))) {
        return true;
      }
    }
    return false;
  }

  function historyHasAction(actionHistory, allowed) {
    var i;
    if (!(allowed instanceof Array)) {
      return false;
    }
    for (i = 0; i < actionHistory.length; i += 1) {
      if (actionHistory[i] && hasAny(allowed, [actionHistory[i].type])) {
        return true;
      }
    }
    return false;
  }

  function isOnCooldown(eventState, eventId, currentWeek, cooldown) {
    var lastWeek;
    if (!cooldown || !eventState || !eventState.cooldowns) {
      return false;
    }
    lastWeek = eventState.cooldowns[eventId];
    if (typeof lastWeek !== "number") {
      return false;
    }
    return currentWeek - lastWeek < cooldown;
  }

  function isOnceResolved(eventState, eventId) {
    return !!(eventState && eventState.onceResolved instanceof Array && hasAny(eventState.onceResolved, [eventId]));
  }

  function matchesConditions(eventDef, context) {
    var conditions = eventDef.conditions || {};
    var relationChecks;
    var i;
    if (eventDef.once && isOnceResolved(context.eventState, eventDef.id)) {
      return false;
    }
    if (eventDef.repeatable === false && isOnceResolved(context.eventState, eventDef.id)) {
      return false;
    }
    if (isOnCooldown(context.eventState, eventDef.id, context.week, eventDef.cooldown)) {
      return false;
    }
    if (typeof conditions.minWeek === "number" && context.week < conditions.minWeek) { return false; }
    if (typeof conditions.maxWeek === "number" && context.week > conditions.maxWeek) { return false; }
    if (typeof conditions.minAge === "number" && context.age < conditions.minAge) { return false; }
    if (typeof conditions.maxAge === "number" && context.age > conditions.maxAge) { return false; }
    if (typeof conditions.minFame === "number" && context.fame < conditions.minFame) { return false; }
    if (typeof conditions.maxFame === "number" && context.fame > conditions.maxFame) { return false; }
    if (typeof conditions.minMoney === "number" && context.money < conditions.minMoney) { return false; }
    if (typeof conditions.maxMoney === "number" && context.money > conditions.maxMoney) { return false; }
    if (typeof conditions.minStress === "number" && context.stress < conditions.minStress) { return false; }
    if (typeof conditions.maxStress === "number" && context.stress > conditions.maxStress) { return false; }
    if (typeof conditions.minHealth === "number" && context.health < conditions.minHealth) { return false; }
    if (typeof conditions.maxHealth === "number" && context.health > conditions.maxHealth) { return false; }
    if (typeof conditions.minFatigue === "number" && context.fatigue < conditions.minFatigue) { return false; }
    if (typeof conditions.maxFatigue === "number" && context.fatigue > conditions.maxFatigue) { return false; }
    if (typeof conditions.minWear === "number" && context.wear < conditions.minWear) { return false; }
    if (typeof conditions.maxWear === "number" && context.wear > conditions.maxWear) { return false; }
    if (typeof conditions.minMorale === "number" && context.morale < conditions.minMorale) { return false; }
    if (typeof conditions.maxMorale === "number" && context.morale > conditions.maxMorale) { return false; }
    if (typeof conditions.minSupport === "number" && context.support < conditions.minSupport) { return false; }
    if (typeof conditions.maxSupport === "number" && context.support > conditions.maxSupport) { return false; }
    if (typeof conditions.minDiscipline === "number" && context.discipline < conditions.minDiscipline) { return false; }
    if (typeof conditions.maxDiscipline === "number" && context.discipline > conditions.maxDiscipline) { return false; }
    if (conditions.homeOnly && context.abroad) { return false; }
    if (conditions.abroadOnly && !context.abroad) { return false; }
    if (typeof conditions.country === "string" && context.currentCountry !== conditions.country) { return false; }
    if (conditions.countryAny instanceof Array && !hasAny(conditions.countryAny, [context.currentCountry])) { return false; }
    if (typeof conditions.housingIs === "string" && context.housingId !== conditions.housingIs) { return false; }
    if (conditions.housingAny instanceof Array && !hasAny(conditions.housingAny, [context.housingId])) { return false; }
    if (conditions.requiresRolesAll instanceof Array && !hasAll(context.roles, conditions.requiresRolesAll)) { return false; }
    if (conditions.requiresRolesAny instanceof Array && !hasAny(context.roles, conditions.requiresRolesAny)) { return false; }
    if (conditions.biographyFlagsAny instanceof Array && !hasAny(context.biographyFlags, conditions.biographyFlagsAny)) { return false; }
    if (conditions.biographyFlagsAll instanceof Array && !hasAll(context.biographyFlags, conditions.biographyFlagsAll)) { return false; }
    if (conditions.biographyFlagsNot instanceof Array && hasAny(context.biographyFlags, conditions.biographyFlagsNot)) { return false; }
    if (conditions.recentActionAny instanceof Array && !historyHasAction(context.actionHistory, conditions.recentActionAny)) { return false; }
    if (typeof conditions.lastActionType === "string" && context.lastActionType !== conditions.lastActionType) { return false; }
    if (typeof conditions.lastFightResult === "string" && context.lastFightResult !== conditions.lastFightResult) { return false; }
    if (typeof conditions.lastFightMethodContains === "string" && String(context.lastFightMethod || "").indexOf(conditions.lastFightMethodContains) === -1) { return false; }
    if (conditions.recentEventsNot instanceof Array && hasAny(context.recentEventIds, conditions.recentEventsNot)) { return false; }
    if (conditions.recentEventsAny instanceof Array && !hasAny(context.recentEventIds, conditions.recentEventsAny)) { return false; }
    if (conditions.encounterTagsAny instanceof Array && !hasAny(context.encounterTags, conditions.encounterTagsAny)) { return false; }
    if (conditions.encounterTagsAll instanceof Array && !hasAll(context.encounterTags, conditions.encounterTagsAll)) { return false; }
    if (typeof conditions.minKnownOpponentOffers === "number" && context.knownOpponentOfferCount < conditions.minKnownOpponentOffers) { return false; }
    if (typeof conditions.minSharedPastOffers === "number" && context.sharedPastOfferCount < conditions.minSharedPastOffers) { return false; }
    relationChecks = conditions.relationAtLeast instanceof Array ? conditions.relationAtLeast : [];
    for (i = 0; i < relationChecks.length; i += 1) {
      if (!relationMeets(context.world, relationChecks[i])) {
        return false;
      }
    }
    return true;
  }

  function resolveActors(eventDef, context, rngState) {
    var actorDefs = eventDef.actors instanceof Array ? eventDef.actors : [];
    var actors = {};
    var i;
    var candidates;
    var picked;
    for (i = 0; i < actorDefs.length; i += 1) {
      candidates = listNpcsByRole(context.world, actorDefs[i].role);
      if (!candidates.length) {
        if (actorDefs[i].required) {
          return null;
        }
        continue;
      }
      picked = RNG.choice(rngState, candidates);
      actors[actorDefs[i].slot] = {
        id: picked.id,
        role: picked.role,
        name: picked.name,
        country: picked.country
      };
    }
    return actors;
  }

  function replaceTokens(text, actorMap) {
    var result = String(text || "");
    var key;
    if (!actorMap) {
      return result;
    }
    for (key in actorMap) {
      if (actorMap.hasOwnProperty(key)) {
        result = result.replace(new RegExp("\\{" + key + "\\}", "g"), actorMap[key].name);
      }
    }
    return result;
  }

  function instantiateEvent(eventDef, context, rngState) {
    var actors = resolveActors(eventDef, context, rngState);
    var choices = [];
    var i;
    if (eventDef.actors && !actors) {
      return null;
    }
    for (i = 0; i < eventDef.choices.length; i += 1) {
      choices.push({
        id: eventDef.choices[i].id,
        label: replaceTokens(eventDef.choices[i].label, actors),
        effects: clone(eventDef.choices[i].effects || []),
        tagChanges: clone(eventDef.choices[i].tagChanges || null)
      });
    }
    return {
      id: eventDef.id,
      title: replaceTokens(eventDef.title, actors),
      text: replaceTokens(eventDef.text, actors),
      choices: choices,
      actors: clone(actors || {}),
      cooldown: eventDef.cooldown || 0,
      once: !!eventDef.once,
      repeatable: eventDef.repeatable !== false,
      tags: clone(eventDef.tags || []),
      week: context.week
    };
  }

  function pickEvent(gameState, eventDefinitions, rngState) {
    var context = buildContext(gameState);
    var candidates = [];
    var totalWeight = 0;
    var roll;
    var i;
    var eventDef;
    if (!(eventDefinitions instanceof Array)) {
      return null;
    }
    for (i = 0; i < eventDefinitions.length; i += 1) {
      eventDef = eventDefinitions[i];
      if (!eventDef || !(eventDef.choices instanceof Array) || !eventDef.choices.length) {
        continue;
      }
      if (!matchesConditions(eventDef, context)) {
        continue;
      }
      totalWeight += typeof eventDef.weight === "number" ? Math.max(1, eventDef.weight) : 1;
      candidates.push({
        def: eventDef,
        total: totalWeight
      });
    }
    if (!candidates.length) {
      return null;
    }
    roll = RNG.int(rngState, 1, totalWeight);
    for (i = 0; i < candidates.length; i += 1) {
      if (roll <= candidates[i].total) {
        return instantiateEvent(candidates[i].def, context, rngState);
      }
    }
    return instantiateEvent(candidates[candidates.length - 1].def, context, rngState);
  }

  return {
    buildContext: buildContext,
    matchesConditions: matchesConditions,
    pickEvent: pickEvent
  };
}());
