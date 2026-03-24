var RelationshipArcEngine = (function () {
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

  function templateKey(templateId) {
    return "arc:" + templateId;
  }

  function findTemplate(templates, templateId) {
    var i;
    if (!(templates instanceof Array)) {
      return null;
    }
    for (i = 0; i < templates.length; i += 1) {
      if (templates[i] && templates[i].id === templateId) {
        return templates[i];
      }
    }
    return null;
  }

  function findStage(template, stageId) {
    var stages = template && template.stages instanceof Array ? template.stages : [];
    var i;
    for (i = 0; i < stages.length; i += 1) {
      if (stages[i] && stages[i].id === stageId) {
        return stages[i];
      }
    }
    return null;
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

  function findRelationship(world, npcId) {
    var relationships = world && world.relationships instanceof Array ? world.relationships : [];
    var i;
    for (i = 0; i < relationships.length; i += 1) {
      if (relationships[i] && relationships[i].npcId === npcId) {
        return relationships[i];
      }
    }
    return null;
  }

  function findArcById(world, arcId) {
    var arcs = world && world.relationshipArcs instanceof Array ? world.relationshipArcs : [];
    var i;
    for (i = 0; i < arcs.length; i += 1) {
      if (arcs[i] && arcs[i].id === arcId) {
        return arcs[i];
      }
    }
    return null;
  }

  function listRivalries(world) {
    return world && world.rivalries instanceof Array ? world.rivalries : [];
  }

  function findRivalryById(world, rivalryId) {
    var rivalries = listRivalries(world);
    var i;
    for (i = 0; i < rivalries.length; i += 1) {
      if (rivalries[i] && rivalries[i].id === rivalryId) {
        return rivalries[i];
      }
    }
    return null;
  }

  function activeTemplateIds(world) {
    var arcs = world && world.relationshipArcs instanceof Array ? world.relationshipArcs : [];
    var ids = [];
    var i;
    for (i = 0; i < arcs.length; i += 1) {
      if (arcs[i] && arcs[i].status === "active" && arcs[i].templateId) {
        ids.push(arcs[i].templateId);
      }
    }
    return uniqueStrings(ids);
  }

  function isArcOnceResolved(world, templateId) {
    var eventState = world && world.eventState ? world.eventState : null;
    var key = templateKey(templateId);
    return !!(eventState && eventState.onceResolved instanceof Array && hasAny(eventState.onceResolved, [key]));
  }

  function isArcOnCooldown(world, templateId, currentWeek, cooldown) {
    var eventState = world && world.eventState ? world.eventState : null;
    var key = templateKey(templateId);
    var lastWeek;
    if (!cooldown || !eventState || !eventState.cooldowns) {
      return false;
    }
    lastWeek = eventState.cooldowns[key];
    if (typeof lastWeek !== "number") {
      return false;
    }
    return currentWeek - lastWeek < cooldown;
  }

  function actorScore(world, npc, actorDef) {
    var relation = findRelationship(world, npc.id);
    var sortBy = actorDef && actorDef.sortBy ? actorDef.sortBy : "";
    var score;
    if (!relation) {
      return 0;
    }
    score = typeof relation.score === "number" ? relation.score : 0;
    if (sortBy === "affinity" || sortBy === "respect" || sortBy === "trust") { return score; }
    if (sortBy === "tension") { return -score; }
    return score;
  }

  function sortNpcCandidates(world, candidates, actorDef) {
    var sorted = candidates.slice(0);
    var dir = actorDef && actorDef.sortDir === "asc" ? 1 : -1;
    sorted.sort(function (left, right) {
      return (actorScore(world, left, actorDef) - actorScore(world, right, actorDef)) * dir;
    });
    return sorted;
  }

  function sortRivalryCandidates(candidates, actorDef) {
    var sorted = candidates.slice(0);
    var sortBy = actorDef && actorDef.sortBy ? actorDef.sortBy : "tension";
    var dir = actorDef && actorDef.sortDir === "asc" ? 1 : -1;
    function score(item) {
      if (!item) {
        return 0;
      }
      if (sortBy === "stakes") { return item.stakes || 0; }
      if (sortBy === "fightsCount") { return item.fightsCount || 0; }
      if (sortBy === "lastWeek") { return item.lastWeek || 0; }
      return item.tension || 0;
    }
    sorted.sort(function (left, right) {
      return (score(left) - score(right)) * dir;
    });
    return sorted;
  }

  function rivalryEligible(rivalry, conditions, week) {
    if (!rivalry || !rivalry.lastOpponentSnapshot || rivalry.active === false) {
      return false;
    }
    if (typeof rivalry.holdUntilWeek === "number" && rivalry.holdUntilWeek > week) {
      return false;
    }
    if (conditions.requiresRivalry && !rivalry.id) {
      return false;
    }
    if (typeof conditions.minRivalryTension === "number" && (rivalry.tension || 0) < conditions.minRivalryTension) {
      return false;
    }
    if (typeof conditions.maxRivalryTension === "number" && (rivalry.tension || 0) > conditions.maxRivalryTension) {
      return false;
    }
    if (typeof conditions.minRivalryFights === "number" && (rivalry.fightsCount || 0) < conditions.minRivalryFights) {
      return false;
    }
    if (conditions.pendingRematchOnly && !rivalry.pendingRematch) {
      return false;
    }
    return true;
  }

  function contextHasEligibleRivalry(context, conditions) {
    var rivalries = listRivalries(context.world);
    var i;
    for (i = 0; i < rivalries.length; i += 1) {
      if (rivalryEligible(rivalries[i], conditions, context.week)) {
        return true;
      }
    }
    return false;
  }

  function pickRoleActor(context, actorDef, rngState) {
    var npcs = context.world && context.world.npcs instanceof Array ? context.world.npcs : [];
    var candidates = [];
    var i;
    var picked;
    for (i = 0; i < npcs.length; i += 1) {
      if (npcs[i] && npcs[i].role === actorDef.role) {
        candidates.push(npcs[i]);
      }
    }
    if (!candidates.length) {
      return null;
    }
    if (actorDef.sortBy) {
      candidates = sortNpcCandidates(context.world, candidates, actorDef);
      picked = candidates[0];
    } else {
      picked = RNG.choice(rngState, candidates);
    }
    return picked ? {
      id: picked.id,
      role: picked.role,
      name: picked.name,
      country: picked.country
    } : null;
  }

  function pickRivalryActor(context, actorDef, rngState) {
    var rivalries = listRivalries(context.world);
    var candidates = [];
    var i;
    var picked;
    for (i = 0; i < rivalries.length; i += 1) {
      if (rivalryEligible(rivalries[i], context.arcConditions || {}, context.week)) {
        candidates.push(rivalries[i]);
      }
    }
    if (!candidates.length) {
      return null;
    }
    if (actorDef.sortBy) {
      candidates = sortRivalryCandidates(candidates, actorDef);
      picked = candidates[0];
    } else {
      picked = RNG.choice(rngState, candidates);
    }
    return picked ? {
      id: picked.id,
      role: "rivalry",
      name: picked.opponentName || "Старый враг",
      country: picked.countryKey || "",
      rivalryId: picked.id,
      opponentKey: picked.opponentKey || "",
      lastOpponentSnapshot: clone(picked.lastOpponentSnapshot)
    } : null;
  }

  function resolveStartActors(template, context, rngState) {
    var actorDefs = template && template.actors instanceof Array ? template.actors : [];
    var actorMap = {};
    var i;
    var actor;
    for (i = 0; i < actorDefs.length; i += 1) {
      if (actorDefs[i].type === "rivalry") {
        actor = pickRivalryActor(context, actorDefs[i], rngState);
      } else {
        actor = pickRoleActor(context, actorDefs[i], rngState);
      }
      if (!actor) {
        if (actorDefs[i].required) {
          return null;
        }
        continue;
      }
      actorMap[actorDefs[i].slot] = actor;
    }
    return actorMap;
  }

  function hydrateArcActors(world, arcState) {
    var actorMap = {};
    var key;
    var stored;
    var npc;
    var rivalry;
    if (!arcState || !arcState.actors) {
      return actorMap;
    }
    for (key in arcState.actors) {
      if (arcState.actors.hasOwnProperty(key)) {
        stored = arcState.actors[key];
        if (!stored) {
          continue;
        }
        if (stored.rivalryId) {
          rivalry = findRivalryById(world, stored.rivalryId);
          actorMap[key] = clone(stored);
          if (rivalry) {
            actorMap[key].name = rivalry.opponentName || actorMap[key].name;
            actorMap[key].country = rivalry.countryKey || actorMap[key].country;
            actorMap[key].lastOpponentSnapshot = clone(rivalry.lastOpponentSnapshot || actorMap[key].lastOpponentSnapshot);
          }
        } else if (stored.id) {
          npc = findNpcById(world, stored.id);
          actorMap[key] = clone(stored);
          if (npc) {
            actorMap[key].name = npc.name;
            actorMap[key].country = npc.country;
            actorMap[key].role = npc.role;
          }
        }
      }
    }
    return actorMap;
  }

  function replaceTokens(text, actorMap) {
    var result = String(text || "");
    var key;
    if (!actorMap) {
      return result;
    }
    for (key in actorMap) {
      if (actorMap.hasOwnProperty(key)) {
        result = result.replace(new RegExp("\\{" + key + "\\}", "g"), actorMap[key].name || "кто-то");
      }
    }
    return result;
  }

  function triggerMatches(context, arcState, trigger) {
    var checks = trigger || {};
    if (!EventEngine.matchesConditions({ id: "__arc_stage__", conditions: checks }, context)) {
      return false;
    }
    if (typeof checks.minWeeksSinceStart === "number" && context.week - (arcState.startedWeek || context.week) < checks.minWeeksSinceStart) {
      return false;
    }
    if (typeof checks.minWeeksSinceLastStage === "number" && context.week - (arcState.lastStageWeek || context.week) < checks.minWeeksSinceLastStage) {
      return false;
    }
    if (checks.lastChoiceAny instanceof Array && !hasAny([arcState.lastChoiceId || ""], checks.lastChoiceAny)) {
      return false;
    }
    if (checks.arcTagsAny instanceof Array && !hasAny(arcState.tags || [], checks.arcTagsAny)) {
      return false;
    }
    if (checks.arcTagsAll instanceof Array && !hasAll(arcState.tags || [], checks.arcTagsAll)) {
      return false;
    }
    if (checks.arcTagsNot instanceof Array && hasAny(arcState.tags || [], checks.arcTagsNot)) {
      return false;
    }
    if ((checks.requiresRivalry || typeof checks.minRivalryTension === "number" || typeof checks.minRivalryFights === "number") && !contextHasEligibleRivalry(context, checks)) {
      return false;
    }
    return true;
  }

  function buildActiveEvent(arcState, template, stage, actorMap, context) {
    var choices = [];
    var i;
    for (i = 0; i < stage.choices.length; i += 1) {
      choices.push({
        id: stage.choices[i].id,
        label: replaceTokens(stage.choices[i].label, actorMap),
        effects: clone(stage.choices[i].effects || []),
        tagChanges: clone(stage.choices[i].tagChanges || null),
        nextStageId: stage.choices[i].nextStageId || "",
        outcome: stage.choices[i].outcome || ""
      });
    }
    return {
      id: "arc_" + arcState.id + "_" + stage.id,
      sourceType: "relationshipArc",
      arcId: arcState.id,
      arcTemplateId: template.id,
      arcStageId: stage.id,
      title: replaceTokens(stage.title || template.label, actorMap),
      text: replaceTokens(stage.text || "", actorMap),
      choices: choices,
      actors: clone(actorMap),
      week: context.week,
      tags: clone(arcState.tags || []),
      label: template.label || ""
    };
  }

  function createArcState(template, actorMap, context, rngState) {
    var firstStage = template && template.stages && template.stages.length ? template.stages[0] : null;
    var rivalryId = "";
    var key;
    for (key in actorMap) {
      if (actorMap.hasOwnProperty(key) && actorMap[key] && actorMap[key].rivalryId) {
        rivalryId = actorMap[key].rivalryId;
        break;
      }
    }
    return {
      id: template.id + "_" + context.week + "_" + RNG.int(rngState, 1000, 9999),
      templateId: template.id,
      label: template.label || "",
      status: "active",
      startedWeek: context.week,
      lastStageWeek: context.week,
      currentStageId: firstStage ? firstStage.id : "",
      lastChoiceId: "",
      outcome: "",
      tags: [],
      actors: clone(actorMap),
      history: [{
        week: context.week,
        type: "started",
        stageId: firstStage ? firstStage.id : "",
        text: template.label || ""
      }],
      rivalryId: rivalryId
    };
  }

  function pickFromCandidates(candidates, rngState) {
    var total = 0;
    var i;
    var weight;
    var roll;
    for (i = 0; i < candidates.length; i += 1) {
      weight = typeof candidates[i].weight === "number" ? Math.max(1, candidates[i].weight) : 1;
      total += weight;
      candidates[i].totalWeight = total;
    }
    if (!candidates.length) {
      return null;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }
    roll = RNG.int(rngState, 1, total);
    for (i = 0; i < candidates.length; i += 1) {
      if (roll <= candidates[i].totalWeight) {
        return candidates[i];
      }
    }
    return candidates[candidates.length - 1];
  }

  function canStartTemplate(template, context, rngState) {
    var activeIds = activeTemplateIds(context.world);
    var actorMap;
    if (!template || !(template.stages instanceof Array) || !template.stages.length) {
      return null;
    }
    if (hasAny(activeIds, [template.id])) {
      return null;
    }
    if ((template.once || template.repeatable === false) && isArcOnceResolved(context.world, template.id)) {
      return null;
    }
    if (isArcOnCooldown(context.world, template.id, context.week, template.cooldown)) {
      return null;
    }
    if (!EventEngine.matchesConditions({ id: "__arc_start__", conditions: template.startConditions || {} }, context)) {
      return null;
    }
    if (((template.startConditions && template.startConditions.requiresRivalry) || (template.startConditions && typeof template.startConditions.minRivalryTension === "number") || (template.startConditions && typeof template.startConditions.minRivalryFights === "number")) &&
        !contextHasEligibleRivalry(context, template.startConditions || {})) {
      return null;
    }
    context.arcConditions = template.startConditions || {};
    actorMap = resolveStartActors(template, context, rngState);
    context.arcConditions = null;
    if (template.actors && !actorMap) {
      return null;
    }
    return actorMap || {};
  }

  function pickEvent(gameState, templates, rngState) {
    var context = EventEngine.buildContext(gameState);
    var activeArcs = context.world && context.world.relationshipArcs instanceof Array ? context.world.relationshipArcs : [];
    var candidates = [];
    var i;
    var template;
    var stage;
    var actorMap;
    var arcState;
    var picked;

    for (i = 0; i < activeArcs.length; i += 1) {
      arcState = activeArcs[i];
      if (!arcState || arcState.status !== "active") {
        continue;
      }
      template = findTemplate(templates, arcState.templateId);
      stage = findStage(template, arcState.currentStageId);
      if (!template || !stage || !(stage.choices instanceof Array) || !stage.choices.length) {
        continue;
      }
      if (!triggerMatches(context, arcState, stage.trigger || {})) {
        continue;
      }
      actorMap = hydrateArcActors(context.world, arcState);
      candidates.push({
        started: false,
        arcState: arcState,
        template: template,
        stage: stage,
        actors: actorMap,
        weight: typeof stage.weight === "number" ? stage.weight : template.weight || 1
      });
    }

    if (candidates.length) {
      picked = pickFromCandidates(candidates, rngState);
      return {
        started: false,
        arcState: picked.arcState,
        event: buildActiveEvent(picked.arcState, picked.template, picked.stage, picked.actors, context)
      };
    }

    candidates = [];
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      actorMap = canStartTemplate(template, context, rngState);
      if (!actorMap) {
        continue;
      }
      arcState = createArcState(template, actorMap, context, rngState);
      stage = findStage(template, arcState.currentStageId);
      if (!stage) {
        continue;
      }
      candidates.push({
        started: true,
        arcState: arcState,
        template: template,
        stage: stage,
        actors: actorMap,
        weight: template.weight || 1
      });
    }

    if (!candidates.length) {
      return null;
    }

    picked = pickFromCandidates(candidates, rngState);
    return {
      started: true,
      arcState: picked.arcState,
      event: buildActiveEvent(picked.arcState, picked.template, picked.stage, picked.actors, context)
    };
  }

  function applyChoice(world, activeEvent, choice, templates, currentWeek) {
    var arcState = findArcById(world, activeEvent.arcId);
    var template = findTemplate(templates, activeEvent.arcTemplateId);
    var nextStage = choice && choice.nextStageId ? findStage(template, choice.nextStageId) : null;
    var key = template ? templateKey(template.id) : "";
    var filteredTags = [];
    var i;
    if (!arcState || !template || !choice) {
      return null;
    }
    arcState.lastChoiceId = choice.id || "";
    arcState.lastStageWeek = currentWeek;
    arcState.history = arcState.history instanceof Array ? arcState.history : [];
    arcState.history.unshift({
      week: currentWeek,
      type: "choice",
      stageId: activeEvent.arcStageId || arcState.currentStageId,
      choiceId: choice.id || "",
      outcome: choice.outcome || "",
      text: choice.label || ""
    });
    if (arcState.history.length > 12) {
      arcState.history = arcState.history.slice(0, 12);
    }
    if (choice.tagChanges && choice.tagChanges.arcTags) {
      if (choice.tagChanges.arcTags.add instanceof Array) {
        arcState.tags = uniqueStrings((arcState.tags || []).concat(choice.tagChanges.arcTags.add));
      }
      if (choice.tagChanges.arcTags.remove instanceof Array && choice.tagChanges.arcTags.remove.length) {
        for (i = 0; i < (arcState.tags || []).length; i += 1) {
          if (!hasAny(choice.tagChanges.arcTags.remove, [arcState.tags[i]])) {
            filteredTags.push(arcState.tags[i]);
          }
        }
        arcState.tags = uniqueStrings(filteredTags);
      }
    }
    if (nextStage) {
      arcState.currentStageId = nextStage.id;
      arcState.status = "active";
    } else {
      arcState.currentStageId = "";
      arcState.status = "resolved";
      arcState.outcome = choice.outcome || "resolved";
      if (world && world.eventState) {
        world.eventState.cooldowns = world.eventState.cooldowns || {};
        world.eventState.cooldowns[key] = currentWeek;
        if (template.once || template.repeatable === false) {
          world.eventState.onceResolved = uniqueStrings((world.eventState.onceResolved || []).concat([key]));
        }
      }
    }
    return {
      resolved: arcState.status !== "active",
      arcState: arcState,
      template: template
    };
  }

  return {
    pickEvent: pickEvent,
    applyChoice: applyChoice
  };
}());
