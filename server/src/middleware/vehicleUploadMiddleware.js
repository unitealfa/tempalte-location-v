const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const {
  createVehicleMediaAsset,
  deleteVehicleMediaAsset
} = require("../repositories/vehicleMediaAssetRepository");
const { resolveUploadsRoot } = require("../services/storagePathService");

const uploadsRoot = resolveUploadsRoot();
const vehicleUploadsRoot = path.resolve(uploadsRoot, "vehicles");

async function ensureVehicleUploadsRoot() {
  await fs.mkdir(vehicleUploadsRoot, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination(request, file, callback) {
    ensureVehicleUploadsRoot()
      .then(() => callback(null, vehicleUploadsRoot))
      .catch(callback);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extension}`
    );
  }
});

const upload = multer({
  storage,
  limits: {
    files: 21
  }
});

function flattenUploadedFiles(files) {
  return Object.values(files || {}).flat();
}

function handleVehicleMediaUpload(request, response, next) {
  upload.fields([
    {
      name: "video",
      maxCount: 1
    },
    {
      name: "photos",
      maxCount: 20
    }
  ])(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: "Upload des medias du vehicule impossible."
      });
    }

    return next();
  });
}

function buildManagedUrl(filename) {
  return `/uploads/vehicles/${filename}`;
}

function buildDbManagedUrl(assetId) {
  return `/api/media/vehicles/${assetId}`;
}

function buildManagedPath(filename) {
  return path.resolve(vehicleUploadsRoot, filename);
}

function buildThumbnailFilename(filename) {
  const parsedPath = path.parse(filename);
  return `${parsedPath.name}--thumb.webp`;
}

function buildOptimizedFilename(filename) {
  const parsedPath = path.parse(filename);
  return `${parsedPath.name}.webp`;
}

async function optimizeUploadedPhoto(file) {
  try {
    const sourceBuffer = await fs.readFile(file.path);
    let optimizedBuffer = sourceBuffer;
    let optimizedContentType = file.mimetype || "application/octet-stream";
    let optimizedExtension = path.extname(file.originalname || "").toLowerCase() || ".bin";
    let thumbnailBuffer = null;
    let thumbnailContentType = null;

    try {
      optimizedBuffer = await sharp(sourceBuffer)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: 72
        })
        .toBuffer();

      thumbnailBuffer = await sharp(sourceBuffer)
        .rotate()
        .resize({
          width: 560,
          height: 560,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: 66
        })
        .toBuffer();

      optimizedContentType = "image/webp";
      optimizedExtension = ".webp";
      thumbnailContentType = "image/webp";
    } catch (error) {
      thumbnailBuffer = null;
      thumbnailContentType = null;
    }

    const asset = await createVehicleMediaAsset({
      contentType: optimizedContentType,
      originalFileName: file.originalname || file.filename,
      originalExtension: optimizedExtension,
      binaryData: optimizedBuffer,
      thumbnailContentType,
      thumbnailBinaryData: thumbnailBuffer
    });

    await fs.unlink(file.path).catch(() => {});

    return buildDbManagedUrl(asset.id);
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw error;
  }
}

async function mapUploadedVehicleMedia(files) {
  const photoUrls = [];
  let videoUrl = "";

  try {
    for (const photoFile of files?.photos || []) {
      photoUrls.push(await optimizeUploadedPhoto(photoFile));
    }

    const videoFile = files?.video?.[0];

    if (videoFile) {
      const sourceBuffer = await fs.readFile(videoFile.path);
      const asset = await createVehicleMediaAsset({
        contentType: videoFile.mimetype || "application/octet-stream",
        originalFileName: videoFile.originalname || videoFile.filename,
        originalExtension: path.extname(videoFile.originalname || "").toLowerCase() || ".bin",
        binaryData: sourceBuffer,
        thumbnailContentType: null,
        thumbnailBinaryData: null
      });

      await fs.unlink(videoFile.path).catch(() => {});
      videoUrl = buildDbManagedUrl(asset.id);
    }
  } catch (error) {
    await removeStoredVehicleMedia([...photoUrls, videoUrl].filter(Boolean));
    throw error;
  }

  return {
    photoUrls,
    videoUrl
  };
}

async function removeUploadedFiles(files) {
  await Promise.all(
    flattenUploadedFiles(files).map((file) =>
      fs.unlink(file.path).catch(() => {})
    )
  );
}

function toDbManagedAssetId(url) {
  const match = String(url || "").match(/^\/api\/media\/vehicles\/(\d+)(?:\/thumb)?$/);

  if (!match) {
    return null;
  }

  const assetId = Number(match[1]);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

function toManagedUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/vehicles/")) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

function toManagedThumbnailPath(url) {
  const filePath = toManagedUploadPath(url);

  if (!filePath || !filePath.endsWith(".webp") || filePath.endsWith("--thumb.webp")) {
    return null;
  }

  return filePath.replace(/\.webp$/, "--thumb.webp");
}

async function removeStoredVehicleMedia(urls) {
  const dbManagedAssetIds = [
    ...new Set(
      (urls || [])
        .map((url) => toDbManagedAssetId(url))
        .filter((assetId) => Number.isInteger(assetId) && assetId > 0)
    )
  ];

  await Promise.all(
    dbManagedAssetIds.map((assetId) => deleteVehicleMediaAsset(assetId).catch(() => {}))
  );

  await Promise.all(
    (urls || [])
      .filter(Boolean)
      .flatMap((url) => [toManagedUploadPath(url), toManagedThumbnailPath(url)])
      .filter(Boolean)
      .map((filePath) => fs.unlink(filePath).catch(() => {}))
  );
}

module.exports = {
  handleVehicleMediaUpload,
  mapUploadedVehicleMedia,
  removeStoredVehicleMedia,
  removeUploadedFiles,
  uploadsRoot
};
