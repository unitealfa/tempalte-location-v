const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  handleVehicleMediaUpload,
  mapUploadedVehicleMedia,
  removeStoredVehicleMedia,
  removeUploadedFiles
} = require("../middleware/vehicleUploadMiddleware");
const {
  createAdminVehicle,
  deleteAdminVehicle,
  getAdminVehicleById,
  listAdminVehicles,
  markVehicleAsAvailable,
  markVehicleAsMaintenance,
  updateAdminVehicle
} = require("../services/vehicleService");
const { clearResponseCacheByPrefixes } = require("../services/responseCacheService");
const { isDatabaseUnavailableError } = require("../utils/databaseError");

const router = express.Router();

function parseVehicleId(value) {
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}


function invalidateVehicleResponseCaches(vehicleId = null) {
  const prefixes = ["vehicles:public:list", "dashboard:"];

  if (vehicleId) {
    prefixes.push(`vehicles:public:${vehicleId}:detail`);
    prefixes.push(`vehicles:public:${vehicleId}:availability`);
  }

  clearResponseCacheByPrefixes(prefixes);
}

function parseRetainedPhotoUrls(value) {
  try {
    const parsedValue = JSON.parse(value || "[]");
    return Array.isArray(parsedValue)
      ? parsedValue.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
  } catch (error) {
    return [];
  }
}

router.use(requireAdminApiAuth);

router.get("/", async (request, response) => {
  try {
    const vehicles = await listAdminVehicles();
    response.json({ vehicles });
  } catch (error) {
    console.error("Admin vehicles list failed", error);

    if (isDatabaseUnavailableError(error)) {
      return response.json({ vehicles: [] });
    }

    return response.status(500).json({
      message: "Impossible de charger les vehicules admin."
    });
  }
});

router.post("/", handleVehicleMediaUpload, async (request, response) => {
  let uploadedMedia = null;

  try {
    uploadedMedia = await mapUploadedVehicleMedia(request.files);

    const vehicle = await createAdminVehicle({
      ...(request.body || {}),
      photoUrls: uploadedMedia.photoUrls,
      photoUrlsConfigured: "true",
      videoUrl: uploadedMedia.videoUrl
    });

    invalidateVehicleResponseCaches(vehicle.id);

    response.status(201).json({
      message: "Vehicule cree avec succes.",
      vehicle
    });
  } catch (error) {
    await removeUploadedFiles(request.files);
    await removeStoredVehicleMedia([
      ...(uploadedMedia?.photoUrls || []),
      uploadedMedia?.videoUrl
    ]);
    response.status(400).json({
      message: error.message || "Creation du vehicule impossible."
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

    const vehicle = await getAdminVehicleById(vehicleId);

    if (!vehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    return response.json({ vehicle });
  } catch (error) {
    console.error("Admin vehicle detail failed", error);
    return response.status(500).json({
      message: "Impossible de charger ce vehicule."
    });
  }
});

router.put("/:id", handleVehicleMediaUpload, async (request, response) => {
  let uploadedMedia = null;

  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      await removeUploadedFiles(request.files);
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const existingVehicle = await getAdminVehicleById(vehicleId);

    if (!existingVehicle) {
      await removeUploadedFiles(request.files);
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    uploadedMedia = await mapUploadedVehicleMedia(request.files);
    const retainedPhotoUrls = parseRetainedPhotoUrls(
      request.body?.retainedPhotoUrlsJson
    );

    const vehicle = await updateAdminVehicle(
      vehicleId,
      {
        ...(request.body || {}),
        photoUrls: [...retainedPhotoUrls, ...(uploadedMedia.photoUrls || [])],
        photoUrlsConfigured: "true",
        videoUrl: uploadedMedia.videoUrl
      },
      existingVehicle
    );

    invalidateVehicleResponseCaches(vehicleId);

    return response.json({
      message: "Vehicule modifie avec succes.",
      vehicle
    });
  } catch (error) {
    await removeUploadedFiles(request.files);
    await removeStoredVehicleMedia([
      ...(uploadedMedia?.photoUrls || []),
      uploadedMedia?.videoUrl
    ]);
    return response.status(400).json({
      message: error.message || "Modification du vehicule impossible."
    });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const existingVehicle = await getAdminVehicleById(vehicleId);

    if (!existingVehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    await deleteAdminVehicle(vehicleId);
    invalidateVehicleResponseCaches(vehicleId);
    return response.json({
      message: "Vehicule supprime avec succes."
    });
  } catch (error) {
    return response.status(500).json({
      message: "Suppression du vehicule impossible."
    });
  }
});

router.post("/:id/maintenance", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const vehicle = await markVehicleAsMaintenance(vehicleId);

    if (!vehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    invalidateVehicleResponseCaches(vehicleId);

    return response.json({
      message: "Vehicule passe en maintenance.",
      vehicle
    });
  } catch (error) {
    return response.status(500).json({
      message: "Passage en maintenance impossible."
    });
  }
});

router.post("/:id/available", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const vehicle = await markVehicleAsAvailable(vehicleId);

    if (!vehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    invalidateVehicleResponseCaches(vehicleId);

    return response.json({
      message: "Vehicule repasse disponible.",
      vehicle
    });
  } catch (error) {
    return response.status(500).json({
      message: "Remise en disponibilite impossible."
    });
  }
});

module.exports = router;
