var StreetCareerEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
  }

  function dataRoot() {
    return typeof STREET_CAREER_DATA !== "undefined" && STREET_CAREER_DATA ? STREET_CAREER_DATA : {
      organizationTypes: [],
      ladderStages: [],
      districtTemplates: [],
      offerTemplates: [],
      reputationTags: [],
      mediaTemplates: [],
      transitionRules: {}
    };
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId) : null;
  }

  function playerRoot(gameState) {
    if (!gameState.player || typeof gameState.player !== "object") {
      gameState.player = {};
    }
    if (!gameState.player.street || typeof gameState.player.street !== "object") {
      gameState.player.street = {};
    }
    return gameState.player.street;
  }

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function organizationRoot(gameState) {
    if (!gameState.organizationState || typeof gameState.organizationState !== "object") {
      gameState.organizationState = {
        id: "organization_state_main",
        organizationIds: [],
        organizationsById: {},
        rankingTableIds: [],
        rankingTablesById: {},
        teamIds: [],
        teamsById: {}
      };
    }
    if (!(gameState.organizationState.organizationIds instanceof Array)) {
      gameState.organizationState.organizationIds = [];
    }
    if (!gameState.organizationState.organizationsById || typeof gameState.organizationState.organizationsById !== "object") {
      gameState.organizationState.organizationsById = {};
    }
    if (!(gameState.organizationState.rankingTableIds instanceof Array)) {
      gameState.organizationState.rankingTableIds = [];
    }
    if (!gameState.organizationState.rankingTablesById || typeof gameState.organizationState.rankingTablesById !== "object") {
      gameState.organizationState.rankingTablesById = {};
    }
    return gameState.organizationState;
  }

  function playerEntityId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
  }

  function getFighterById(gameState, fighterId) {
    var roster = rosterRoot(gameState);
    return roster && roster.fightersById ? roster.fightersById[fighterId] || null : null;
  }

  function playerEntity(gameState) {
    return getFighterById(gameState, playerEntityId(gameState));
  }

  function currentTrackId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.currentTrackId || "street" : "street";
  }

  function districtTemplates() {
    return clone(dataRoot().districtTemplates || []);
  }

  function listDistricts(countryId) {
    var country = getCountry(countryId) || { id: countryId || "", city: "" };
    var templates = districtTemplates();
    var result = [];
    var i;
    for (i = 0; i < templates.length; i += 1) {
      result.push({
        id: stableId("district", [country.id || "world", templates[i].id]),
        key: templates[i].id,
        countryId: country.id || "",
        city: country.city || "",
        label: templates[i].label,
        sceneLabel: templates[i].sceneLabel,
        venueLabel: templates[i].venueLabel,
        organizerLabel: templates[i].organizerLabel
      });
    }
    return result;
  }

  function districtById(countryId, districtId) {
    var districts = listDistricts(countryId);
    var i;
    for (i = 0; i < districts.length; i += 1) {
      if (districts[i].id === districtId) {
        return districts[i];
      }
    }
    return districts.length ? districts[0] : null;
  }

  function ladderStages() {
    return clone(dataRoot().ladderStages || []);
  }

  function stageIndexById(stageId) {
    var stages = ladderStages();
    var i;
    for (i = 0; i < stages.length; i += 1) {
      if (stages[i] && stages[i].id === stageId) {
        return i;
      }
    }
    return -1;
  }

  function currentStageByRating(streetRating) {
    var stages = ladderStages();
    var current = stages.length ? stages[0] : null;
    var i;
    for (i = 0; i < stages.length; i += 1) {
      if (typeof stages[i].minRating === "number" && streetRating >= stages[i].minRating) {
        current = stages[i];
      }
    }
    return current;
  }

  function nextStageFor(stageId) {
    var stages = ladderStages();
    var index = stageIndexById(stageId);
    if (index >= 0 && index + 1 < stages.length) {
      return stages[index + 1];
    }
    return null;
  }

  function transitionRules() {
    return clone(dataRoot().transitionRules || {});
  }

  function baseStreetState(countryId, city) {
    var district = listDistricts(countryId)[0] || null;
    var stage = currentStageByRating(0);
    return {
      id: "player_street_main",
      streetRating: 0,
      districtId: district ? district.id : "",
      cityStreetStanding: 0,
      nationalStreetStanding: 0,
      undergroundTitles: [],
      localPromoterIds: [],
      undergroundPressureTags: [],
      currentSceneId: district ? stableId("street_scene", [countryId || "", district.key]) : "",
      currentStatusId: stage ? stage.id : "neighborhood_unknown",
      history: []
    };
  }

  function normalizeStreetState(streetState, countryId, city) {
    var normalized = clone(baseStreetState(countryId, city));
    var district;
    var stage;
    if (streetState && typeof streetState === "object") {
      if (typeof streetState.streetRating === "number") { normalized.streetRating = streetState.streetRating; }
      if (typeof streetState.cityStreetStanding === "number") { normalized.cityStreetStanding = streetState.cityStreetStanding; }
      if (typeof streetState.nationalStreetStanding === "number") { normalized.nationalStreetStanding = streetState.nationalStreetStanding; }
      normalized.districtId = streetState.districtId || normalized.districtId;
      normalized.undergroundTitles = streetState.undergroundTitles instanceof Array ? clone(streetState.undergroundTitles) : normalized.undergroundTitles;
      normalized.localPromoterIds = streetState.localPromoterIds instanceof Array ? clone(streetState.localPromoterIds) : normalized.localPromoterIds;
      normalized.undergroundPressureTags = streetState.undergroundPressureTags instanceof Array ? clone(streetState.undergroundPressureTags) : normalized.undergroundPressureTags;
      normalized.currentSceneId = streetState.currentSceneId || normalized.currentSceneId;
      normalized.currentStatusId = streetState.currentStatusId || normalized.currentStatusId;
      normalized.history = streetState.history instanceof Array ? clone(streetState.history) : normalized.history;
    }
    district = districtById(countryId, normalized.districtId);
    if (district) {
      normalized.districtId = district.id;
      normalized.currentSceneId = stableId("street_scene", [countryId || "", district.key]);
    }
    stage = currentStageByRating(normalized.streetRating || 0);
    normalized.currentStatusId = stage ? stage.id : normalized.currentStatusId;
    return normalized;
  }

  function ensureFighterStreetData(fighter, countryId) {
    var district;
    var stage;
    if (!fighter || typeof fighter !== "object") {
      return null;
    }
    if (typeof fighter.streetRating !== "number") {
      fighter.streetRating = 0;
    }
    if (!fighter.streetData || typeof fighter.streetData !== "object") {
      fighter.streetData = {};
    }
    district = districtById(countryId || fighter.country || "", fighter.streetData.districtId || fighter.districtId || "");
    stage = currentStageByRating(fighter.streetRating || 0);
    fighter.streetData.districtId = district ? district.id : "";
    fighter.streetData.cityStreetStanding = typeof fighter.streetData.cityStreetStanding === "number" ? fighter.streetData.cityStreetStanding : 0;
    fighter.streetData.nationalStreetStanding = typeof fighter.streetData.nationalStreetStanding === "number" ? fighter.streetData.nationalStreetStanding : 0;
    fighter.streetData.undergroundTitles = fighter.streetData.undergroundTitles instanceof Array ? fighter.streetData.undergroundTitles : [];
    fighter.streetData.localPromoterIds = fighter.streetData.localPromoterIds instanceof Array ? fighter.streetData.localPromoterIds : [];
    fighter.streetData.undergroundPressureTags = fighter.streetData.undergroundPressureTags instanceof Array ? fighter.streetData.undergroundPressureTags : [];
    fighter.streetData.currentSceneId = district ? stableId("street_scene", [countryId || fighter.country || "", district.key]) : "";
    fighter.streetData.currentStatusId = stage ? stage.id : "neighborhood_unknown";
    fighter.districtId = fighter.streetData.districtId;
    fighter.cityStreetStanding = fighter.streetData.cityStreetStanding;
    fighter.nationalStreetStanding = fighter.streetData.nationalStreetStanding;
    fighter.undergroundTitles = clone(fighter.streetData.undergroundTitles);
    fighter.localPromoterIds = clone(fighter.streetData.localPromoterIds);
    fighter.undergroundPressureTags = clone(fighter.streetData.undergroundPressureTags);
    fighter.currentStreetSceneId = fighter.streetData.currentSceneId;
    fighter.streetStatusId = fighter.streetData.currentStatusId;
    return fighter.streetData;
  }

  function applyPlayerStreetToEntity(gameState) {
    var entity = playerEntity(gameState);
    var profile = gameState && gameState.player ? gameState.player.profile || {} : {};
    var street = playerRoot(gameState);
    if (!entity) {
      return null;
    }
    entity.streetRating = street.streetRating || 0;
    ensureFighterStreetData(entity, profile.currentCountry || profile.homeCountry || entity.country);
    entity.streetData.districtId = street.districtId || entity.streetData.districtId;
    entity.streetData.cityStreetStanding = typeof street.cityStreetStanding === "number" ? street.cityStreetStanding : entity.streetData.cityStreetStanding;
    entity.streetData.nationalStreetStanding = typeof street.nationalStreetStanding === "number" ? street.nationalStreetStanding : entity.streetData.nationalStreetStanding;
    entity.streetData.undergroundTitles = clone(street.undergroundTitles || []);
    entity.streetData.localPromoterIds = clone(street.localPromoterIds || []);
    entity.streetData.undergroundPressureTags = clone(street.undergroundPressureTags || []);
    entity.streetData.currentSceneId = street.currentSceneId || entity.streetData.currentSceneId;
    entity.streetData.currentStatusId = street.currentStatusId || entity.streetData.currentStatusId;
    return entity;
  }

  function applyEntityStreetToPlayer(gameState) {
    var entity = playerEntity(gameState);
    var profile = gameState && gameState.player ? gameState.player.profile || {} : {};
    var street = normalizeStreetState(playerRoot(gameState), profile.currentCountry || profile.homeCountry || (entity ? entity.country : ""), "");
    if (entity) {
      ensureFighterStreetData(entity, profile.currentCountry || profile.homeCountry || entity.country);
      street.streetRating = typeof entity.streetRating === "number" ? entity.streetRating : street.streetRating;
      street.districtId = entity.streetData.districtId || street.districtId;
      street.cityStreetStanding = entity.streetData.cityStreetStanding || 0;
      street.nationalStreetStanding = entity.streetData.nationalStreetStanding || 0;
      street.undergroundTitles = clone(entity.streetData.undergroundTitles || []);
      street.localPromoterIds = clone(entity.streetData.localPromoterIds || []);
      street.undergroundPressureTags = clone(entity.streetData.undergroundPressureTags || []);
      street.currentSceneId = entity.streetData.currentSceneId || street.currentSceneId;
      street.currentStatusId = entity.streetData.currentStatusId || street.currentStatusId;
    }
    gameState.player.street = street;
    return street;
  }

  function listStreetFighters(gameState, countryId) {
    var roster = rosterRoot(gameState);
    var result = [];
    var fighterIds;
    var i;
    var fighter;
    if (!roster || !(roster.fighterIds instanceof Array)) {
      return result;
    }
    fighterIds = roster.fighterIds;
    for (i = 0; i < fighterIds.length; i += 1) {
      fighter = roster.fightersById[fighterIds[i]];
      if (!fighter || fighter.status === "retired") {
        continue;
      }
      if ((fighter.currentTrack || fighter.trackId || "street") !== "street") {
        continue;
      }
      if (countryId && fighter.country !== countryId) {
        continue;
      }
      result.push(fighter);
    }
    return result;
  }

  function sortByStreetStanding(list) {
    list.sort(function (left, right) {
      var leftScore = (left.streetRating || 0) + Math.round((left.fame || 0) * 0.4);
      var rightScore = (right.streetRating || 0) + Math.round((right.fame || 0) * 0.4);
      return rightScore - leftScore;
    });
    return list;
  }

  function ensureOrganizations(gameState) {
    var root = organizationRoot(gameState);
    var countries = listCountries();
    var templates = districtTemplates();
    var i;
    var j;
    var country;
    var template;
    var sceneId;
    var venueId;
    var organizerId;
    var stableIdValue;
    for (i = 0; i < countries.length; i += 1) {
      country = countries[i];
      for (j = 0; j < templates.length; j += 1) {
        template = templates[j];
        sceneId = stableId("street_scene", [country.id, template.id]);
        venueId = stableId("street_venue", [country.id, template.id]);
        organizerId = stableId("street_organizer", [country.id, template.id]);
        stableIdValue = stableId("street_stable", [country.id, template.id]);
        if (!root.organizationsById[sceneId]) {
          root.organizationIds.push(sceneId);
          root.organizationsById[sceneId] = {
            id: sceneId,
            name: country.city + " - " + template.sceneLabel,
            country: country.id,
            city: country.city || "",
            type: "district_scene",
            trackId: "street",
            reputation: 18 + j * 7,
            tags: ["street", "district_scene", template.id]
          };
        }
        if (!root.organizationsById[venueId]) {
          root.organizationIds.push(venueId);
          root.organizationsById[venueId] = {
            id: venueId,
            name: template.venueLabel,
            country: country.id,
            city: country.city || "",
            type: "underground_venue",
            trackId: "street",
            reputation: 22 + j * 8,
            tags: ["street", "underground_venue", template.id]
          };
        }
        if (!root.organizationsById[organizerId]) {
          root.organizationIds.push(organizerId);
          root.organizationsById[organizerId] = {
            id: organizerId,
            name: template.organizerLabel,
            country: country.id,
            city: country.city || "",
            type: "local_organizer",
            trackId: "street",
            reputation: 24 + j * 8,
            tags: ["street", "local_organizer", template.id]
          };
        }
        if (!root.organizationsById[stableIdValue]) {
          root.organizationIds.push(stableIdValue);
          root.organizationsById[stableIdValue] = {
            id: stableIdValue,
            name: country.city + " - " + "\u0423\u043b\u0438\u0447\u043d\u0430\u044f \u043a\u043e\u043c\u0430\u043d\u0434\u0430 " + (j + 1),
            country: country.id,
            city: country.city || "",
            type: "street_stable",
            trackId: "street",
            reputation: 20 + j * 6,
            tags: ["street", "street_stable", template.id]
          };
        }
      }
    }
  }

  function refreshStreetStandings(gameState) {
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var national = [];
    var i;
    var j;
    var country;
    var local;
    var fighter;
    if (!roster) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter) {
        continue;
      }
      ensureFighterStreetData(fighter, fighter.country);
      if ((fighter.currentTrack || fighter.trackId || "street") === "street") {
        national.push(fighter);
      }
    }
    sortByStreetStanding(national);
    for (i = 0; i < national.length; i += 1) {
      national[i].streetData.nationalStreetStanding = i + 1;
      national[i].nationalStreetStanding = i + 1;
      national[i].streetData.currentStatusId = (currentStageByRating(national[i].streetRating || 0) || { id: "neighborhood_unknown" }).id;
      national[i].streetStatusId = national[i].streetData.currentStatusId;
    }
    for (i = 0; i < countries.length; i += 1) {
      country = countries[i];
      local = listStreetFighters(gameState, country.id);
      sortByStreetStanding(local);
      for (j = 0; j < local.length; j += 1) {
        local[j].streetData.cityStreetStanding = j + 1;
        local[j].cityStreetStanding = j + 1;
      }
    }
    applyEntityStreetToPlayer(gameState);
  }

  function ensureRosterStreetData(gameState) {
    var roster = rosterRoot(gameState);
    var i;
    var fighter;
    if (!roster) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter) {
        continue;
      }
      ensureFighterStreetData(fighter, fighter.country);
    }
  }

  function currentPlayerStage(gameState) {
    var street = ensureState(gameState);
    return currentStageByRating(street.streetRating || 0);
  }

  function ensureState(gameState) {
    var profile = gameState && gameState.player ? gameState.player.profile || {} : {};
    var street = normalizeStreetState(playerRoot(gameState), profile.currentCountry || profile.homeCountry || "", "");
    gameState.player.street = street;
    ensureOrganizations(gameState);
    ensureRosterStreetData(gameState);
    applyPlayerStreetToEntity(gameState);
    refreshStreetStandings(gameState);
    return gameState.player.street;
  }

  function addStreetHistory(street, entry) {
    if (!(street.history instanceof Array)) {
      street.history = [];
    }
    street.history.unshift(clone(entry));
    if (street.history.length > 20) {
      street.history = street.history.slice(0, 20);
    }
  }

  function titleLabelForStage(stageId, cityLabel) {
    if (stageId === "district_contender") { return cityLabel + " - " + "\u0418\u043c\u044f \u0440\u0430\u0439\u043e\u043d\u0430"; }
    if (stageId === "city_underground_regular") { return cityLabel + " - " + "\u0413\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0435 \u0438\u043c\u044f"; }
    if (stageId === "regional_underground_contender") { return "\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u044b\u0439 \u043f\u0440\u0435\u0442\u0435\u043d\u0434\u0435\u043d\u0442"; }
    if (stageId === "national_underground_icon") { return "\u041d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u0438\u043a\u043e\u043d\u0430 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u044f"; }
    if (stageId === "street_legend") { return "\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u0443\u043b\u0438\u0446"; }
    return "";
  }

  function resolveStatusPromotion(street, countryId, weekValue) {
    var stage = currentStageByRating(street.streetRating || 0);
    var previousIndex = stageIndexById(street.currentStatusId || "");
    var currentIndex = stageIndexById(stage ? stage.id : "");
    var country = getCountry(countryId) || { city: "" };
    var titleLabel = "";
    var result = null;
    if (stage) {
      street.currentStatusId = stage.id;
    }
    if (currentIndex > previousIndex && stage) {
      titleLabel = titleLabelForStage(stage.id, country.city || "");
      result = {
        stage: clone(stage),
        titleLabel: titleLabel
      };
      if (titleLabel) {
        if (!(street.undergroundTitles instanceof Array)) {
          street.undergroundTitles = [];
        }
        if (street.undergroundTitles.indexOf(titleLabel) === -1) {
          street.undergroundTitles.push(titleLabel);
        }
      }
      addStreetHistory(street, {
        week: weekValue || 1,
        type: "stage_up",
        stageId: stage.id,
        label: stage.label
      });
    }
    return result;
  }

  function applyFightResult(gameState, payload) {
    var info = payload || {};
    var street = ensureState(gameState);
    var profile = gameState && gameState.player ? gameState.player.profile || {} : {};
    var offer = info.offer || {};
    var ratingDelta = 0;
    var promotion;
    var titleAward = "";
    var notices = [];
    var media = [];
    if ((offer.trackId || currentTrackId(gameState)) !== "street") {
      return { notices: notices, media: media };
    }
    if (info.result === "win") {
      ratingDelta = typeof offer.streetRatingWin === "number" ? offer.streetRatingWin : 10;
      if (info.method && String(info.method).indexOf("KO") !== -1) {
        ratingDelta += 3;
      }
    } else if (info.result === "loss") {
      ratingDelta = typeof offer.streetRatingLoss === "number" ? offer.streetRatingLoss : -4;
    } else {
      ratingDelta = typeof offer.streetRatingDraw === "number" ? offer.streetRatingDraw : 2;
    }
    street.streetRating = Math.max(0, (street.streetRating || 0) + ratingDelta);
    applyPlayerStreetToEntity(gameState);
    promotion = resolveStatusPromotion(street, profile.currentCountry || profile.homeCountry || "", info.week || 1);
    refreshStreetStandings(gameState);
    if (promotion && promotion.stage) {
      notices.push("\u041d\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0443\u043b\u0438\u0446: " + promotion.stage.label + ".");
      media.push({ type: "event", payload: { eventTitle: promotion.stage.label, tags: ["street_rank_up"] } });
      if (promotion.titleLabel) {
        titleAward = promotion.titleLabel;
        notices.push("\u041d\u043e\u0432\u044b\u0439 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u044b\u0439 \u0441\u0442\u0430\u0442\u0443\u0441: " + titleAward + ".");
        media.push({ type: "event", payload: { eventTitle: titleAward, tags: ["street_title"] } });
      }
    }
    addStreetHistory(street, {
      week: info.week || 1,
      type: "fight",
      result: info.result || "draw",
      method: info.method || "",
      ratingDelta: ratingDelta,
      label: offer.label || ""
    });
    applyPlayerStreetToEntity(gameState);
    return {
      ratingDelta: ratingDelta,
      titleAward: titleAward,
      notices: notices,
      media: media,
      street: clone(gameState.player.street)
    };
  }

  function canMoveToAmateur(gameState) {
    var street = ensureState(gameState);
    return (street.streetRating || 0) >= (transitionRules().amateurReturnMinStreetRating || 20);
  }

  function canMoveToProDirect(gameState) {
    var street = ensureState(gameState);
    var age = gameState && gameState.worldState && gameState.worldState.timeline ? gameState.worldState.timeline.playerAgeYears || 16 : 16;
    var fame = gameState && gameState.player && gameState.player.resources ? gameState.player.resources.fame || 0 : 0;
    return age >= (transitionRules().directProMinAge || 18) &&
      (street.streetRating || 0) >= (transitionRules().directProMinStreetRating || 100) &&
      fame >= (transitionRules().directProMinFame || 18);
  }

  function canReturnToStreet(gameState) {
    var losses = gameState && gameState.player && gameState.player.record ? gameState.player.record.losses || 0 : 0;
    return currentTrackId(gameState) === "pro" && losses >= (transitionRules().proFallbackMinLosses || 4);
  }

  function switchPlayerTrack(gameState, nextTrackId, weekValue, note) {
    var tracks;
    var entity;
    if (!gameState || !gameState.playerState || !gameState.playerState.careerTrack || !gameState.playerState.careerTrack.tracks) {
      return false;
    }
    tracks = gameState.playerState.careerTrack.tracks;
    if (!tracks[nextTrackId]) {
      return false;
    }
    gameState.playerState.currentTrackId = nextTrackId;
    gameState.playerState.careerTrack.currentTrackId = nextTrackId;
    tracks.street.active = nextTrackId === "street";
    tracks.amateur.active = nextTrackId === "amateur";
    tracks.pro.active = nextTrackId === "pro";
    tracks[nextTrackId].unlocked = true;
    if (!tracks[nextTrackId].enteredWeek) {
      tracks[nextTrackId].enteredWeek = weekValue || 1;
    }
    if (!(gameState.playerState.careerTrack.switches instanceof Array)) {
      gameState.playerState.careerTrack.switches = [];
    }
    gameState.playerState.careerTrack.switches.unshift({
      week: weekValue || 1,
      trackId: nextTrackId,
      note: note || ""
    });
    if (gameState.playerState.careerTrack.switches.length > 16) {
      gameState.playerState.careerTrack.switches = gameState.playerState.careerTrack.switches.slice(0, 16);
    }
    if (gameState.player && gameState.player.biography && gameState.player.biography.flags instanceof Array && nextTrackId === "street") {
      if (gameState.player.biography.flags.indexOf("left_amateur_path_for_streets") === -1) {
        gameState.player.biography.flags.push("left_amateur_path_for_streets");
      }
    }
    entity = playerEntity(gameState);
    if (entity) {
      entity.currentTrack = nextTrackId;
      entity.trackId = nextTrackId;
    }
    return true;
  }

  function currentSummary(gameState) {
    var street = ensureState(gameState);
    var stage = currentPlayerStage(gameState);
    var nextStage = nextStageFor(stage ? stage.id : "");
    var profile = gameState && gameState.player ? gameState.player.profile || {} : {};
    var district = districtById(profile.currentCountry || profile.homeCountry || "", street.districtId);
    return {
      streetRating: street.streetRating || 0,
      districtLabel: district ? district.label : "",
      sceneLabel: district ? district.sceneLabel : "",
      currentStatusId: stage ? stage.id : street.currentStatusId,
      currentStatusLabel: stage ? stage.label : "",
      cityStreetStanding: street.cityStreetStanding || 0,
      nationalStreetStanding: street.nationalStreetStanding || 0,
      undergroundTitles: clone(street.undergroundTitles || []),
      nextStatusLabel: nextStage ? nextStage.label : "",
      nextStatusNeed: nextStage ? Math.max(0, nextStage.minRating - (street.streetRating || 0)) : 0
    };
  }

  function runWeeklyPass(gameState) {
    ensureState(gameState);
    refreshStreetStandings(gameState);
    return currentSummary(gameState);
  }

  return {
    createStreetState: baseStreetState,
    normalizeStreetState: normalizeStreetState,
    ensureState: ensureState,
    ensureOrganizations: ensureOrganizations,
    listDistricts: listDistricts,
    getCurrentStage: currentPlayerStage,
    currentSummary: currentSummary,
    applyFightResult: applyFightResult,
    canMoveToAmateur: canMoveToAmateur,
    canMoveToProDirect: canMoveToProDirect,
    canReturnToStreet: canReturnToStreet,
    switchPlayerTrack: switchPlayerTrack,
    runWeeklyPass: runWeeklyPass
  };
}());
