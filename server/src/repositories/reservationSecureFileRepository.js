const { getPool } = require("../db/pool");

function mapReservationSecureFile(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    encryptedPayload: row.encrypted_payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createReservationSecureFile(encryptedPayload) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO reservation_secure_files (
        encrypted_payload
      )
      VALUES (?)
    `,
    [encryptedPayload]
  );

  return findReservationSecureFileById(result.insertId);
}

async function findReservationSecureFileById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        encrypted_payload,
        created_at,
        updated_at
      FROM reservation_secure_files
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapReservationSecureFile(rows[0]);
}

async function deleteReservationSecureFile(id) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM reservation_secure_files
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  createReservationSecureFile,
  deleteReservationSecureFile,
  findReservationSecureFileById
};
