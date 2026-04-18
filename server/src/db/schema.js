const { getPool } = require("./pool");

async function ensureSchema() {
  const pool = getPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      role VARCHAR(100) NOT NULL DEFAULT 'admin',
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_users_username (username),
      UNIQUE KEY uq_admin_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_sessions_token_hash (token_hash),
      KEY idx_admin_sessions_admin_user_id (admin_user_id),
      CONSTRAINT fk_admin_sessions_admin_user_id
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_verification_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_user_id BIGINT UNSIGNED NOT NULL,
      purpose VARCHAR(100) NOT NULL,
      delivery_email VARCHAR(191) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      payload_json LONGTEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_admin_verification_admin_user_id (admin_user_id),
      KEY idx_admin_verification_purpose (purpose),
      CONSTRAINT fk_admin_verification_admin_user_id
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      brand VARCHAR(191) NOT NULL,
      model VARCHAR(191) NOT NULL,
      version VARCHAR(191) NOT NULL,
      vehicle_ranges LONGTEXT NULL,
      fuel_type VARCHAR(100) NOT NULL,
      transmission VARCHAR(100) NOT NULL,
      seats INT UNSIGNED NOT NULL,
      is_convertible TINYINT(1) NOT NULL DEFAULT 0,
      horsepower INT UNSIGNED NOT NULL,
      daily_price DECIMAL(10, 2) NOT NULL,
      weekly_price DECIMAL(10, 2) NOT NULL,
      monthly_price DECIMAL(10, 2) NOT NULL,
      security_deposit DECIMAL(10, 2) NOT NULL,
      included_km_per_day INT UNSIGNED NOT NULL,
      extra_km_price DECIMAL(10, 2) NOT NULL,
      pricing_description TEXT NOT NULL,
      rental_conditions TEXT NOT NULL,
      video_url TEXT NULL,
      photo_urls LONGTEXT NOT NULL,
      availability_status VARCHAR(50) NOT NULL DEFAULT 'available',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_vehicles_availability_status (availability_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reservations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      vehicle_id BIGINT UNSIGNED NULL,
      vehicle_brand VARCHAR(191) NOT NULL,
      vehicle_model VARCHAR(191) NOT NULL,
      vehicle_version VARCHAR(191) NOT NULL,
      vehicle_photo_url TEXT NOT NULL,
      first_name VARCHAR(191) NOT NULL,
      last_name VARCHAR(191) NOT NULL,
      driving_license_photo_url TEXT NOT NULL,
      email VARCHAR(191) NULL,
      phone VARCHAR(50) NOT NULL,
      comment TEXT NOT NULL,
      pickup_location_type VARCHAR(100) NOT NULL,
      return_location_type VARCHAR(100) NOT NULL,
      pickup_datetime DATETIME NOT NULL,
      return_datetime DATETIME NOT NULL,
      total_price DECIMAL(10, 2) NULL,
      price_rate_type VARCHAR(50) NOT NULL DEFAULT 'daily',
      price_manual_override TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      privacy_policy_accepted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_reservations_vehicle_id (vehicle_id),
      KEY idx_reservations_created_at (created_at),
      KEY idx_reservations_status (status),
      CONSTRAINT fk_reservations_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reservation_secure_files (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      encrypted_payload LONGBLOB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vehicle_media_assets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      content_type VARCHAR(191) NOT NULL,
      original_file_name VARCHAR(255) NOT NULL,
      original_extension VARCHAR(20) NOT NULL,
      binary_data LONGBLOB NOT NULL,
      thumbnail_content_type VARCHAR(191) NULL,
      thumbnail_binary_data LONGBLOB NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS branding_media_assets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      content_type VARCHAR(191) NOT NULL,
      original_file_name VARCHAR(255) NOT NULL,
      original_extension VARCHAR(20) NOT NULL,
      binary_data LONGBLOB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vehicle_media_cleanup_jobs (
      media_url TEXT NOT NULL,
      media_url_hash CHAR(64) NOT NULL,
      delete_after DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (media_url_hash),
      KEY idx_vehicle_media_cleanup_jobs_delete_after (delete_after)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(191) NOT NULL,
      setting_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [roleColumnRows] = await pool.execute(`
    SHOW COLUMNS FROM admin_users LIKE 'role'
  `);

  if (roleColumnRows.length === 0) {
    await pool.execute(`
      ALTER TABLE admin_users
      ADD COLUMN role VARCHAR(100) NOT NULL DEFAULT 'admin' AFTER email
    `);
  }

  await pool.execute(`
    UPDATE admin_users
    SET role = 'admin'
    WHERE role IS NULL OR TRIM(role) = ''
  `);

  const [vehicleRangesRows] = await pool.execute(`
    SHOW COLUMNS FROM vehicles LIKE 'vehicle_ranges'
  `);

  if (vehicleRangesRows.length === 0) {
    await pool.execute(`
      ALTER TABLE vehicles
      ADD COLUMN vehicle_ranges LONGTEXT NULL AFTER version
    `);
  }

  await pool.execute(`
    UPDATE vehicles
    SET vehicle_ranges = '[]'
    WHERE vehicle_ranges IS NULL OR TRIM(vehicle_ranges) = ''
  `);

  const [reservationStatusRows] = await pool.execute(`
    SHOW COLUMNS FROM reservations LIKE 'status'
  `);

  if (reservationStatusRows.length === 0) {
    await pool.execute(`
      ALTER TABLE reservations
      ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending' AFTER return_datetime
    `);
  }

  await pool.execute(`
    UPDATE reservations
    SET status = 'pending'
    WHERE status IS NULL OR TRIM(status) = ''
  `);

  const [reservationTotalPriceRows] = await pool.execute(`
    SHOW COLUMNS FROM reservations LIKE 'total_price'
  `);

  if (reservationTotalPriceRows.length === 0) {
    await pool.execute(`
      ALTER TABLE reservations
      ADD COLUMN total_price DECIMAL(10, 2) NULL AFTER return_datetime
    `);
  }

  const [reservationPriceRateTypeRows] = await pool.execute(`
    SHOW COLUMNS FROM reservations LIKE 'price_rate_type'
  `);

  if (reservationPriceRateTypeRows.length === 0) {
    await pool.execute(`
      ALTER TABLE reservations
      ADD COLUMN price_rate_type VARCHAR(50) NOT NULL DEFAULT 'daily' AFTER total_price
    `);
  }

  const [reservationPriceManualOverrideRows] = await pool.execute(`
    SHOW COLUMNS FROM reservations LIKE 'price_manual_override'
  `);

  if (reservationPriceManualOverrideRows.length === 0) {
    await pool.execute(`
      ALTER TABLE reservations
      ADD COLUMN price_manual_override TINYINT(1) NOT NULL DEFAULT 0 AFTER price_rate_type
    `);
  }

  await pool.execute(`
    UPDATE reservations
    SET price_rate_type = 'daily'
    WHERE price_rate_type IS NULL OR TRIM(price_rate_type) = ''
  `);

  await pool.execute(`
    UPDATE reservations
    SET price_manual_override = 0
    WHERE price_manual_override IS NULL
  `);
}

module.exports = {
  ensureSchema
};
