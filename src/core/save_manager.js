var SaveManager = (function () {
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
    if (!storage) {
      return null;
    }
    try {
      raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      parsed = JSON.parse(raw);
      return typeof migrateFn === "function" ? migrateFn(parsed) : parsed;
    } catch (error) {
      return null;
    }
  }

  function save(key, payload) {
    var storage = getStorage();
    if (!storage) {
      return false;
    }
    try {
      storage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (error) {
      return false;
    }
  }

  function remove(key) {
    var storage = getStorage();
    if (!storage) {
      return false;
    }
    try {
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
    remove: remove
  };
}());
