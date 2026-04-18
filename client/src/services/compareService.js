const STORAGE_KEY = "lea_compare_vehicle_ids";
const MAX_COMPARE_ITEMS = 12;

function sanitizeCompareVehicleIds(rawValue) {
  if (Array.isArray(rawValue) === false) {
    return [];
  }

  const sanitized = [];

  rawValue.forEach((entry) => {
    const nextId = Number(entry);

    if (Number.isFinite(nextId) === false || nextId <= 0) {
      return;
    }

    if (sanitized.includes(nextId)) {
      return;
    }

    if (sanitized.length >= MAX_COMPARE_ITEMS) {
      return;
    }

    sanitized.push(nextId);
  });

  return sanitized;
}

export function getStoredCompareVehicleIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (rawValue === null) {
      return [];
    }

    return sanitizeCompareVehicleIds(JSON.parse(rawValue));
  } catch (error) {
    return [];
  }
}

export function persistCompareVehicleIds(vehicleIds) {
  if (typeof window === "undefined") {
    return [];
  }

  const sanitized = sanitizeCompareVehicleIds(vehicleIds);

  if (sanitized.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function toggleCompareVehicleId(vehicleIds, vehicleId) {
  const sanitized = sanitizeCompareVehicleIds(vehicleIds);
  const nextVehicleId = Number(vehicleId);

  if (Number.isFinite(nextVehicleId) === false || nextVehicleId <= 0) {
    return sanitized;
  }

  if (sanitized.includes(nextVehicleId)) {
    return sanitized.filter((entry) => entry !== nextVehicleId);
  }

  if (sanitized.length >= MAX_COMPARE_ITEMS) {
    return sanitized;
  }

  return sanitized.concat(nextVehicleId);
}

export function getCompareStorageLimit() {
  return MAX_COMPARE_ITEMS;
}
