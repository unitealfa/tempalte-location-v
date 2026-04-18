const { getPool } = require("../db/pool");

async function listSiteSettings() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT setting_key, setting_value
      FROM site_settings
      ORDER BY setting_key ASC
    `
  );

  return rows.map((row) => ({
    key: row.setting_key,
    value: row.setting_value
  }));
}

async function getSiteSetting(key) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT setting_key, setting_value
      FROM site_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [String(key || "").trim()]
  );

  if (!rows.length) {
    return null;
  }

  return {
    key: rows[0].setting_key,
    value: rows[0].setting_value
  };
}

async function upsertSiteSettings(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return;
  }

  const pool = getPool();
  const values = entries.map((entry) => [
    String(entry.key || "").trim(),
    entry.value == null ? "" : String(entry.value)
  ]);

  await pool.query(
    `
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES ?
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `,
    [values]
  );
}

module.exports = {
  getSiteSetting,
  listSiteSettings,
  upsertSiteSettings
};
