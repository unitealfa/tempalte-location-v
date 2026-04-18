const express = require("express");
const {
  handleReservationUpload,
  optimizeReservationLicensePhotos,
  removeStoredReservationFile,
  removeUploadedReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  acceptAdminReservation,
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservationById,
  getAdminReservationDrivingLicenseFile,
  listAdminReservations,
  updateAdminReservation,
  rejectAdminReservation
} = require("../services/reservationService");
const {
  clearResponseCacheByPrefixes,
  getOrSetResponseCache
} = require("../services/responseCacheService");
const {
  getDatabaseUnavailableMessage,
  isDatabaseUnavailableError
} = require("../utils/databaseError");

const router = express.Router();

function getReservationRouteErrorMessage(error, fallbackMessage) {
  if (isDatabaseUnavailableError(error)) {
    return getDatabaseUnavailableMessage(
      "La sauvegarde des reservations est impossible pour le moment. Reessayez dans quelques instants."
    );
  }

  if (error?.code === "ER_CON_COUNT_ERROR") {
    return "Le service de reservations se resynchronise. Reessayez dans quelques secondes.";
  }

  return error?.message || fallbackMessage;
}


function invalidateReservationResponseCaches(vehicleId = null) {
  const prefixes = ["dashboard:", "admin-reservations:", "admin-reservation:"];

  if (vehicleId) {
    prefixes.push(`vehicles:public:${vehicleId}:availability`);
    prefixes.push(`vehicles:public:${vehicleId}:detail`);
  }

  clearResponseCacheByPrefixes(prefixes);
}

function parseReservationId(value) {
  const reservationId = Number(value);
  return Number.isInteger(reservationId) && reservationId > 0
    ? reservationId
    : null;
}

router.use(requireAdminApiAuth);

router.get("/", async (request, response) => {
  try {
    const scope = String(request.query.scope || "pending");
    const reservations = await getOrSetResponseCache(
      `admin-reservations:${scope}`,
      1000 * 5,
      async () => listAdminReservations(scope)
    );
    response.set("Cache-Control", "private, max-age=3, stale-while-revalidate=15");
    return response.json({ reservations });
  } catch (error) {
    console.error("Admin reservations list failed", error);
    if (isDatabaseUnavailableError(error)) {
      return response.json({ reservations: [] });
    }

    return response.status(400).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de charger les reservations."
      )
    });
  }
});

router.post("/", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    drivingLicensePhotoUrl = await optimizeReservationLicensePhotos(request.files);

    const reservation = await createAdminReservation({
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    invalidateReservationResponseCaches(reservation.vehicleId);

    return response.status(201).json({
      message: "Reservation creee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.files);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    console.error("Admin reservation create failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 400).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de creer cette reservation."
      )
    });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservation = await getOrSetResponseCache(
      `admin-reservation:${reservationId}`,
      1000 * 5,
      async () => getAdminReservationById(reservationId)
    );

    if (!reservation) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    response.set("Cache-Control", "private, max-age=3, stale-while-revalidate=15");
    return response.json({ reservation });
  } catch (error) {
    console.error("Admin reservation detail failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 500).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de charger cette reservation."
      )
    });
  }
});

router.get("/:id/driving-license/:index", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);
    const licenseIndex = Number(request.params.index);

    if (!reservationId || !Number.isInteger(licenseIndex) || licenseIndex < 0) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const licenseFile = await getAdminReservationDrivingLicenseFile(
      reservationId,
      licenseIndex
    );

    if (!licenseFile) {
      return response.status(404).json({
        message: "Permis introuvable."
      });
    }

    response.set({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${licenseFile.filename}"`,
      "Content-Security-Policy": "default-src 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff"
    });
    response.type(licenseFile.contentType);
    return response.send(licenseFile.buffer);
  } catch (error) {
    console.error("Admin reservation driving license failed", error);
    return response.status(500).json({
      message: "Impossible de charger ce permis."
    });
  }
});

router.get("/:id/driving-license", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const licenseFile = await getAdminReservationDrivingLicenseFile(
      reservationId,
      0
    );

    if (!licenseFile) {
      return response.status(404).json({
        message: "Permis introuvable."
      });
    }

    response.set({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${licenseFile.filename}"`,
      "Content-Security-Policy": "default-src 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff"
    });
    response.type(licenseFile.contentType);
    return response.send(licenseFile.buffer);
  } catch (error) {
    console.error("Admin reservation driving license failed", error);
    return response.status(500).json({
      message: "Impossible de charger ce permis."
    });
  }
});

router.post("/:id/accept", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservation = await acceptAdminReservation(reservationId);

    if (!reservation) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    invalidateReservationResponseCaches(reservation.vehicleId);

    return response.json({
      message: "Reservation acceptee.",
      reservation
    });
  } catch (error) {
    console.error("Admin reservation accept failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 400).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible d'accepter cette reservation."
      )
    });
  }
});

router.post("/:id/reject", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservationRemoved = await rejectAdminReservation(reservationId);

    if (!reservationRemoved) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    invalidateReservationResponseCaches();

    return response.json({
      message: "Reservation refusee."
    });
  } catch (error) {
    console.error("Admin reservation reject failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 500).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de refuser cette reservation."
      )
    });
  }
});

router.put("/:id", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      await removeUploadedReservationFile(request.files);
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    drivingLicensePhotoUrl = await optimizeReservationLicensePhotos(request.files);

    const reservation = await updateAdminReservation(reservationId, {
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    if (!reservation) {
      await removeStoredReservationFile(drivingLicensePhotoUrl);
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    invalidateReservationResponseCaches(reservation.vehicleId);

    return response.json({
      message: "Reservation modifiee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.files);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    console.error("Admin reservation update failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 400).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de modifier cette reservation."
      )
    });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const existingReservation = await getAdminReservationById(reservationId);
    const reservationDeleted = await deleteAdminReservation(reservationId);

    if (!reservationDeleted) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    invalidateReservationResponseCaches(existingReservation?.vehicleId);

    return response.json({
      message: "Reservation supprimee."
    });
  } catch (error) {
    console.error("Admin reservation delete failed", error);
    return response.status(isDatabaseUnavailableError(error) ? 503 : 500).json({
      message: getReservationRouteErrorMessage(
        error,
        "Impossible de supprimer cette reservation."
      )
    });
  }
});

module.exports = router;
