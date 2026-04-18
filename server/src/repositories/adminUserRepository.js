const { getPool } = require("../db/pool");

function mapAdminUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findAdminUserByLogin(login) {
  const normalizedLogin = login.trim().toLowerCase();
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT id, username, email, role, password_hash, created_at, updated_at
      FROM admin_users
      WHERE LOWER(username) = ? OR LOWER(email) = ?
      LIMIT 1
    `,
    [normalizedLogin, normalizedLogin]
  );

  return mapAdminUser(rows[0]);
}

async function findAdminUserByIdentity(username, email) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT id, username, email, role, password_hash, created_at, updated_at
      FROM admin_users
      WHERE LOWER(username) = ? OR LOWER(email) = ?
      LIMIT 1
    `,
    [normalizedUsername, normalizedEmail]
  );

  return mapAdminUser(rows[0]);
}

async function findConflictingAdminUser({ username, email, excludeId }) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT id, username, email, role, password_hash, created_at, updated_at
      FROM admin_users
      WHERE id <> ? AND (LOWER(username) = ? OR LOWER(email) = ?)
      LIMIT 1
    `,
    [excludeId, normalizedUsername, normalizedEmail]
  );

  return mapAdminUser(rows[0]);
}

async function createAdminUser({ username, email, role, passwordHash }) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO admin_users (username, email, role, password_hash)
      VALUES (?, ?, ?, ?)
    `,
    [username, email, role, passwordHash]
  );

  return findAdminUserById(result.insertId);
}

async function updateAdminUser(id, { username, email, role, passwordHash }) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_users
      SET username = ?, email = ?, role = ?, password_hash = ?
      WHERE id = ?
    `,
    [username, email, role, passwordHash, id]
  );

  return findAdminUserById(id);
}

async function updateAdminUserProfile(id, { username, email }) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_users
      SET username = ?, email = ?
      WHERE id = ?
    `,
    [username, email, id]
  );

  return findAdminUserById(id);
}

async function updateAdminUserPassword(id, passwordHash) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE admin_users
      SET password_hash = ?
      WHERE id = ?
    `,
    [passwordHash, id]
  );

  return findAdminUserById(id);
}

async function findAdminUserById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT id, username, email, role, password_hash, created_at, updated_at
      FROM admin_users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapAdminUser(rows[0]);
}

module.exports = {
  createAdminUser,
  findConflictingAdminUser,
  findAdminUserById,
  findAdminUserByIdentity,
  findAdminUserByLogin,
  updateAdminUserPassword,
  updateAdminUserProfile,
  updateAdminUser
};
