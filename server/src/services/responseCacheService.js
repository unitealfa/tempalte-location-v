const cacheStore = new Map();

function getNow() {
  return Date.now();
}

function readResponseCache(key) {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= getNow()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
}

function writeResponseCache(key, value, ttlMs) {
  cacheStore.set(key, {
    value,
    expiresAt: getNow() + Math.max(0, Number(ttlMs) || 0)
  });

  return value;
}

async function getOrSetResponseCache(key, ttlMs, resolver) {
  const cachedValue = readResponseCache(key);

  if (cachedValue !== null) {
    return cachedValue;
  }

  const value = await resolver();
  return writeResponseCache(key, value, ttlMs);
}

function clearResponseCacheByPrefix(prefix) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

function clearResponseCacheByPrefixes(prefixes) {
  prefixes.forEach(clearResponseCacheByPrefix);
}

module.exports = {
  readResponseCache,
  writeResponseCache,
  getOrSetResponseCache,
  clearResponseCacheByPrefix,
  clearResponseCacheByPrefixes
};
