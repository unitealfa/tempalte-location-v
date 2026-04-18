const { getPool } = require("../db/pool");

function mapVerification(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    purpose: row.purpose,
    deliveryEmail: row.delivery_email,
    codeHash: row.code_hash,
    payloadJson: row.payload_json,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createVerificationRequest({
  adminUserId,
  purpose,
  deliveryEmail,
  codeHash,
  payloadJson,
  expiresAt
}) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO admin_verification_requests (
        admin_user_id,
        purpose,
        delivery_email,
        code_hash,
        payload_json,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [adminUserId, purpose, deliveryEmail, codeHash, payloadJson, expiresAt]
  );

  return findVerificationRequestById(result.insertId);
}

async function deleteVerificationRequestsByPurpose(adminUserId, purpose) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM admin_verification_requests
      WHERE admin_user_id = ? AND purpose = ?
    `,
    [adminUserId, purpose]
  );
}

async function findVerificationRequestById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        admin_user_id,
        purpose,
        delivery_email,
        code_hash,
        payload_json,
        expires_at,
        used_at,
        created_at,
        updated_at
      FROM admin_verification_requests
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapVerification(rows[0]);
}

async function updateVerificationRequest(id, { codeHash, expiresAt }) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_verification_requests
      SET code_hash = ?, expires_at = ?, used_at = NULL
      WHERE id = ?
    `,
    [codeHash, expiresAt, id]
  );

  return findVerificationRequestById(id);
}

async function markVerificationRequestUsed(id) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_verification_requests
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  createVerificationRequest,
  deleteVerificationRequestsByPurpose,
  findVerificationRequestById,
  markVerificationRequestUsed,
  updateVerificationRequest
};
