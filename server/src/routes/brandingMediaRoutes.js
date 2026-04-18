const express = require("express");
const {
  findBrandingMediaAssetById
} = require("../repositories/brandingMediaAssetRepository");
const { DEFAULT_BRANDING_IMAGE_URL } = require("../services/mediaUrlService");

const BRANDING_EXTENSION_MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jfif": "image/jpeg",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".ico": "image/x-icon",
  ".cur": "image/x-icon",
  ".apng": "image/apng",
  ".pjpeg": "image/jpeg",
  ".pjp": "image/jpeg",
  ".dib": "image/bmp",
  ".jxl": "image/jxl"
};

const router = express.Router();

function parseAssetId(value) {
  const assetId = Number(value);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

function resolveBrandingContentType(asset) {
  const rawContentType = String(asset?.contentType || "").trim().toLowerCase();

  if (rawContentType.startsWith("image/")) {
    return rawContentType;
  }

  const rawExtension = String(asset?.originalExtension || "").trim().toLowerCase();
  return BRANDING_EXTENSION_MIME_MAP[rawExtension] || "application/octet-stream";
}

router.get("/:id", async (request, response) => {
  try {
    const assetId = parseAssetId(request.params.id);

    if (!assetId) {
      return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
    }

    const asset = await findBrandingMediaAssetById(assetId);

    if (!asset) {
      return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
    }

    response.set("Cache-Control", "public, max-age=31536000, immutable");
    response.set("Content-Disposition", "inline");
    response.set("Content-Type", resolveBrandingContentType(asset));
    return response.send(asset.binaryData);
  } catch (error) {
    console.error("Branding media load failed", error);
    return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
  }
});

module.exports = router;
