import {
  readCachedValue,
  removeCachedValue,
  writeCachedValue
} from "./cacheService";
import {
  createAdminUnauthorizedError,
  notifyAdminUnauthorized
} from "./adminSessionGuard";

const VEHICLE_CACHE_VERSION = "v2";
const PUBLIC_VEHICLE_LIST_CACHE_KEY = `vehicles:${VEHICLE_CACHE_VERSION}:public:list`;
const ADMIN_VEHICLE_LIST_CACHE_KEY = `vehicles:${VEHICLE_CACHE_VERSION}:admin:list`;

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

  const rawText = await response.text();
  let payload = {};

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        "Les medias du vehicule sont trop lourds pour Vercel. Reduisez la taille des photos ou retirez la video."
      );
    }

    const nextMessage = publicFacing
      ? normalizePublicApiErrorMessage(payload.message, fallbackMessage)
      : payload.message || fallbackMessage;
    throw new Error(nextMessage || fallbackMessage);
  }

  return payload;
}

function appendFormField(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildVehicleFormData(payload) {
  const formData = new FormData();

  [
    "brand",
    "model",
    "version",
    "fuelType",
    "transmission",
    "seats",
    "isConvertible",
    "horsepower",
    "dailyPrice",
    "weeklyPrice",
    "monthlyPrice",
    "securityDeposit",
    "includedKmPerDay",
    "extraKmPrice",
    "availabilityStatus"
  ].forEach((key) => appendFormField(formData, key, payload[key]));

  if (Array.isArray(payload.vehicleRanges)) {
    formData.append("vehicleRangesJson", JSON.stringify(payload.vehicleRanges));
  }

  if (payload.videoFile) {
    formData.append("video", payload.videoFile);
  }

  (payload.photoFiles || []).forEach((file) => {
    formData.append("photos", file);
  });

  if (Array.isArray(payload.retainedPhotoUrls)) {
    formData.append(
      "retainedPhotoUrlsJson",
      JSON.stringify(payload.retainedPhotoUrls)
    );
    formData.append("photoUrlsConfigured", "true");
  }

  return formData;
}

function getVehicleListCacheKey(adminView) {
  return adminView ? ADMIN_VEHICLE_LIST_CACHE_KEY : PUBLIC_VEHICLE_LIST_CACHE_KEY;
}

function getVehicleDetailCacheKey(id, adminView) {
  return `vehicle:${VEHICLE_CACHE_VERSION}:${adminView ? "admin" : "public"}:${id}`;
}

export function readCachedVehicleList({ adminView = false } = {}) {
  const vehicles = readCachedValue(getVehicleListCacheKey(adminView));
  return Array.isArray(vehicles) ? vehicles : [];
}

export function hasCachedVehicleList({ adminView = false } = {}) {
  return readCachedValue(getVehicleListCacheKey(adminView)) !== null;
}

export function readCachedVehicleById(id, { adminView = false } = {}) {
  if (!Number.isInteger(Number(id))) {
    return null;
  }

  const cachedVehicle = readCachedValue(
    getVehicleDetailCacheKey(Number(id), adminView)
  );

  if (cachedVehicle) {
    return cachedVehicle;
  }

  return (
    readCachedVehicleList({ adminView }).find(
      (vehicle) => Number(vehicle.id) === Number(id)
    ) || null
  );
}

function writeVehicleDetailCache(vehicle, { adminView = false } = {}) {
  if (!vehicle || !vehicle.id) {
    return;
  }

  writeCachedValue(getVehicleDetailCacheKey(vehicle.id, adminView), vehicle);
}

function writeVehicleListCache(vehicles, { adminView = false } = {}) {
  if (!Array.isArray(vehicles)) {
    return;
  }

  writeCachedValue(getVehicleListCacheKey(adminView), vehicles);
  vehicles.forEach((vehicle) => {
    writeVehicleDetailCache(vehicle, { adminView });
  });
}

function removeVehicleCaches(id) {
  const numericId = Number(id);

  [true, false].forEach((adminView) => {
    removeCachedValue(getVehicleDetailCacheKey(numericId, adminView));

    const cachedList = readCachedVehicleList({ adminView });

    if (!cachedList.length) {
      return;
    }

    writeVehicleListCache(
      cachedList.filter((vehicle) => Number(vehicle.id) !== numericId),
      { adminView }
    );
  });
}

function refreshCachedVehicle(vehicle) {
  if (!vehicle?.id) {
    return;
  }

  const adminList = readCachedVehicleList({ adminView: true });
  const nextAdminList = adminList.length
    ? adminList.some((entry) => Number(entry.id) === Number(vehicle.id))
      ? adminList.map((entry) =>
          Number(entry.id) === Number(vehicle.id) ? vehicle : entry
        )
      : [vehicle, ...adminList]
    : [vehicle];

  writeVehicleDetailCache(vehicle, { adminView: true });
  writeVehicleListCache(nextAdminList, { adminView: true });

  removeCachedValue(getVehicleDetailCacheKey(vehicle.id, false));
  removeCachedValue(PUBLIC_VEHICLE_LIST_CACHE_KEY);
}

export async function listVehicles({ adminView = false } = {}) {
  const cachedVehicles = readCachedVehicleList({ adminView });

  try {
    const response = await fetch(
      adminView ? "/api/admin/vehicles" : "/api/vehicles",
      {
        credentials: adminView ? "include" : "same-origin"
      }
    );

    if (adminView && response.status === 401) {
      notifyAdminUnauthorized();
      throw createAdminUnauthorizedError();
    }

    if (!adminView && response.status === 503) {
      return cachedVehicles;
    }

    const payload = await parseJsonResponse(
      response,
      "Impossible de charger les vehicules.",
      { publicFacing: !adminView }
    );
    const vehicles = payload.vehicles || [];

    writeVehicleListCache(vehicles, { adminView });

    return vehicles;
  } catch (error) {
    if (error?.adminUnauthorized) {
      throw error;
    }

    if (cachedVehicles.length > 0) {
      return cachedVehicles;
    }

    throw error;
  }
}

export async function getVehicleById(id, { adminView = false } = {}) {
  const cachedVehicle = readCachedVehicleById(id, { adminView });

  try {
    const response = await fetch(
      adminView ? `/api/admin/vehicles/${id}` : `/api/vehicles/${id}`,
      {
        credentials: adminView ? "include" : "same-origin"
      }
    );

    if (adminView && response.status === 401) {
      notifyAdminUnauthorized();
      throw createAdminUnauthorizedError();
    }

    const payload = await parseJsonResponse(
      response,
      "Impossible de charger ce vehicule.",
      { publicFacing: !adminView }
    );

    writeVehicleDetailCache(payload.vehicle, { adminView });

    return payload.vehicle;
  } catch (error) {
    if (error?.adminUnauthorized) {
      throw error;
    }

    if (cachedVehicle) {
      return cachedVehicle;
    }

    throw error;
  }
}

export async function createVehicle(payload) {
  const response = await fetch("/api/admin/vehicles", {
    method: "POST",
    credentials: "include",
    body: buildVehicleFormData(payload)
  });

  const parsedResponse = await parseJsonResponse(
    response,
    "Creation du vehicule impossible."
  );

  if (parsedResponse.vehicle) {
    refreshCachedVehicle(parsedResponse.vehicle);
  }

  return parsedResponse;
}

export async function updateVehicle(id, payload) {
  const response = await fetch(`/api/admin/vehicles/${id}`, {
    method: "PUT",
    credentials: "include",
    body: buildVehicleFormData(payload)
  });

  const parsedResponse = await parseJsonResponse(
    response,
    "Modification du vehicule impossible."
  );

  if (parsedResponse.vehicle) {
    refreshCachedVehicle(parsedResponse.vehicle);
  }

  return parsedResponse;
}

export async function deleteVehicle(id) {
  const response = await fetch(`/api/admin/vehicles/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  const parsedResponse = await parseJsonResponse(
    response,
    "Suppression du vehicule impossible."
  );

  removeVehicleCaches(id);
  return parsedResponse;
}

export async function markVehicleAsMaintenance(id) {
  const response = await fetch(`/api/admin/vehicles/${id}/maintenance`, {
    method: "POST",
    credentials: "include"
  });

  const parsedResponse = await parseJsonResponse(
    response,
    "Passage du vehicule en maintenance impossible."
  );

  if (parsedResponse.vehicle) {
    refreshCachedVehicle(parsedResponse.vehicle);
  }

  return parsedResponse;
}

export async function markVehicleAsAvailable(id) {
  const response = await fetch(`/api/admin/vehicles/${id}/available`, {
    method: "POST",
    credentials: "include"
  });

  const parsedResponse = await parseJsonResponse(
    response,
    "Remise du vehicule en disponibilite impossible."
  );

  if (parsedResponse.vehicle) {
    refreshCachedVehicle(parsedResponse.vehicle);
  }

  return parsedResponse;
}
