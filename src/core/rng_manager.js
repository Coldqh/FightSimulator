var RNG = (function () {
  var MODULUS = 2147483647;
  var MULTIPLIER = 48271;

  function hashSeed(input) {
    var text = String(input == null ? "" : input);
    var hash = 2166136261;
    var i;
    for (i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    hash = (hash >>> 0) % (MODULUS - 1);
    return hash + 1;
  }

  function normalizeSeed(seed) {
    var numeric = Number(seed);
    if (isFinite(numeric)) {
      numeric = Math.floor(Math.abs(numeric));
      numeric = numeric % (MODULUS - 1);
      return numeric + 1;
    }
    return hashSeed(seed);
  }

  function createNativeState() {
    return {
      mode: "native",
      seed: null,
      value: null,
      label: "Math.random"
    };
  }

  function createSeededState(seed, label) {
    var normalized = normalizeSeed(seed);
    return {
      mode: "seeded",
      seed: normalized,
      value: normalized,
      label: label == null ? String(seed) : String(label)
    };
  }

  function cloneState(rngState) {
    if (!rngState || rngState.mode !== "seeded") {
      return createNativeState();
    }
    return {
      mode: "seeded",
      seed: normalizeSeed(rngState.seed),
      value: normalizeSeed(rngState.value || rngState.seed),
      label: rngState.label || String(rngState.seed)
    };
  }

  function normalizeState(rngState) {
    return cloneState(rngState);
  }

  function describe(rngState) {
    if (!rngState || rngState.mode !== "seeded") {
      return "Math.random";
    }
    return rngState.label || String(rngState.seed);
  }

  function next(rngState) {
    if (!rngState || rngState.mode !== "seeded") {
      return Math.random();
    }
    rngState.value = (rngState.value * MULTIPLIER) % MODULUS;
    return rngState.value / MODULUS;
  }

  function int(rngState, min, max) {
    return Math.floor(next(rngState) * (max - min + 1)) + min;
  }

  function chance(rngState, percent) {
    return int(rngState, 1, 100) <= percent;
  }

  function choice(rngState, list) {
    if (!list || !list.length) {
      return null;
    }
    return list[int(rngState, 0, list.length - 1)];
  }

  return {
    hashSeed: hashSeed,
    createNativeState: createNativeState,
    createSeededState: createSeededState,
    cloneState: cloneState,
    normalizeState: normalizeState,
    describe: describe,
    next: next,
    int: int,
    chance: chance,
    choice: choice
  };
}());
