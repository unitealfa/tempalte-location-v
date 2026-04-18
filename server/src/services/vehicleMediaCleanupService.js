const fs = require("fs/promises");
const path = require("path");
const { listReservations } = require("../repositories/reservationRepository");
const { listVehicles } = require("../repositories/vehicleRepository");
const {
  deleteVehicleMediaCleanupJobs,
  listExpiredVehicleMediaCleanupJobs,
  upsertVehicleMediaCleanupJob
} = require("../repositories/vehicleMediaCleanupJobRepository");
const {
  deleteVehicleMediaAsset
} = require("../repositories/vehicleMediaAssetRepository");
const { resolveUploadsRoot } = require("./storagePathService");

const VEHICLE_MEDIA_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const VEHICLE_MEDIA_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

let vehicleMediaCleanupTimer = null;
let vehicleMediaCleanupPromise = null;
let vehicleMediaCleanupLastRunAt = 0;

function normalizeMediaUrls(urls) {
  return [...new Set(
    (Array.isArray(urls) ? urls : [])
      .map((mediaUrl) => String(mediaUrl || "").trim())
      .filter(Boolean)
  )];
}

function getDeleteAfterDate(now = new Date()) {
  return new Date(now.getTime() + VEHICLE_MEDIA_RETENTION_MS);
}

function isDbManagedVehicleMediaUrl(url) {
  return /^\/api\/media\/vehicles\/\d+$/.test(String(url || "").trim());
}

function getDbManagedVehicleMediaId(url) {
  const match = String(url || "").trim().match(/^\/api\/media\/vehicles\/(\d+)$/);

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

  const uploadsRoot = resolveUploadsRoot();
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

async function deleteVehicleMediaNow(mediaUrl) {
  if (isDbManagedVehicleMediaUrl(mediaUrl)) {
    const assetId = getDbManagedVehicleMediaId(mediaUrl);

    if (!assetId) {
      return;
    }

    await deleteVehicleMediaAsset(assetId).catch(() => {});
    return;
  }

  const filePaths = [toManagedUploadPath(mediaUrl), toManagedThumbnailPath(mediaUrl)].filter(Boolean);
  await Promise.all(
    filePaths.map((filePath) => fs.unlink(filePath).catch(() => {}))
  );
}

async function buildUsedVehicleMediaUrlSet() {
  const [vehicles, reservations] = await Promise.all([
    listVehicles({ includeMaintenance: true }),
    listReservations({ status: null, futureOnly: false })
  ]);
  const usedUrls = new Set();

  vehicles.forEach((vehicle) => {
    (vehicle.photoUrls || []).forEach((photoUrl) => {
      if (photoUrl) {
        usedUrls.add(photoUrl);
      }
    });

    if (vehicle.videoUrl) {
      usedUrls.add(vehicle.videoUrl);
    }
  });

  reservations.forEach((reservation) => {
    if (reservation.vehiclePhotoUrl) {
      usedUrls.add(reservation.vehiclePhotoUrl);
    }
  });

  return usedUrls;
}

async function scheduleVehicleMediaCleanup(mediaUrls, now = new Date()) {
  const normalizedUrls = normalizeMediaUrls(mediaUrls);

  if (normalizedUrls.length === 0) {
    return;
  }

  const deleteAfter = getDeleteAfterDate(now)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await Promise.all(
    normalizedUrls.map((mediaUrl) =>
      upsertVehicleMediaCleanupJob(mediaUrl, deleteAfter)
    )
  );
}

async function cancelVehicleMediaCleanup(mediaUrls) {
  const normalizedUrls = normalizeMediaUrls(mediaUrls);

  if (normalizedUrls.length === 0) {
    return;
  }

  await deleteVehicleMediaCleanupJobs(normalizedUrls);
}

async function cleanupExpiredVehicleMedia(now = new Date()) {
  if (vehicleMediaCleanupPromise) {
    return vehicleMediaCleanupPromise;
  }

  vehicleMediaCleanupPromise = (async () => {
    const nowValue = now.toISOString().slice(0, 19).replace("T", " ");
    const expiredJobs = await listExpiredVehicleMediaCleanupJobs(nowValue);

    if (expiredJobs.length === 0) {
      vehicleMediaCleanupLastRunAt = now.getTime();
      return 0;
    }

    const usedUrls = await buildUsedVehicleMediaUrlSet();
    let deletedCount = 0;

    for (const job of expiredJobs) {
      if (usedUrls.has(job.mediaUrl)) {
        await deleteVehicleMediaCleanupJobs([job.mediaUrl]);
        continue;
      }

      await deleteVehicleMediaNow(job.mediaUrl);
      await deleteVehicleMediaCleanupJobs([job.mediaUrl]);
      deletedCount += 1;
    }

    vehicleMediaCleanupLastRunAt = now.getTime();
    return deletedCount;
  })();

  try {
    return await vehicleMediaCleanupPromise;
  } finally {
    vehicleMediaCleanupPromise = null;
  }
}

async function maybeCleanupExpiredVehicleMedia(now = new Date()) {
  if (now.getTime() - vehicleMediaCleanupLastRunAt < 5 * 60 * 1000) {
    return 0;
  }

  return cleanupExpiredVehicleMedia(now);
}

function startVehicleMediaCleanupScheduler() {
  if (vehicleMediaCleanupTimer) {
    return;
  }

  const runCleanup = () => {
    void cleanupExpiredVehicleMedia().catch((error) => {
      console.error("Vehicle media cleanup failed", error);
    });
  };

  runCleanup();
  vehicleMediaCleanupTimer = setInterval(runCleanup, VEHICLE_MEDIA_CLEANUP_INTERVAL_MS);

  if (typeof vehicleMediaCleanupTimer.unref === "function") {
    vehicleMediaCleanupTimer.unref();
  }
}

function stopVehicleMediaCleanupScheduler() {
  if (!vehicleMediaCleanupTimer) {
    return;
  }

  clearInterval(vehicleMediaCleanupTimer);
  vehicleMediaCleanupTimer = null;
}

module.exports = {
  cancelVehicleMediaCleanup,
  cleanupExpiredVehicleMedia,
  maybeCleanupExpiredVehicleMedia,
  scheduleVehicleMediaCleanup,
  startVehicleMediaCleanupScheduler,
  stopVehicleMediaCleanupScheduler
};
