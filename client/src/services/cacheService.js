const CACHE_PREFIX = "lea-cache:";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function buildCacheKey(key) {
  return CACHE_PREFIX + key;
}

export function readCachedValue(key, options = {}) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(buildCacheKey(key));

    if (!rawValue) {
      return null;
    }

    const payload = JSON.parse(rawValue);

    if (!payload || typeof payload !== "object") {
      return null;
    }

    if (
      Number.isFinite(options.maxAgeMs) &&
      Number.isFinite(payload.cachedAt) &&
      Date.now() - payload.cachedAt > options.maxAgeMs
    ) {
      return null;
    }

    return payload.value ?? null;
  } catch (error) {
    return null;
  }
}

export function writeCachedValue(key, value) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      buildCacheKey(key),
      JSON.stringify({
        cachedAt: Date.now(),
        value
      })
    );
  } catch (error) {
  }
}

export function removeCachedValue(key) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(buildCacheKey(key));
  } catch (error) {
  }
}
