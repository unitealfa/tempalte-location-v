const {
  createReservation,
  deleteReservation,
  findReservationById,
  findOverlappingAcceptedReservation,
  listAcceptedReservationsByVehicleId,
  listReservations,
  updateReservation,
  updateReservationStatus,
  clearReservationDrivingLicensePhotoUrl
} = require("../repositories/reservationRepository");
const {
  parseStoredReservationReferences,
  readStoredReservationFile,
  removeStoredReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  getAdminVehicleById,
  getPublicVehicleById,
  syncVehicleAvailabilityForVehicle
} = require("./vehicleService");
const { DEFAULT_VEHICLE_IMAGE_URL } = require("./mediaUrlService");
const { calculateReservationPricing } = require("../utils/reservationPricing");

const LOCATION_TYPES = new Set(["bureau", "aeroport", "commentaire"]);
const RESERVATION_STATUSES = new Set(["pending", "accepted"]);
const DRIVING_LICENSE_RETENTION_AFTER_RESERVATION_MS = 7 * 24 * 60 * 60 * 1000;
const DRIVING_LICENSE_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

let reservationLicenseCleanupTimer = null;
let reservationLicenseCleanupPromise = null;

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeOptionalEmail(value) {
  const normalizedValue = normalizeString(value);
  return normalizedValue || null;
}

function normalizeOptionalBirthDate(value) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error("Date de naissance invalide.");
  }

  return normalizedValue;
}

function normalizeLocationType(value, label) {
  const normalizedValue = normalizeString(value).toLowerCase();

  if (!LOCATION_TYPES.has(normalizedValue)) {
    throw new Error(`${label} invalide.`);
  }

  return normalizedValue;
}

function normalizeDatetime(value, label) {
  const normalizedValue = normalizeString(value);
  const parsedDate = new Date(normalizedValue);

  if (!normalizedValue || Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${label} invalide.`);
  }

  const databaseValue = normalizedValue.replace("T", " ").slice(0, 19);
  return databaseValue.length === 16 ? `${databaseValue}:00` : databaseValue;
}

function normalizeOptionalTotalPrice(value) {
  const normalizedValue = normalizeString(value).replace(/\s+/g, "").replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("Prix total invalide.");
  }

  return Number(parsedValue.toFixed(2));
}

function formatDurationLabel(pickupDatetime, returnDatetime) {
  const pickupTime = new Date(pickupDatetime).getTime();
  const returnTime = new Date(returnDatetime).getTime();
  const durationMs = Math.max(returnTime - pickupTime, 0);
  const totalHours = Math.ceil(durationMs / (1000 * 60 * 60));

  if (totalHours < 24) {
    return `${totalHours} heure${totalHours > 1 ? "s" : ""}`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (remainingHours === 0) {
    return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  }

  return `${totalDays} jour${totalDays > 1 ? "s" : ""} ${remainingHours} heure${remainingHours > 1 ? "s" : ""}`;
}


function isReservationLicenseExpired(reservation, now = new Date()) {
  if (
    !reservation ||
    reservation.status !== "accepted" ||
    !reservation.drivingLicensePhotoUrl
  ) {
    return false;
  }

  const returnDate = new Date(String(reservation.returnDatetime || "").replace(" ", "T"));

  if (Number.isNaN(returnDate.getTime())) {
    return false;
  }

  return returnDate.getTime() + DRIVING_LICENSE_RETENTION_AFTER_RESERVATION_MS <= now.getTime();
}

async function purgeExpiredReservationDrivingLicenses(now = new Date()) {
  if (reservationLicenseCleanupPromise) {
    return reservationLicenseCleanupPromise;
  }

  reservationLicenseCleanupPromise = (async () => {
    const acceptedReservations = await listReservations({ status: "accepted" });
    let deletedFilesCount = 0;

    for (const reservation of acceptedReservations) {
      if (!isReservationLicenseExpired(reservation, now)) {
        continue;
      }

      await removeStoredReservationFile(reservation.drivingLicensePhotoUrl);
      await clearReservationDrivingLicensePhotoUrl(reservation.id);
      deletedFilesCount += 1;
    }

    return deletedFilesCount;
  })();

  try {
    return await reservationLicenseCleanupPromise;
  } finally {
    reservationLicenseCleanupPromise = null;
  }
}

function startReservationLicenseCleanupScheduler() {
  if (reservationLicenseCleanupTimer) {
    return;
  }

  const runCleanup = () => {
    void purgeExpiredReservationDrivingLicenses().catch((error) => {
      console.error("Reservation driving license cleanup failed", error);
    });
  };

  runCleanup();
  reservationLicenseCleanupTimer = setInterval(
    runCleanup,
    DRIVING_LICENSE_CLEANUP_INTERVAL_MS
  );

  if (typeof reservationLicenseCleanupTimer.unref === "function") {
    reservationLicenseCleanupTimer.unref();
  }
}

function stopReservationLicenseCleanupScheduler() {
  if (!reservationLicenseCleanupTimer) {
    return;
  }

  clearInterval(reservationLicenseCleanupTimer);
  reservationLicenseCleanupTimer = null;
}

function buildAdminDrivingLicenseUrls(reservation) {
  if (!reservation?.id || !reservation.drivingLicensePhotoUrl) {
    return [];
  }

  const references = parseStoredReservationReferences(
    reservation.drivingLicensePhotoUrl
  );

  return references.map((reference, index) => {
    void reference;
    return index === 0
      ? `/api/admin/reservations/${reservation.id}/driving-license`
      : `/api/admin/reservations/${reservation.id}/driving-license/${index}`;
  });
}

async function withReservationComputedFields(reservation) {
  if (!reservation) {
    return null;
  }

  let totalPrice = reservation.totalPrice;
  let priceRateType = reservation.priceRateType;
  let priceManualOverride = reservation.priceManualOverride;

  if ((totalPrice === null || totalPrice === undefined) && reservation.vehicleId) {
    const vehicle = await getAdminVehicleById(reservation.vehicleId);

    if (vehicle) {
      const calculatedPricing = calculateReservationPricing(
        vehicle,
        reservation.pickupDatetime,
        reservation.returnDatetime
      );

      if (calculatedPricing.billingDays > 0) {
        totalPrice = calculatedPricing.totalPrice;
        priceRateType = priceRateType || calculatedPricing.rateType;
        priceManualOverride = false;
      }
    }
  }

  const drivingLicensePhotoUrls = buildAdminDrivingLicenseUrls(reservation);

  return {
    ...reservation,
    totalPrice,
    priceRateType,
    priceManualOverride,
    drivingLicensePhotoUrl: drivingLicensePhotoUrls[0] || "",
    drivingLicensePhotoUrls,
    vehicleName: [
      reservation.vehicleBrand,
      reservation.vehicleModel
    ]
      .filter(Boolean)
      .join(" "),
    durationLabel: formatDurationLabel(
      reservation.pickupDatetime,
      reservation.returnDatetime
    ),
    isPending: reservation.status === "pending",
    isAccepted: reservation.status === "accepted"
  };
}

function mapVehicleToReservationSnapshot(vehicle) {
  return {
    vehicleId: vehicle.id,
    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    vehicleVersion: vehicle.version,
    vehiclePhotoUrl:
      (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls[0]) ||
      DEFAULT_VEHICLE_IMAGE_URL
  };
}

async function validateReservationVehicle(vehicleId, { adminView }) {
  const vehicle = adminView
    ? await getAdminVehicleById(vehicleId)
    : await getPublicVehicleById(vehicleId);

  if (!vehicle) {
    throw new Error("Vehicule introuvable.");
  }

  if (adminView && vehicle.availabilityStatus === "maintenance") {
    throw new Error("Ce vehicule est en maintenance.");
  }

  return vehicle;
}

async function buildReservationPayload(vehicleId, payload, options = {}) {
  const {
    adminView = false,
    requiredLicensePhoto = true,
    fallbackLicensePhotoUrl = "",
    status = "pending"
  } = options;
  const vehicle = await validateReservationVehicle(vehicleId, {
    adminView
  });

  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const phone = normalizeString(payload.phone);
  const comment = normalizeString(payload.comment);
  const birthDate = normalizeOptionalBirthDate(payload.birthDate);
  const drivingLicensePhotoUrl =
    normalizeString(payload.drivingLicensePhotoUrl) ||
    normalizeString(fallbackLicensePhotoUrl);
  const pickupLocationType = normalizeLocationType(
    payload.pickupLocationType,
    "Lieu de recuperation"
  );
  const returnLocationType = normalizeLocationType(
    payload.returnLocationType,
    "Lieu de retour"
  );
  const pickupDatetime = normalizeDatetime(
    payload.pickupDatetime,
    "Date de recuperation"
  );
  const returnDatetime = normalizeDatetime(
    payload.returnDatetime,
    "Date de retour"
  );
  const privacyPolicyAccepted =
    payload.privacyPolicyAccepted === true ||
    payload.privacyPolicyAccepted === "true" ||
    payload.privacyPolicyAccepted === "on";

  if (!firstName || !lastName || !phone) {
    throw new Error("Tous les champs obligatoires de reservation doivent etre remplis.");
  }

  if (requiredLicensePhoto && !drivingLicensePhotoUrl) {
    throw new Error("Le permis de conduire est obligatoire.");
  }

  if (
    (pickupLocationType === "commentaire" || returnLocationType === "commentaire") &&
    !comment
  ) {
    throw new Error("Precisez le lieu dans le commentaire.");
  }

  if (!privacyPolicyAccepted) {
    throw new Error("La politique de confidentialite doit etre acceptee.");
  }

  if (new Date(returnDatetime).getTime() <= new Date(pickupDatetime).getTime()) {
    throw new Error("La date de retour doit etre apres la date de recuperation.");
  }

  const calculatedPricing = calculateReservationPricing(
    vehicle,
    pickupDatetime,
    returnDatetime
  );
  const adminTotalPrice = adminView ? normalizeOptionalTotalPrice(payload.totalPrice) : null;
  const totalPrice =
    adminView && adminTotalPrice !== null
      ? adminTotalPrice
      : calculatedPricing.totalPrice;
  const priceManualOverride =
    adminView &&
    adminTotalPrice !== null &&
    Math.abs(adminTotalPrice - calculatedPricing.totalPrice) > 0.009;

  const storedComment = [
    birthDate ? `Date de naissance : ${birthDate}` : "",
    comment
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    ...mapVehicleToReservationSnapshot(vehicle),
    firstName,
    lastName,
    drivingLicensePhotoUrl,
    email: normalizeOptionalEmail(payload.email),
    phone,
    comment: storedComment,
    pickupLocationType,
    returnLocationType,
    pickupDatetime,
    returnDatetime,
    totalPrice,
    priceRateType: calculatedPricing.rateType,
    priceManualOverride,
    status,
    privacyPolicyAccepted
  };
}

async function ensureReservationAvailability(vehicleId, pickupDatetime, returnDatetime, excludedReservationId = null, errorMessage = "") {
  const overlappingAcceptedReservation = await findOverlappingAcceptedReservation(
    vehicleId,
    pickupDatetime,
    returnDatetime,
    excludedReservationId
  );

  if (overlappingAcceptedReservation) {
    throw new Error(
      errorMessage ||
        "Ce vehicule est deja reserve sur cette periode. Merci de choisir une autre date."
    );
  }
}

async function createVehicleReservation(vehicleId, payload) {
  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: false,
    requiredLicensePhoto: true,
    status: "pending"
  });

  await ensureReservationAvailability(
    reservationPayload.vehicleId,
    reservationPayload.pickupDatetime,
    reservationPayload.returnDatetime
  );

  const reservation = await createReservation(reservationPayload);

  return withReservationComputedFields(reservation);
}

function normalizeReservationScope(scope) {
  const normalizedScope = normalizeString(scope).toLowerCase();

  if (!normalizedScope) {
    return "pending";
  }

  if (normalizedScope === "all") {
    return "all";
  }

  if (!RESERVATION_STATUSES.has(normalizedScope)) {
    throw new Error("Filtre de reservation invalide.");
  }

  return normalizedScope;
}

async function listAdminReservations(scope = "pending") {
  await purgeExpiredReservationDrivingLicenses();
  const normalizedScope = normalizeReservationScope(scope);
  const reservations = await listReservations({
    status: normalizedScope === "all" ? null : normalizedScope,
    futureOnly: normalizedScope === "accepted"
  });

  return Promise.all(reservations.map((reservation) => withReservationComputedFields(reservation)));
}

async function getAdminReservationById(id) {
  await purgeExpiredReservationDrivingLicenses();
  const reservation = await findReservationById(id);
  return withReservationComputedFields(reservation);
}

async function getAdminReservationDrivingLicenseFile(id, index = 0) {
  await purgeExpiredReservationDrivingLicenses();
  const reservation = await findReservationById(id);

  if (!reservation || !reservation.drivingLicensePhotoUrl) {
    return null;
  }

  return readStoredReservationFile(reservation.drivingLicensePhotoUrl, index);
}

async function listVehicleAcceptedReservationSlots(vehicleId) {
  const reservations = await listAcceptedReservationsByVehicleId(vehicleId);

  return reservations.map((reservation) => ({
    id: reservation.id,
    pickupDatetime: reservation.pickupDatetime,
    returnDatetime: reservation.returnDatetime
  }));
}

async function acceptAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  if (reservation.status === "accepted") {
    return withReservationComputedFields(reservation);
  }

  if (reservation.status !== "pending") {
    throw new Error("Cette reservation ne peut plus etre acceptee.");
  }

  if (!reservation.vehicleId) {
    throw new Error("Le vehicule de cette reservation est introuvable.");
  }

  const vehicle = await getAdminVehicleById(reservation.vehicleId);

  if (!vehicle) {
    throw new Error("Le vehicule de cette reservation est introuvable.");
  }

  if (vehicle.availabilityStatus === "maintenance") {
    throw new Error("Ce vehicule est en maintenance et ne peut pas etre reserve.");
  }

  await ensureReservationAvailability(
    reservation.vehicleId,
    reservation.pickupDatetime,
    reservation.returnDatetime,
    reservation.id,
    "Ce vehicule est deja reserve sur cette periode. La demande ne peut pas etre acceptee."
  );

  const acceptedReservation = await updateReservationStatus(id, "accepted");
  await syncVehicleAvailabilityForVehicle(reservation.vehicleId);

  return withReservationComputedFields(acceptedReservation);
}

async function createAdminReservation(payload) {
  const vehicleId = Number(payload.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new Error("Vehicule invalide.");
  }

  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: true,
    requiredLicensePhoto: false,
    status: "accepted"
  });

  await ensureReservationAvailability(
    reservationPayload.vehicleId,
    reservationPayload.pickupDatetime,
    reservationPayload.returnDatetime,
    null,
    "Ce vehicule est deja reserve sur cette periode."
  );

  const reservation = await createReservation(reservationPayload);
  await syncVehicleAvailabilityForVehicle(reservation.vehicleId);

  return withReservationComputedFields(reservation);
}

async function updateAdminReservation(id, payload) {
  const currentReservation = await findReservationById(id);

  if (!currentReservation) {
    return null;
  }

  const vehicleId = Number(payload.vehicleId || currentReservation.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new Error("Vehicule invalide.");
  }

  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: true,
    requiredLicensePhoto: false,
    fallbackLicensePhotoUrl: currentReservation.drivingLicensePhotoUrl,
    status: currentReservation.status
  });

  if (currentReservation.status === "accepted") {
    await ensureReservationAvailability(
      reservationPayload.vehicleId,
      reservationPayload.pickupDatetime,
      reservationPayload.returnDatetime,
      currentReservation.id,
      "Ce vehicule est deja reserve sur cette periode. La demande ne peut pas etre acceptee."
    );
  }

  const updatedReservation = await updateReservation(id, reservationPayload);

  if (
    currentReservation.drivingLicensePhotoUrl &&
    currentReservation.drivingLicensePhotoUrl !==
      updatedReservation.drivingLicensePhotoUrl
  ) {
    await removeStoredReservationFile(currentReservation.drivingLicensePhotoUrl);
  }

  if (currentReservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(currentReservation.vehicleId);
  }

  if (
    updatedReservation.vehicleId &&
    updatedReservation.vehicleId !== currentReservation.vehicleId
  ) {
    await syncVehicleAvailabilityForVehicle(updatedReservation.vehicleId);
  }

  return withReservationComputedFields(updatedReservation);
}

async function rejectAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  await deleteReservation(id);
  await removeStoredReservationFile(reservation.drivingLicensePhotoUrl);

  if (reservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(reservation.vehicleId);
  }

  return true;
}

async function deleteAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  await deleteReservation(id);
  await removeStoredReservationFile(reservation.drivingLicensePhotoUrl);

  if (reservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(reservation.vehicleId);
  }

  return true;
}

module.exports = {
  acceptAdminReservation,
  createAdminReservation,
  createVehicleReservation,
  deleteAdminReservation,
  getAdminReservationById,
  getAdminReservationDrivingLicenseFile,
  listAdminReservations,
  listVehicleAcceptedReservationSlots,
  purgeExpiredReservationDrivingLicenses,
  startReservationLicenseCleanupScheduler,
  stopReservationLicenseCleanupScheduler,
  updateAdminReservation,
  rejectAdminReservation
};
