import { readCachedValue, writeCachedValue } from "./cacheService";
import {
  createAdminUnauthorizedError,
  notifyAdminUnauthorized
} from "./adminSessionGuard";

const PUBLIC_AVAILABILITY_CACHE_PREFIX = "reservation-availability:";
const ADMIN_RESERVATION_LIST_CACHE_PREFIX = "admin-reservations:";
const ADMIN_RESERVATION_DETAIL_CACHE_PREFIX = "admin-reservation:";
const ADMIN_RESERVATION_DEDUP_WINDOW_MS = 5000;

const adminReservationListRequests = new Map();
const adminReservationDetailRequests = new Map();
const adminReservationListFreshness = new Map();
const adminReservationDetailFreshness = new Map();

function getAvailabilityCacheKey(vehicleId) {
  return PUBLIC_AVAILABILITY_CACHE_PREFIX + String(vehicleId);
}

function getAdminReservationListCacheKey(scope) {
  return ADMIN_RESERVATION_LIST_CACHE_PREFIX + String(scope || "pending");
}

function getAdminReservationDetailCacheKey(id) {
  return ADMIN_RESERVATION_DETAIL_CACHE_PREFIX + String(id);
}

export function getCachedVehicleReservationAvailability(vehicleId) {
  const value = readCachedValue(getAvailabilityCacheKey(vehicleId), { maxAgeMs: 1000 * 60 * 5 });
  return Array.isArray(value) ? value : [];
}

export function hasCachedVehicleReservationAvailability(vehicleId) {
  return readCachedValue(getAvailabilityCacheKey(vehicleId), { maxAgeMs: 1000 * 60 * 5 }) !== null;
}

export function getCachedAdminReservations(scope = "pending") {
  const value = readCachedValue(getAdminReservationListCacheKey(scope), { maxAgeMs: 1000 * 60 * 5 });
  return Array.isArray(value) ? value : [];
}

export function hasCachedAdminReservations(scope = "pending") {
  return readCachedValue(getAdminReservationListCacheKey(scope), { maxAgeMs: 1000 * 60 * 5 }) !== null;
}

export function getCachedAdminReservationById(id) {
  return readCachedValue(getAdminReservationDetailCacheKey(id), { maxAgeMs: 1000 * 60 * 5 });
}

export function hasCachedAdminReservationById(id) {
  return readCachedValue(getAdminReservationDetailCacheKey(id), { maxAgeMs: 1000 * 60 * 5 }) !== null;
}

function writeAdminReservationDetailCache(reservation) {
  if (!reservation || !reservation.id) {
    return;
  }

  writeCachedValue(getAdminReservationDetailCacheKey(reservation.id), reservation);
  adminReservationDetailFreshness.set(String(reservation.id), Date.now());
}

function writeAdminReservationListCache(scope, reservations) {
  writeCachedValue(getAdminReservationListCacheKey(scope), reservations);
  adminReservationListFreshness.set(String(scope || "pending"), Date.now());
  (reservations || []).forEach(writeAdminReservationDetailCache);
}

function hasFreshAdminReservationList(scope) {
  const lastFetchedAt = adminReservationListFreshness.get(String(scope || "pending")) || 0;
  return Date.now() - lastFetchedAt < ADMIN_RESERVATION_DEDUP_WINDOW_MS;
}

function hasFreshAdminReservationDetail(id) {
  const lastFetchedAt = adminReservationDetailFreshness.get(String(id)) || 0;
  return Date.now() - lastFetchedAt < ADMIN_RESERVATION_DEDUP_WINDOW_MS;
}

export async function preloadAdminReservationCaches() {
  const [pendingReservations, acceptedReservations] = await Promise.all([
    listAdminReservations({ scope: "pending" }),
    listAdminReservations({ scope: "accepted" })
  ]);

  return {
    pendingReservations,
    acceptedReservations
  };
}

function normalizePublicApiErrorMessage(message, fallbackMessage) {
  const normalizedMessage = String(message || "").toLowerCase();

  if (
    normalizedMessage.includes("service admin") ||
    normalizedMessage.includes("admin est temporairement indisponible")
  ) {
    return fallbackMessage;
  }

  return message || fallbackMessage;
}

async function parseJsonResponse(response, fallbackMessage, { publicFacing = false } = {}) {
  if (response.status === 401) {
    notifyAdminUnauthorized();
    throw createAdminUnauthorizedError();
  }

  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    const nextMessage = publicFacing
      ? normalizePublicApiErrorMessage(payload.message, fallbackMessage)
      : payload.message || fallbackMessage;
    throw new Error(nextMessage || fallbackMessage);
  }

  return payload;
}

function appendReservationFormField(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildAdminReservationFormData(payload) {
  const formData = new FormData();

  [
    "vehicleId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "comment",
    "pickupLocationType",
    "returnLocationType",
    "pickupDatetime",
    "returnDatetime",
    "totalPrice"
  ].forEach((key) => appendReservationFormField(formData, key, payload[key]));

  formData.append(
    "privacyPolicyAccepted",
    payload.privacyPolicyAccepted ? "true" : "false"
  );

  for (const drivingLicensePhoto of payload.drivingLicensePhotos || []) {
    formData.append("drivingLicensePhoto", drivingLicensePhoto);
  }

  return formData;
}

export async function createVehicleReservation(vehicleId, payload) {
  const formData = new FormData();

  [
    "firstName",
    "lastName",
    "email",
    "phone",
    "comment",
    "pickupLocationType",
    "returnLocationType",
    "pickupDatetime",
    "returnDatetime"
  ].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null) {
      formData.append(field, String(payload[field]));
    }
  });

  formData.append(
    "privacyPolicyAccepted",
    payload.privacyPolicyAccepted ? "true" : "false"
  );

  for (const drivingLicensePhoto of payload.drivingLicensePhotos || []) {
    formData.append("drivingLicensePhoto", drivingLicensePhoto);
  }

  const response = await fetch(`/api/vehicles/${vehicleId}/reservations`, {
    method: "POST",
    body: formData
  });

  return parseJsonResponse(response, "Reservation impossible.", { publicFacing: true });
}

export async function getVehicleReservationAvailability(vehicleId) {
  const response = await fetch(
    `/api/vehicles/${vehicleId}/reservation-availability`
  );

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger les disponibilites du vehicule.",
    { publicFacing: true }
  );

  const reservations = payload.reservations || [];
  writeCachedValue(getAvailabilityCacheKey(vehicleId), reservations);
  return reservations;
}

export async function listAdminReservations({ scope = "pending" } = {}) {
  if (hasFreshAdminReservationList(scope)) {
    return getCachedAdminReservations(scope);
  }

  const requestKey = String(scope || "pending");

  if (adminReservationListRequests.has(requestKey)) {
    return adminReservationListRequests.get(requestKey);
  }

  const query = new URLSearchParams();

  if (scope) {
    query.set("scope", scope);
  }

  const requestPromise = (async () => {
    const response = await fetch(`/api/admin/reservations?${query.toString()}`, {
      credentials: "include"
    });

    if (response.status === 401) {
      notifyAdminUnauthorized();
      throw createAdminUnauthorizedError();
    }

    const payload = await parseJsonResponse(
      response,
      "Impossible de charger les reservations."
    );

    const reservations = payload.reservations || [];
    writeAdminReservationListCache(scope, reservations);
    return reservations;
  })();

  adminReservationListRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    adminReservationListRequests.delete(requestKey);
  }
}

export async function getAdminReservationById(id) {
  if (hasFreshAdminReservationDetail(id)) {
    return getCachedAdminReservationById(id);
  }

  const requestKey = String(id);

  if (adminReservationDetailRequests.has(requestKey)) {
    return adminReservationDetailRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    const response = await fetch(`/api/admin/reservations/${id}`, {
      credentials: "include"
    });

    if (response.status === 401) {
      notifyAdminUnauthorized();
      throw createAdminUnauthorizedError();
    }

    const payload = await parseJsonResponse(
      response,
      "Impossible de charger cette reservation."
    );

    writeAdminReservationDetailCache(payload.reservation);
    return payload.reservation;
  })();

  adminReservationDetailRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    adminReservationDetailRequests.delete(requestKey);
  }
}

export async function acceptAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}/accept`, {
    method: "POST",
    credentials: "include"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible d'accepter cette reservation."
  );

  writeAdminReservationDetailCache(payload.reservation);
  return payload.reservation;
}

export async function rejectAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}/reject`, {
    method: "POST",
    credentials: "include"
  });

  return parseJsonResponse(
    response,
    "Impossible de refuser cette reservation."
  );
}

export async function createAdminReservation(payload) {
  const response = await fetch("/api/admin/reservations", {
    method: "POST",
    credentials: "include",
    body: buildAdminReservationFormData(payload)
  });

  const responsePayload = await parseJsonResponse(
    response,
    "Impossible de creer cette reservation."
  );

  writeAdminReservationDetailCache(responsePayload.reservation);
  return responsePayload.reservation;
}

export async function updateAdminReservation(id, payload) {
  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "PUT",
    credentials: "include",
    body: buildAdminReservationFormData(payload)
  });

  const responsePayload = await parseJsonResponse(
    response,
    "Impossible de modifier cette reservation."
  );

  writeAdminReservationDetailCache(responsePayload.reservation);
  return responsePayload.reservation;
}

export async function deleteAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  return parseJsonResponse(
    response,
    "Impossible de supprimer cette reservation."
  );
}
