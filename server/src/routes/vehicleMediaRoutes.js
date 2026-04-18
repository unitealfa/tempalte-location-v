const express = require("express");
const {
  findVehicleMediaAssetById
} = require("../repositories/vehicleMediaAssetRepository");

const router = express.Router();

function parseAssetId(value) {
  const assetId = Number(value);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

async function respondWithVehicleMedia(response, assetId, { thumbnail = false } = {}) {
  const asset = await findVehicleMediaAssetById(assetId);

  if (!asset) {
    response.status(404).end();
    return;
  }

  const binaryData =
    thumbnail && asset.thumbnailBinaryData ? asset.thumbnailBinaryData : asset.binaryData;
  const contentType =
    thumbnail && asset.thumbnailBinaryData
      ? asset.thumbnailContentType || asset.contentType
      : asset.contentType;

  response.set("Cache-Control", "public, max-age=31536000, immutable");
  response.set("Content-Type", contentType || "application/octet-stream");
  response.send(binaryData);
}

router.get("/:id/thumb", async (request, response) => {
  try {
    const assetId = parseAssetId(request.params.id);

    if (!assetId) {
      return response.status(400).json({
        message: "Media invalide."
      });
    }

    await respondWithVehicleMedia(response, assetId, { thumbnail: true });
  } catch (error) {
    console.error("Vehicle media thumbnail failed", error);
    response.status(500).json({
      message: "Impossible de charger cette miniature."
    });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const assetId = parseAssetId(request.params.id);

    if (!assetId) {
      return response.status(400).json({
        message: "Media invalide."
      });
    }

    await respondWithVehicleMedia(response, assetId);
  } catch (error) {
    console.error("Vehicle media load failed", error);
    response.status(500).json({
      message: "Impossible de charger ce media."
    });
  }
});

module.exports = router;
