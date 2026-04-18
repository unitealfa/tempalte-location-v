const { getPool } = require("../db/pool");

async function createAdminSession({ adminUserId, tokenHash }) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO admin_sessions (admin_user_id, token_hash)
      VALUES (?, ?)
    `,
    [adminUserId, tokenHash]
  );

  return result.insertId;
}

async function deleteAdminSessionByTokenHash(tokenHash) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM admin_sessions
      WHERE token_hash = ?
    `,
    [tokenHash]
  );
}

async function deleteAdminSessionsByAdminUserId(adminUserId) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM admin_sessions
      WHERE admin_user_id = ?
    `,
    [adminUserId]
  );
}

async function findAdminSessionByTokenHash(tokenHash) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT id, admin_user_id, token_hash, created_at, last_used_at
      FROM admin_sessions
      WHERE token_hash = ?
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

async function touchAdminSession(id) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_sessions
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  createAdminSession,
  deleteAdminSessionByTokenHash,
  deleteAdminSessionsByAdminUserId,
  findAdminSessionByTokenHash,
  touchAdminSession
};
