(function () {
  "use strict";

  var LATEST_PATCH = "update-button-fix-2.3.2";
  var NOTICE_ID = "fightWorldUpdateNotice232";
  var checking = false;
  var remoteVersion = "";
  var remoteSeen = false;

  function currentVersion() {
    return String(window.FS && window.FS.Data && window.FS.Data.appVersion ? window.FS.Data.appVersion : "");
  }

  function versionNumber(text) {
    var match = String(text || "").match(/\d+(?:\.\d+){1,3}/);
    return match ? match[0] : String(text || "");
  }

  function removeNotice() {
    var old = document.getElementById(NOTICE_ID);
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }
  }

  function ensureStyles() {
    var style;
    if (document.getElementById("fightWorldUpdateStyles232")) {
      return;
    }

    style = document.createElement("style");
    style.id = "fightWorldUpdateStyles232";
    style.textContent = [
      ".fw-update-notice{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9000;transform:translateX(-50%);width:min(560px,calc(100vw - 18px));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid rgba(207,37,37,.42);border-radius:16px;background:linear-gradient(180deg,rgba(29,31,36,.98),rgba(13,14,17,.98));box-shadow:0 18px 44px rgba(0,0,0,.55)}",
      ".fw-update-text{min-width:0;display:grid;gap:2px}",
      ".fw-update-text strong{font-size:13px}",
      ".fw-update-text span{font-size:11px;color:var(--muted,#9ca3af)}",
      ".fw-update-actions{display:flex;gap:6px;align-items:center}",
      ".fw-update-actions button{min-height:30px;padding:7px 10px;border-radius:10px;font-size:12px}",
      "@media(max-width:640px){.fw-update-notice{grid-template-columns:1fr;gap:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px))}.fw-update-actions{display:grid;grid-template-columns:1fr 1fr}.fw-update-actions button{width:100%}}"
    ].join("\n");

    document.head.appendChild(style);
  }

  function showNotice(version) {
    var node;

    if (!document.body) {
      return;
    }

    ensureStyles();
    removeNotice();

    node = document.createElement("div");
    node.id = NOTICE_ID;
    node.className = "fw-update-notice";
    node.innerHTML =
      '<div class="fw-update-text">' +
        '<strong>Доступна новая версия</strong>' +
        '<span>Текущая: ' + versionNumber(currentVersion()) + ' · новая: ' + versionNumber(version || LATEST_PATCH) + '</span>' +
      '</div>' +
      '<div class="fw-update-actions">' +
        '<button class="primary" type="button" data-fw-update-now>Обновить</button>' +
        '<button class="small-btn" type="button" data-fw-update-later>Позже</button>' +
      '</div>';

    node.querySelector("[data-fw-update-now]").addEventListener("click", applyUpdate);
    node.querySelector("[data-fw-update-later]").addEventListener("click", removeNotice);

    document.body.appendChild(node);
  }

  function clearRuntimeCaches() {
    if (!window.caches || !caches.keys) {
      return Promise.resolve();
    }

    return caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return /^fight-simulator-/.test(key);
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).catch(function () {});
  }

  function skipWaitingIfPossible(registration) {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  function reloadFresh() {
    var url = new URL(window.location.href);
    url.searchParams.set("v", versionNumber(remoteVersion || LATEST_PATCH));
    url.searchParams.set("t", String(Date.now()));
    window.location.replace(url.toString());
  }

  function applyUpdate() {
    removeNotice();

    try {
      if (window.FS && FS.Storage && FS.Storage.save && FS.State && FS.State.player && window.__fightWorldState) {
        FS.Storage.save(window.__fightWorldState);
      }
    } catch (error) {}

    if (!("serviceWorker" in navigator)) {
      clearRuntimeCaches().then(reloadFresh);
      return;
    }

    navigator.serviceWorker.getRegistration().then(function (registration) {
      if (!registration) {
        return clearRuntimeCaches().then(reloadFresh);
      }

      return registration.update().catch(function () {
        return registration;
      }).then(function (updated) {
        skipWaitingIfPossible(updated || registration);
        return clearRuntimeCaches();
      }).then(function () {
        window.setTimeout(reloadFresh, 250);
      });
    }).catch(function () {
      clearRuntimeCaches().then(reloadFresh);
    });
  }

  function checkVersion() {
    if (checking || !navigator.onLine) {
      return;
    }

    checking = true;

    fetch("./version.json?updateCheck=" + Date.now(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    }).then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    }).then(function (data) {
      checking = false;
      if (!data || !data.version) {
        return;
      }

      remoteSeen = true;
      remoteVersion = String(data.version);

      if (remoteVersion !== currentVersion()) {
        showNotice(remoteVersion);
      }
    }).catch(function () {
      checking = false;
    });
  }

  function checkWaitingWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistration().then(function (registration) {
      if (registration && registration.waiting) {
        remoteVersion = remoteVersion || LATEST_PATCH;
        showNotice(remoteVersion);
      }
    }).catch(function () {});
  }

  window.FWCheckUpdate = checkVersion;
  window.FWApplyUpdate = applyUpdate;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      checkVersion();
      checkWaitingWorker();
    });
  } else {
    checkVersion();
    checkWaitingWorker();
  }

  window.addEventListener("load", function () {
    checkVersion();
    checkWaitingWorker();
    window.setTimeout(checkVersion, 1500);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkVersion();
      checkWaitingWorker();
    }
  });

  window.setInterval(function () {
    checkVersion();
    checkWaitingWorker();
  }, 2 * 60 * 1000);
}());
