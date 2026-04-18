import { readCachedValue, writeCachedValue } from "./cacheService";
import {
  createAdminUnauthorizedError,
  notifyAdminUnauthorized
} from "./adminSessionGuard";

function getDashboardCacheKey(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return `admin-dashboard:${params.toString() || "default"}`;
}

function getLiveRequestsCacheKey() {
  return "admin-dashboard:live-requests";
}

async function parseJsonResponse(response, fallbackMessage) {
  if (response.status === 401) {
    notifyAdminUnauthorized();
    throw createAdminUnauthorizedError();
  }

  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    payload = {
      message: fallbackMessage
    };
  }

  if (!response.ok) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload;
}

export function getCachedAdminDashboardStats(filters = {}) {
  return readCachedValue(getDashboardCacheKey(filters), {
    maxAgeMs: 1000 * 60 * 5
  });
}

export async function getAdminDashboardStats(filters = {}) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`/api/admin/protected/dashboard?${query.toString()}`, {
    credentials: "include"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger le dashboard."
  );

  writeCachedValue(getDashboardCacheKey(filters), payload.stats);
  return payload.stats;
}

export function getCachedAdminDashboardLiveRequests() {
  return readCachedValue(getLiveRequestsCacheKey(), {
    maxAgeMs: 1000 * 30
  });
}

export async function getAdminDashboardLiveRequests() {
  const response = await fetch("/api/admin/protected/dashboard/live-requests", {
    credentials: "include"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger les statistiques de demandes."
  );

  writeCachedValue(getLiveRequestsCacheKey(), payload.requestRanges);
  return payload.requestRanges;
}
