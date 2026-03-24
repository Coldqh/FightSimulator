var SaveManager = (function () {
  var CHUNK_SIZE = 180000;

  function getStorage() {
    try {
      if (window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {}
    return null;
  }

  function load(key, migrateFn) {
    var storage = getStorage();
    var raw;
    var parsed;
    var chunkRaw;
    var i;
    if (!storage) {
      return null;
    }
    try {
      raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      parsed = JSON.parse(raw);
      if (parsed && parsed.__chunkedSave === true && parsed.parts > 0) {
        raw = "";
        for (i = 0; i < parsed.parts; i += 1) {
          chunkRaw = storage.getItem(key + "::part::" + i);
          if (typeof chunkRaw !== "string") {
            return null;
          }
          raw += chunkRaw;
        }
        parsed = JSON.parse(raw);
      }
      return typeof migrateFn === "function" ? migrateFn(parsed) : parsed;
    } catch (error) {
      return null;
    }
  }

  function save(key, payload) {
    return saveRaw(key, JSON.stringify(payload));
  }

  function saveRaw(key, payloadText) {
    var storage = getStorage();
    var text;
    var parts;
    var i;
    if (!storage) {
      return false;
    }
    try {
      text = String(payloadText || "");
      if (text.length <= CHUNK_SIZE) {
        removeChunks(storage, key);
        storage.setItem(key, text);
        return true;
      }
      parts = Math.ceil(text.length / CHUNK_SIZE);
      for (i = 0; i < parts; i += 1) {
        storage.setItem(key + "::part::" + i, text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
      }
      storage.setItem(key, JSON.stringify({
        __chunkedSave: true,
        parts: parts
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeChunks(storage, key) {
    var manifestRaw;
    var manifest;
    var i;
    if (!storage) {
      return;
    }
    try {
      manifestRaw = storage.getItem(key);
      if (!manifestRaw) {
        return;
      }
      manifest = JSON.parse(manifestRaw);
      if (!manifest || manifest.__chunkedSave !== true || !(manifest.parts > 0)) {
        return;
      }
      for (i = 0; i < manifest.parts; i += 1) {
        storage.removeItem(key + "::part::" + i);
      }
    } catch (error) {}
  }

  function remove(key) {
    var storage = getStorage();
    if (!storage) {
      return false;
    }
    try {
      removeChunks(storage, key);
      storage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  return {
    getStorage: getStorage,
    load: load,
    save: save,
    saveRaw: saveRaw,
    remove: remove
  };
}());
