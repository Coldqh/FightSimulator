import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function removeTarget(relativePath) {
  const targetPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, {
    recursive: true,
    force: true
  });

  console.log("removed " + relativePath);
}

const cleanIndexHtml = String.raw`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#111827">
  <title>Fight Simulator</title>
  <link rel="manifest" href="manifest.webmanifest">
  <style>
    :root {
      --bg: #080a0f;
      --panel: #111827;
      --panel-soft: #172033;
      --panel-strong: #1f2937;
      --text: #f9fafb;
      --muted: #9ca3af;
      --line: rgba(255, 255, 255, 0.10);
      --good: #86efac;
      --bad: #fca5a5;
      --warn: #fcd34d;
      --accent: #93c5fd;
      --button: #243044;
      --button-hover: #334155;
      --shadow: 0 18px 70px rgba(0, 0, 0, 0.32);
      --radius: 22px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 32rem),
        radial-gradient(circle at bottom right, rgba(248, 113, 113, 0.10), transparent 28rem),
        var(--bg);
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button,
    input,
    select {
      font: inherit;
    }

    button {
      border: 1px solid var(--line);
      background: var(--button);
      color: var(--text);
      border-radius: 14px;
      padding: 10px 14px;
      cursor: pointer;
      transition: 0.12s ease;
    }

    button:hover {
      background: var(--button-hover);
      transform: translateY(-1px);
    }

    button.primary {
      background: #2563eb;
      border-color: rgba(147, 197, 253, 0.55);
    }

    button.danger {
      background: rgba(185, 28, 28, 0.75);
      border-color: rgba(252, 165, 165, 0.38);
    }

    button.ghost {
      background: transparent;
    }

    input,
    select {
      width: 100%;
      border: 1px solid var(--line);
      background: #0f172a;
      color: var(--text);
      border-radius: 14px;
      padding: 11px 12px;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: rgba(147, 197, 253, 0.7);
    }

    .app {
      width: min(1220px, calc(100% - 28px));
      margin: 0 auto;
      padding: 24px 0 42px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .brand h1 {
      margin: 0;
      font-size: clamp(24px, 4vw, 40px);
      letter-spacing: -0.04em;
    }

    .brand span {
      color: var(--muted);
      font-size: 14px;
    }

    .layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 18px;
    }

    .panel {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent), var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 18px;
    }

    .panel h2,
    .panel h3 {
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }

    .muted {
      color: var(--muted);
    }

    .small {
      font-size: 13px;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .grid {
      display: grid;
      gap: 12px;
    }

    .grid.two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .card {
      border: 1px solid var(--line);
      background: var(--panel-soft);
      border-radius: 18px;
      padding: 14px;
    }

    .card.strong {
      background: var(--panel-strong);
    }

    .label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .value {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .tabs button.active {
      background: #2563eb;
      border-color: rgba(147, 197, 253, 0.6);
    }

    .offer {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
    }

    .offer-title {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent);
      border: 1px solid rgba(147, 197, 253, 0.25);
      background: rgba(37, 99, 235, 0.14);
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 12px;
    }

    .person {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid var(--line);
      padding: 10px 0;
    }

    .person:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .result {
      border: 1px solid rgba(147, 197, 253, 0.25);
      background: rgba(37, 99, 235, 0.10);
      border-radius: 18px;
      padding: 13px 14px;
    }

    .good {
      color: var(--good);
    }

    .bad {
      color: var(--bad);
    }

    .warn {
      color: var(--warn);
    }

    .start {
      min-height: calc(100vh - 48px);
      display: grid;
      place-items: center;
    }

    .start-card {
      width: min(720px, 100%);
    }

    .footer-note {
      margin-top: 16px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.5;
    }

    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .grid.two,
      .grid.three {
        grid-template-columns: 1fr;
      }

      .offer {
        grid-template-columns: 1fr;
      }

      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <main id="app" class="app"></main>

  <script>
    (function () {
      "use strict";

      var APP_VERSION = "clean-core-0.1.0";
      var SAVE_KEY = "fight_simulator_clean_core_save_v1";

      var TRACKS = {
        street: {
          id: "street",
          label: "Улица",
          short: "УЛ",
          maxStat: 150
        },
        amateur: {
          id: "amateur",
          label: "Любители",
          short: "ЛБ",
          maxStat: 100
        },
        pro: {
          id: "pro",
          label: "Профи",
          short: "ПР",
          maxStat: 200
        }
      };

      var COUNTRIES = [
        {
          id: "russia",
          label: "Россия",
          city: "Москва",
          firstNames: ["Дмитрий", "Артем", "Илья", "Максим", "Никита", "Кирилл", "Егор", "Роман", "Павел", "Алексей", "Сергей", "Владислав"],
          lastNames: ["Васильев", "Морозов", "Орлов", "Павлов", "Козлов", "Волков", "Иванов", "Кузнецов", "Соколов", "Лебедев", "Федоров", "Комаров"]
        },
        {
          id: "mexico",
          label: "Мексика",
          city: "Мехико",
          firstNames: ["Diego", "Mateo", "Santiago", "Emilio", "Carlos", "Luis", "Javier", "Miguel", "Rafael", "Andres", "Hector", "Nico"],
          lastNames: ["Garcia", "Lopez", "Hernandez", "Martinez", "Ramirez", "Santos", "Vargas", "Castillo", "Morales", "Cruz", "Reyes", "Ortega"]
        },
        {
          id: "japan",
          label: "Япония",
          city: "Токио",
          firstNames: ["Haruto", "Ren", "Sota", "Yuto", "Daiki", "Kaito", "Riku", "Takumi", "Shin", "Hayate", "Akira", "Toma"],
          lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Kato", "Yamamoto", "Mori", "Aoki"]
        }
      ];

      var ROLE_LABELS = {
        coach: "Тренер",
        clubmate: "Одноклубник",
        rival: "Знакомый соперник",
        promoter: "Организатор",
        doctor: "Врач"
      };

      var state = loadState();

      function getCountry(countryId) {
        var i;

        for (i = 0; i < COUNTRIES.length; i += 1) {
          if (COUNTRIES[i].id === countryId) {
            return COUNTRIES[i];
          }
        }

        return COUNTRIES[0];
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function escapeHtml(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function uid(prefix) {
        return prefix + "_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
      }

      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function pick(list) {
        return list[randomInt(0, list.length - 1)];
      }

      function rating(stats) {
        return Math.round((stats.power + stats.technique + stats.speed + stats.stamina + stats.defense) / 5);
      }

      function recordText(record) {
        return record.wins + "-" + record.losses + "-" + record.draws + " · KO " + record.kos;
      }

      function makeName(country, indexSeed) {
        var firstIndex = (indexSeed * 5 + randomInt(0, country.firstNames.length - 1)) % country.firstNames.length;
        var lastIndex = (indexSeed * 7 + randomInt(0, country.lastNames.length - 1)) % country.lastNames.length;

        return country.firstNames[firstIndex] + " " + country.lastNames[lastIndex];
      }

      function makeStats(trackId, base) {
        var cap = TRACKS[trackId].maxStat;

        return {
          power: clamp(base + randomInt(-4, 5), 1, cap),
          technique: clamp(base + randomInt(-4, 5), 1, cap),
          speed: clamp(base + randomInt(-4, 5), 1, cap),
          stamina: clamp(base + randomInt(-4, 5), 1, cap),
          defense: clamp(base + randomInt(-4, 5), 1, cap)
        };
      }

      function makeFighter(countryId, trackId, indexSeed, base) {
        var country = getCountry(countryId);
        var name = makeName(country, indexSeed);

        return {
          id: uid("fighter"),
          name: name,
          countryId: countryId,
          trackId: trackId,
          stats: makeStats(trackId, base),
          record: {
            wins: randomInt(0, 8),
            losses: randomInt(0, 4),
            draws: randomInt(0, 1),
            kos: randomInt(0, 4)
          }
        };
      }

      function makeRoster(player) {
        var roster = [];
        var countryIndex;
        var trackId;
        var trackKeys = Object.keys(TRACKS);
        var i;
        var base;

        for (countryIndex = 0; countryIndex < COUNTRIES.length; countryIndex += 1) {
          for (i = 0; i < trackKeys.length; i += 1) {
            for (base = 0; base < 12; base += 1) {
              roster.push(makeFighter(COUNTRIES[countryIndex].id, trackKeys[i], countryIndex * 1000 + i * 100 + base, 28 + base * 3));
            }
          }
        }

        roster.push({
          id: player.id,
          name: player.name,
          countryId: player.countryId,
          trackId: player.trackId,
          stats: player.stats,
          record: player.record,
          isPlayer: true
        });

        return roster;
      }

      function makePeople(countryId) {
        var country = getCountry(countryId);

        return [
          {
            id: uid("person"),
            role: "coach",
            name: makeName(country, 11),
            note: "Ведёт тренировки в зале."
          },
          {
            id: uid("person"),
            role: "clubmate",
            name: makeName(country, 22),
            note: "Тренируется рядом с тобой."
          },
          {
            id: uid("person"),
            role: "rival",
            name: makeName(country, 33),
            note: "Периодически попадается на местных боях."
          },
          {
            id: uid("person"),
            role: "promoter",
            name: makeName(country, 44),
            note: "Помогает находить бои."
          },
          {
            id: uid("person"),
            role: "doctor",
            name: makeName(country, 55),
            note: "Следит за допуском к боям."
          }
        ];
      }

      function createCareer(form) {
        var player = {
          id: "player",
          name: form.name || "Новый боксёр",
          countryId: form.countryId || "russia",
          trackId: form.trackId || "amateur",
          stats: makeStats(form.trackId || "amateur", 35),
          record: {
            wins: 0,
            losses: 0,
            draws: 0,
            kos: 0
          }
        };

        state = {
          version: APP_VERSION,
          week: 1,
          screen: "home",
          selectedTab: "offers",
          player: player,
          roster: makeRoster(player),
          people: makePeople(player.countryId),
          offers: [],
          lastResult: "Карьера создана. Мир загружен в чистом режиме.",
          createdAt: new Date().toISOString()
        };

        refreshOffers();
        saveState();
        render();
      }

      function loadState() {
        var raw;

        try {
          raw = localStorage.getItem(SAVE_KEY);

          if (!raw) {
            return null;
          }

          return JSON.parse(raw);
        } catch (error) {
          return null;
        }
      }

      function saveState() {
        if (!state) {
          localStorage.removeItem(SAVE_KEY);
          return;
        }

        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      }

      function resetCareer() {
        localStorage.removeItem(SAVE_KEY);
        state = null;
        render();
      }

      function syncPlayerIntoRoster() {
        var i;

        for (i = 0; i < state.roster.length; i += 1) {
          if (state.roster[i].id === state.player.id) {
            state.roster[i].name = state.player.name;
            state.roster[i].countryId = state.player.countryId;
            state.roster[i].trackId = state.player.trackId;
            state.roster[i].stats = state.player.stats;
            state.roster[i].record = state.player.record;
            return;
          }
        }

        state.roster.push({
          id: state.player.id,
          name: state.player.name,
          countryId: state.player.countryId,
          trackId: state.player.trackId,
          stats: state.player.stats,
          record: state.player.record,
          isPlayer: true
        });
      }

      function buildOfferOpponent(index) {
        var sameCountry = [];
        var i;
        var candidate;
        var opponent;

        for (i = 0; i < state.roster.length; i += 1) {
          candidate = state.roster[i];

          if (!candidate || candidate.isPlayer) {
            continue;
          }

          if (candidate.countryId === state.player.countryId && candidate.trackId === state.player.trackId) {
            sameCountry.push(candidate);
          }
        }

        sameCountry.sort(function (left, right) {
          return Math.abs(rating(left.stats) - rating(state.player.stats)) - Math.abs(rating(right.stats) - rating(state.player.stats));
        });

        opponent = sameCountry[index];

        if (!opponent) {
          opponent = makeFighter(state.player.countryId, state.player.trackId, 9000 + index + state.week * 10, rating(state.player.stats) + index * 4);
          state.roster.push(opponent);
        }

        return opponent;
      }

      function refreshOffers() {
        var labels = {
          street: ["Дворовый бой", "Районный вызов", "Бой на местной площадке"],
          amateur: ["Любительский бой", "Бой городского уровня", "Матч отбора"],
          pro: ["Профессиональный андеркард", "Контрактный бой", "Главный бой вечера"]
        };
        var i;
        var opponent;

        state.offers = [];

        for (i = 0; i < 3; i += 1) {
          opponent = buildOfferOpponent(i);

          state.offers.push({
            id: uid("offer"),
            label: labels[state.player.trackId][i],
            opponentId: opponent.id,
            countryId: state.player.countryId,
            trackId: state.player.trackId,
            rounds: state.player.trackId === "pro" ? 8 : (state.player.trackId === "amateur" ? 3 : 4)
          });
        }
      }

      function getFighter(fighterId) {
        var i;

        for (i = 0; i < state.roster.length; i += 1) {
          if (state.roster[i].id === fighterId) {
            return state.roster[i];
          }
        }

        return null;
      }

      function resolveFight(offerId) {
        var offer = null;
        var opponent;
        var playerScore;
        var opponentScore;
        var winChance;
        var roll;
        var result;
        var method;
        var i;

        for (i = 0; i < state.offers.length; i += 1) {
          if (state.offers[i].id === offerId) {
            offer = state.offers[i];
            break;
          }
        }

        if (!offer) {
          return;
        }

        opponent = getFighter(offer.opponentId);

        if (!opponent) {
          return;
        }

        playerScore = rating(state.player.stats) + state.player.record.wins * 0.7;
        opponentScore = rating(opponent.stats) + opponent.record.wins * 0.7;
        winChance = clamp(50 + Math.round((playerScore - opponentScore) * 2.2), 12, 88);
        roll = randomInt(1, 100);

        if (Math.abs(playerScore - opponentScore) <= 2 && randomInt(1, 100) <= 8) {
          result = "draw";
          method = "решение судей";
          state.player.record.draws += 1;
          opponent.record.draws += 1;
        } else if (roll <= winChance) {
          result = "win";
          method = randomInt(1, 100) <= 22 ? "KO/TKO" : "решение судей";
          state.player.record.wins += 1;
          opponent.record.losses += 1;

          if (method === "KO/TKO") {
            state.player.record.kos += 1;
          }
        } else {
          result = "loss";
          method = randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
          state.player.record.losses += 1;
          opponent.record.wins += 1;

          if (method === "KO/TKO") {
            opponent.record.kos += 1;
          }
        }

        state.lastResult = "Неделя " + state.week + ": " + state.player.name + " vs " + opponent.name + " — " + resultLabel(result) + ", " + method + ".";
        state.week += 1;

        refreshOffers();
        syncPlayerIntoRoster();
        saveState();
        render();
      }

      function resultLabel(result) {
        if (result === "win") {
          return "победа";
        }

        if (result === "loss") {
          return "поражение";
        }

        return "ничья";
      }

      function trainWeek() {
        var keys = ["power", "technique", "speed", "stamina", "defense"];
        var key = pick(keys);
        var cap = TRACKS[state.player.trackId].maxStat;

        state.player.stats[key] = clamp(state.player.stats[key] + 1, 1, cap);
        state.week += 1;
        state.lastResult = "Неделя проведена в зале. Улучшен навык: " + statLabel(key) + ".";
        refreshOffers();
        syncPlayerIntoRoster();
        saveState();
        render();
      }

      function passWeek() {
        state.week += 1;
        state.lastResult = "Неделя пропущена. Бои обновлены.";
        refreshOffers();
        syncPlayerIntoRoster();
        saveState();
        render();
      }

      function setTrack(trackId) {
        if (!TRACKS[trackId]) {
          return;
        }

        state.player.trackId = trackId;
        state.lastResult = "Путь изменён: " + TRACKS[trackId].label + ".";
        refreshOffers();
        syncPlayerIntoRoster();
        saveState();
        render();
      }

      function setCountry(countryId) {
        if (!getCountry(countryId)) {
          return;
        }

        state.player.countryId = countryId;
        state.people = makePeople(countryId);
        state.lastResult = "Страна изменена: " + getCountry(countryId).label + ".";
        refreshOffers();
        syncPlayerIntoRoster();
        saveState();
        render();
      }

      function statLabel(key) {
        var labels = {
          power: "Сила",
          technique: "Техника",
          speed: "Скорость",
          stamina: "Выносливость",
          defense: "Защита"
        };

        return labels[key] || key;
      }

      function renderStart() {
        var countryOptions = COUNTRIES.map(function (country) {
          return "<option value='" + escapeHtml(country.id) + "'>" + escapeHtml(country.label) + "</option>";
        }).join("");

        document.getElementById("app").innerHTML =
          "<section class='start'>" +
            "<div class='panel start-card'>" +
              "<div class='brand'>" +
                "<h1>Fight Simulator</h1>" +
                "<span>Чистое ядро: быстрое создание карьеры, 3 боя в каждой стране, минимум систем.</span>" +
              "</div>" +
              "<div class='grid two' style='margin-top:18px'>" +
                "<label class='stack'>" +
                  "<span class='label'>Имя бойца</span>" +
                  "<input id='startName' value='Влад' maxlength='32'>" +
                "</label>" +
                "<label class='stack'>" +
                  "<span class='label'>Страна</span>" +
                  "<select id='startCountry'>" + countryOptions + "</select>" +
                "</label>" +
                "<label class='stack'>" +
                  "<span class='label'>Стартовый путь</span>" +
                  "<select id='startTrack'>" +
                    "<option value='amateur' selected>Любители</option>" +
                    "<option value='street'>Улица</option>" +
                    "<option value='pro'>Профи</option>" +
                  "</select>" +
                "</label>" +
              "</div>" +
              "<div class='row' style='margin-top:18px'>" +
                "<button class='primary' data-action='create-career'>Начать карьеру</button>" +
              "</div>" +
              "<div class='footer-note'>В этой версии нет славы, токсичности, отношений, травм, жилья, турниров, спаррингов, истории и архивов. Только базовая карьера и бои.</div>" +
            "</div>" +
          "</section>";
      }

      function renderHeader() {
        var country = getCountry(state.player.countryId);

        return "<div class='topbar'>" +
          "<div class='brand'>" +
            "<h1>Fight Simulator</h1>" +
            "<span>Неделя " + state.week + " · " + escapeHtml(country.label) + " · " + escapeHtml(TRACKS[state.player.trackId].label) + "</span>" +
          "</div>" +
          "<div class='row'>" +
            "<button class='ghost' data-action='pass-week'>Следующая неделя</button>" +
            "<button class='danger' data-action='reset-career'>Сбросить</button>" +
          "</div>" +
        "</div>";
      }

      function renderSidebar() {
        var player = state.player;
        var countryOptions = COUNTRIES.map(function (country) {
          return "<option value='" + escapeHtml(country.id) + "'" + (country.id === player.countryId ? " selected" : "") + ">" + escapeHtml(country.label) + "</option>";
        }).join("");
        var trackOptions = Object.keys(TRACKS).map(function (trackId) {
          return "<option value='" + escapeHtml(trackId) + "'" + (trackId === player.trackId ? " selected" : "") + ">" + escapeHtml(TRACKS[trackId].label) + "</option>";
        }).join("");

        return "<aside class='panel stack'>" +
          "<h2>" + escapeHtml(player.name) + "</h2>" +
          "<div class='grid two'>" +
            "<div class='card'>" +
              "<div class='label'>Рекорд</div>" +
              "<div class='value'>" + escapeHtml(recordText(player.record)) + "</div>" +
            "</div>" +
            "<div class='card'>" +
              "<div class='label'>Рейтинг</div>" +
              "<div class='value'>" + rating(player.stats) + "</div>" +
            "</div>" +
          "</div>" +
          "<div class='card'>" +
            "<div class='label'>Навыки</div>" +
            "<div class='small'>Сила: " + player.stats.power + "</div>" +
            "<div class='small'>Техника: " + player.stats.technique + "</div>" +
            "<div class='small'>Скорость: " + player.stats.speed + "</div>" +
            "<div class='small'>Выносливость: " + player.stats.stamina + "</div>" +
            "<div class='small'>Защита: " + player.stats.defense + "</div>" +
          "</div>" +
          "<label class='stack'>" +
            "<span class='label'>Страна</span>" +
            "<select data-action='set-country'>" + countryOptions + "</select>" +
          "</label>" +
          "<label class='stack'>" +
            "<span class='label'>Путь</span>" +
            "<select data-action='set-track'>" + trackOptions + "</select>" +
          "</label>" +
          "<button class='primary' data-action='train-week'>Тренировка</button>" +
        "</aside>";
      }

      function renderTabs() {
        var tabs = [
          ["offers", "Бои"],
          ["people", "Люди"],
          ["rankings", "Рейтинг"]
        ];

        return "<div class='tabs'>" + tabs.map(function (tab) {
          return "<button class='" + (state.selectedTab === tab[0] ? "active" : "") + "' data-tab='" + tab[0] + "'>" + tab[1] + "</button>";
        }).join("") + "</div>";
      }

      function renderOffers() {
        return "<div class='stack'>" +
          state.offers.map(function (offer) {
            var opponent = getFighter(offer.opponentId);

            return "<div class='card strong offer'>" +
              "<div>" +
                "<div class='offer-title'>" + escapeHtml(offer.label) + "</div>" +
                "<div class='muted'>Соперник: " + escapeHtml(opponent ? opponent.name : "Неизвестный боец") + " · рейтинг " + (opponent ? rating(opponent.stats) : "?") + "</div>" +
                "<div class='row' style='margin-top:8px'>" +
                  "<span class='pill'>" + escapeHtml(TRACKS[offer.trackId].label) + "</span>" +
                  "<span class='pill'>" + offer.rounds + " раунда</span>" +
                "</div>" +
              "</div>" +
              "<button class='primary' data-fight='" + escapeHtml(offer.id) + "'>Провести бой</button>" +
            "</div>";
          }).join("") +
        "</div>";
      }

      function renderPeople() {
        return "<div class='card strong'>" +
          "<h3>Знакомые люди</h3>" +
          "<div class='muted small'>Пока только отображение. Без отношений, шкал и взаимодействий.</div>" +
          "<div style='margin-top:10px'>" +
            state.people.map(function (person) {
              return "<div class='person'>" +
                "<div>" +
                  "<strong>" + escapeHtml(person.name) + "</strong>" +
                  "<div class='muted small'>" + escapeHtml(person.note) + "</div>" +
                "</div>" +
                "<span class='pill'>" + escapeHtml(ROLE_LABELS[person.role] || person.role) + "</span>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</div>";
      }

      function renderRankings() {
        var list = state.roster.filter(function (fighter) {
          return fighter.countryId === state.player.countryId && fighter.trackId === state.player.trackId;
        }).sort(function (left, right) {
          return rating(right.stats) - rating(left.stats);
        }).slice(0, 12);

        return "<div class='card strong'>" +
          "<h3>Рейтинг страны</h3>" +
          "<div class='muted small'>Упрощённый рейтинг текущей страны и текущего пути.</div>" +
          "<div style='margin-top:10px'>" +
            list.map(function (fighter, index) {
              return "<div class='person'>" +
                "<div>" +
                  "<strong>#" + (index + 1) + " " + escapeHtml(fighter.name) + (fighter.isPlayer ? " <span class='warn'>ты</span>" : "") + "</strong>" +
                  "<div class='muted small'>" + escapeHtml(recordText(fighter.record)) + "</div>" +
                "</div>" +
                "<span class='pill'>Рейтинг " + rating(fighter.stats) + "</span>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</div>";
      }

      function renderMain() {
        var content;

        if (state.selectedTab === "people") {
          content = renderPeople();
        } else if (state.selectedTab === "rankings") {
          content = renderRankings();
        } else {
          content = renderOffers();
        }

        return "<section class='panel'>" +
          renderTabs() +
          "<div class='result' style='margin-bottom:14px'>" + escapeHtml(state.lastResult || "Готово.") + "</div>" +
          content +
        "</section>";
      }

      function renderGame() {
        document.getElementById("app").innerHTML =
          renderHeader() +
          "<div class='layout'>" +
            renderSidebar() +
            renderMain() +
          "</div>";
      }

      function render() {
        if (!state) {
          renderStart();
          return;
        }

        if (!state.offers || state.offers.length !== 3) {
          refreshOffers();
          saveState();
        }

        renderGame();
      }

      document.addEventListener("click", function (event) {
        var target = event.target.closest("button");

        if (!target) {
          return;
        }

        if (target.dataset.action === "create-career") {
          createCareer({
            name: document.getElementById("startName").value.trim(),
            countryId: document.getElementById("startCountry").value,
            trackId: document.getElementById("startTrack").value
          });
        } else if (target.dataset.action === "reset-career") {
          resetCareer();
        } else if (target.dataset.action === "train-week") {
          trainWeek();
        } else if (target.dataset.action === "pass-week") {
          passWeek();
        } else if (target.dataset.tab) {
          state.selectedTab = target.dataset.tab;
          saveState();
          render();
        } else if (target.dataset.fight) {
          resolveFight(target.dataset.fight);
        }
      });

      document.addEventListener("change", function (event) {
        var target = event.target;

        if (!target || !target.dataset) {
          return;
        }

        if (target.dataset.action === "set-country") {
          setCountry(target.value);
        } else if (target.dataset.action === "set-track") {
          setTrack(target.value);
        }
      });

      render();
    }());
  </script>
</body>
</html>
`;

const cleanManifest = String.raw`{
  "name": "Fight Simulator",
  "short_name": "FightSim",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#080a0f",
  "theme_color": "#111827",
  "lang": "ru",
  "orientation": "portrait"
}
`;

const versionJson = JSON.stringify({
  version: "clean-core-0.1.0",
  mode: "clean-core",
  updatedAt: new Date().toISOString()
}, null, 2) + "\n";

const runtimeRemovalTargets = [
  "src",
  "data",
  "country_data.js",
  "game_data.js",
  "fight_simulator.hta",
  "launch_ui.bat",
  "MOBILE_DEPLOY.md",
  "ring_top_view.png"
];

runtimeRemovalTargets.forEach(removeTarget);

writeFile("index.html", cleanIndexHtml);
writeFile("manifest.webmanifest", cleanManifest);
writeFile("version.json", versionJson);

console.log("clean core reset completed");
console.log("runtime now uses only index.html + manifest.webmanifest + version.json");