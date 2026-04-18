const { getPool } = require("../db/pool");

function mapBrandingMediaAsset(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    contentType: row.content_type,
    originalFileName: row.original_file_name,
    originalExtension: row.original_extension,
    binaryData: row.binary_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createBrandingMediaAsset(asset) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO branding_media_assets (
        content_type,
        original_file_name,
        original_extension,
        binary_data
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      asset.contentType,
      asset.originalFileName,
      asset.originalExtension,
      asset.binaryData
    ]
  );

  return findBrandingMediaAssetById(result.insertId);
}

async function findBrandingMediaAssetById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        content_type,
        original_file_name,
        original_extension,
        binary_data,
        created_at,
        updated_at
      FROM branding_media_assets
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapBrandingMediaAsset(rows[0]);
}

async function deleteBrandingMediaAsset(id) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM branding_media_assets
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  createBrandingMediaAsset,
  deleteBrandingMediaAsset,
  findBrandingMediaAssetById
};
