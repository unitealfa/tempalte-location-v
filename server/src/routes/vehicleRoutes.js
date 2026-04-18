const express = require("express");
const {
  handleReservationUpload,
  optimizeReservationLicensePhotos,
  removeStoredReservationFile,
  removeUploadedReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  createVehicleReservation,
  listVehicleAcceptedReservationSlots
} = require("../services/reservationService");
const {
  getPublicVehicleById: getVehicleByPublicId,
  listPublicVehicles: listPublicVehiclesService
} = require("../services/vehicleService");
const { getOrSetResponseCache, clearResponseCacheByPrefixes } = require("../services/responseCacheService");

const router = express.Router();

function parseVehicleId(value) {
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}

function getPublicReservationErrorMessage(error) {
  const normalizedMessage = String(error?.message || "").toLowerCase();

  if (normalizedMessage.includes("permis de conduire est obligatoire")) {
    return "Ajoutez obligatoirement la photo du permis de conduire.";
  }

  if (
    normalizedMessage.includes("format non accepte") ||
    normalizedMessage.includes("permis de conduire est invalide") ||
    normalizedMessage.includes("upload du permis impossible") ||
    normalizedMessage.includes("le permis doit etre une image")
  ) {
    return "Ajoutez une image valide du permis de conduire.";
  }

  return "La reservation n'a pas pu etre envoyee. Merci de reessayer.";
}

router.get("/", async (request, response) => {
  try {
    const vehicles = await getOrSetResponseCache("vehicles:public:list", 1000 * 30, async () => listPublicVehiclesService());
    response.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    response.json({ vehicles });
  } catch (error) {
    console.error("Public vehicles list failed", error);
    response.status(500).json({
      message: "Impossible de charger les vehicules."
    });
  }
});

router.post("/:id/reservations", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      await removeUploadedReservationFile(request.files);
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    drivingLicensePhotoUrl = await optimizeReservationLicensePhotos(request.files);

    const reservation = await createVehicleReservation(vehicleId, {
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    clearResponseCacheByPrefixes([
      `vehicles:public:${vehicleId}:availability`,
      `vehicles:public:${vehicleId}:detail`,
      "dashboard:"
    ]);

    return response.status(201).json({
      message: "Reservation envoyee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.files);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    return response.status(400).json({
      message: getPublicReservationErrorMessage(error)
    });
  }
});

router.get("/:id/reservation-availability", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const payload = await getOrSetResponseCache(
      `vehicles:public:${vehicleId}:availability`,
      1000 * 20,
      async () => {
        const vehicle = await getVehicleByPublicId(vehicleId);

        if (!vehicle) {
          return null;
        }

        const reservations = await listVehicleAcceptedReservationSlots(vehicleId);
        return { reservations };
      }
    );

    if (!payload) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    response.set("Cache-Control", "public, max-age=20, stale-while-revalidate=120");
    return response.json(payload);
  } catch (error) {
    console.error("Vehicle reservation availability failed", error);
    return response.status(500).json({
      message: "Impossible de charger les disponibilites de reservation."
    });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const payload = await getOrSetResponseCache(
      `vehicles:public:${vehicleId}:detail`,
      1000 * 30,
      async () => {
        const vehicle = await getVehicleByPublicId(vehicleId);
        return vehicle ? { vehicle } : null;
      }
    );

    if (!payload) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    response.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    return response.json(payload);
  } catch (error) {
    console.error("Public vehicle detail failed", error);
    return response.status(500).json({
      message: "Impossible de charger ce vehicule."
    });
  }
});

module.exports = router;
