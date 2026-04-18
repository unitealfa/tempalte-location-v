const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const {
  createBrandingMediaAsset,
  deleteBrandingMediaAsset
} = require("../repositories/brandingMediaAssetRepository");
const { resolveUploadsRoot } = require("../services/storagePathService");

const uploadsRoot = resolveUploadsRoot();
const BRANDING_IMAGE_EXTENSION_MIME_MAP = {
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 25 * 1024 * 1024
  }
});

function handleBrandingImageUpload(request, response, next) {
  upload.single("image")(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: "Upload du logo impossible."
      });
    }

    if (!request.file) {
      return response.status(400).json({
        message: "Aucune image selectionnee."
      });
    }

    return next();
  });
}

function inferImageContentTypeFromFile(file, fallbackName = "") {
  const mimeType = String(file?.mimetype || "").trim().toLowerCase();

  if (mimeType.startsWith("image/")) {
    return mimeType;
  }

  const extension = path.extname(String(file?.originalname || fallbackName || "")).toLowerCase();
  return BRANDING_IMAGE_EXTENSION_MIME_MAP[extension] || "";
}

function isLikelyImageFile(file, fallbackName = "") {
  return Boolean(inferImageContentTypeFromFile(file, fallbackName));
}

function buildManagedUrl(filename) {
  return `/api/media/branding/${filename}`;
}

function parseBrandingAssetId(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(/^\/api\/media\/branding\/(\d+)$/);

  if (!match) {
    return null;
  }

  const assetId = Number(match[1]);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

function toManagedUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/branding/")) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

async function saveBrandingImage(file, slot = "branding") {
  const normalizedSlot = String(slot || "branding").trim() || "branding";
  const originalFileName = String(file.originalname || `${normalizedSlot}.bin`);
  const originalExtension = path.extname(originalFileName || "").toLowerCase() || ".bin";
  let contentType =
    inferImageContentTypeFromFile(file, originalFileName) || "application/octet-stream";
  let binaryData = file.buffer;
  let isConfirmedImage = isLikelyImageFile(file, originalFileName);

  try {
    const metadata = await sharp(file.buffer, {
      failOn: "none",
      animated: true
    }).metadata();

    if (metadata && (metadata.width || metadata.height || metadata.format)) {
      isConfirmedImage = true;
    }
  } catch (error) {
  }

  if (!isConfirmedImage) {
    throw new Error("Le fichier selectionne n'est pas une image prise en charge.");
  }

  try {
    binaryData = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 82
      })
      .toBuffer();
    contentType = "image/webp";
  } catch (error) {
    if (!contentType.startsWith("image/")) {
      contentType =
        BRANDING_IMAGE_EXTENSION_MIME_MAP[originalExtension] || "application/octet-stream";
    }
  }

  const asset = await createBrandingMediaAsset({
    contentType,
    originalFileName,
    originalExtension,
    binaryData
  });

  return buildManagedUrl(asset.id);
}

async function removeStoredBrandingImage(url) {
  const assetId = parseBrandingAssetId(url);

  if (assetId) {
    await deleteBrandingMediaAsset(assetId).catch(() => {});
    return;
  }

  const filePath = toManagedUploadPath(url);

  if (!filePath) {
    return;
  }

  await fs.unlink(filePath).catch(() => {});
}

module.exports = {
  handleBrandingImageUpload,
  saveBrandingImage,
  removeStoredBrandingImage
};
