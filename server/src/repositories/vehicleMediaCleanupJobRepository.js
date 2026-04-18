const { getPool } = require("../db/pool");
const crypto = require("crypto");

function getMediaUrlHash(mediaUrl) {
  return crypto.createHash("sha256").update(String(mediaUrl || "")).digest("hex");
}

function mapCleanupJob(row) {
  if (!row) {
    return null;
  }

  return {
    mediaUrl: row.media_url,
    deleteAfter: row.delete_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function upsertVehicleMediaCleanupJob(mediaUrl, deleteAfter) {
  const pool = getPool();
  await pool.execute(
    `
      INSERT INTO vehicle_media_cleanup_jobs (
        media_url,
        media_url_hash,
        delete_after
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        delete_after = VALUES(delete_after)
    `,
    [mediaUrl, getMediaUrlHash(mediaUrl), deleteAfter]
  );
}

async function deleteVehicleMediaCleanupJobs(mediaUrls) {
  const normalizedUrls = (Array.isArray(mediaUrls) ? mediaUrls : [])
    .map((mediaUrl) => String(mediaUrl || "").trim())
    .filter(Boolean);

  if (normalizedUrls.length === 0) {
    return;
  }

  const pool = getPool();
  const normalizedHashes = normalizedUrls.map((mediaUrl) => getMediaUrlHash(mediaUrl));
  const placeholders = normalizedHashes.map(() => "?").join(", ");
  await pool.execute(
    `
      DELETE FROM vehicle_media_cleanup_jobs
      WHERE media_url_hash IN (${placeholders})
    `,
    normalizedHashes
  );
}

async function listExpiredVehicleMediaCleanupJobs(now) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        media_url,
        delete_after,
        created_at,
        updated_at
      FROM vehicle_media_cleanup_jobs
      WHERE delete_after <= ?
      ORDER BY delete_after ASC, media_url ASC
    `,
    [now]
  );

  return rows.map(mapCleanupJob);
}

module.exports = {
  deleteVehicleMediaCleanupJobs,
  listExpiredVehicleMediaCleanupJobs,
  upsertVehicleMediaCleanupJob
};
