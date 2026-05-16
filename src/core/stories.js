(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;

  function addStory(state, fighter, text, tag) {
    var entry;
    if (!fighter || !text) {
      return;
    }
    entry = {
      id: U.uid("story"),
      week: state.week,
      fighterId: fighter.id,
      fighterName: fighter.name,
      tag: tag || "story",
      text: text
    };
    U.pushLimited(state.world.stories, entry, 80);
    if (fighter.careerLog) {
      fighter.careerLog.unshift({ week: state.week, text: text });
    }
  }

  function hasFlag(fighter, flag) {
    return fighter.storyFlags && fighter.storyFlags.indexOf(flag) !== -1;
  }

  function addFlag(fighter, flag) {
    if (!(fighter.storyFlags instanceof Array)) {
      fighter.storyFlags = [];
    }
    if (!hasFlag(fighter, flag)) {
      fighter.storyFlags.push(flag);
    }
  }

  function simulateStories(state) {
    var i;
    var fighter;
    var rating;
    var checked = 0;

    for (i = 0; i < state.roster.length && checked < 35; i += 1) {
      fighter = state.roster[(i * 17 + state.week * 7) % state.roster.length];
      if (!fighter || fighter.isPlayer) {
        continue;
      }
      checked += 1;
      rating = U.statAverage(fighter.stats);

      if (rating >= 70 && !hasFlag(fighter, "breakout")) {
        addFlag(fighter, "breakout");
        addStory(state, fighter, "вышел на уровень большого проспекта.", "breakout");
        window.FS.World.createNews(state, "story", fighter.name + " вышел на уровень большого проспекта.", { type: "story" });
      }

      if (fighter.record.losses >= fighter.record.wins + 5 && !hasFlag(fighter, "falling")) {
        addFlag(fighter, "falling");
        addStory(state, fighter, "провалил серию боёв и оказался на развилке карьеры.", "falling");
      }

      if (fighter.titles && fighter.titles.length && !hasFlag(fighter, "champion_story")) {
        addFlag(fighter, "champion_story");
        addStory(state, fighter, "вошёл в список чемпионов мира Fight Simulator.", "champion");
      }
    }
  }

  function storiesForFighter(state, fighterId) {
    return state.world.stories.filter(function (story) {
      return story.fighterId === fighterId;
    });
  }

  window.FS.Stories = {
    addStory: addStory,
    simulateStories: simulateStories,
    storiesForFighter: storiesForFighter
  };
}());
