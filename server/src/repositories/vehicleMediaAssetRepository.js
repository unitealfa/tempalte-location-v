const { getPool } = require("../db/pool");

function mapVehicleMediaAsset(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    contentType: row.content_type,
    originalFileName: row.original_file_name,
    originalExtension: row.original_extension,
    binaryData: row.binary_data,
    thumbnailContentType: row.thumbnail_content_type,
    thumbnailBinaryData: row.thumbnail_binary_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createVehicleMediaAsset(asset) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO vehicle_media_assets (
        content_type,
        original_file_name,
        original_extension,
        binary_data,
        thumbnail_content_type,
        thumbnail_binary_data
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      asset.contentType,
      asset.originalFileName,
      asset.originalExtension,
      asset.binaryData,
      asset.thumbnailContentType || null,
      asset.thumbnailBinaryData || null
    ]
  );

  return findVehicleMediaAssetById(result.insertId);
}

async function findVehicleMediaAssetById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        content_type,
        original_file_name,
        original_extension,
        binary_data,
        thumbnail_content_type,
        thumbnail_binary_data,
        created_at,
        updated_at
      FROM vehicle_media_assets
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapVehicleMediaAsset(rows[0]);
}

async function deleteVehicleMediaAsset(id) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM vehicle_media_assets
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  createVehicleMediaAsset,
  deleteVehicleMediaAsset,
  findVehicleMediaAssetById
};
