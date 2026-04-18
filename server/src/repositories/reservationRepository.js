const { getPool } = require("../db/pool");
const {
  DEFAULT_VEHICLE_IMAGE_URL,
  sanitizeVehicleImageUrl
} = require("../services/mediaUrlService");

function mapReservation(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleBrand: row.vehicle_brand,
    vehicleModel: row.vehicle_model,
    vehicleVersion: row.vehicle_version,
    vehiclePhotoUrl: sanitizeVehicleImageUrl(row.vehicle_photo_url) || DEFAULT_VEHICLE_IMAGE_URL,
    firstName: row.first_name,
    lastName: row.last_name,
    drivingLicensePhotoUrl: row.driving_license_photo_url,
    email: row.email,
    phone: row.phone,
    comment: row.comment,
    pickupLocationType: row.pickup_location_type,
    returnLocationType: row.return_location_type,
    pickupDatetime: row.pickup_datetime,
    returnDatetime: row.return_datetime,
    totalPrice: row.total_price === null ? null : Number(row.total_price),
    priceRateType: row.price_rate_type,
    priceManualOverride: Boolean(row.price_manual_override),
    status: row.status,
    privacyPolicyAccepted: Boolean(row.privacy_policy_accepted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeDbParameter(value, fallbackValue = null) {
  return value === undefined ? fallbackValue : value;
}

async function createReservation(reservation) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO reservations (
        vehicle_id,
        vehicle_brand,
        vehicle_model,
        vehicle_version,
        vehicle_photo_url,
        first_name,
        last_name,
        driving_license_photo_url,
        email,
        phone,
        comment,
        pickup_location_type,
        return_location_type,
        pickup_datetime,
        return_datetime,
        total_price,
        price_rate_type,
        price_manual_override,
        status,
        privacy_policy_accepted
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      normalizeDbParameter(reservation.vehicleId),
      normalizeDbParameter(reservation.vehicleBrand, ""),
      normalizeDbParameter(reservation.vehicleModel, ""),
      normalizeDbParameter(reservation.vehicleVersion, ""),
      normalizeDbParameter(reservation.vehiclePhotoUrl, DEFAULT_VEHICLE_IMAGE_URL),
      normalizeDbParameter(reservation.firstName, ""),
      normalizeDbParameter(reservation.lastName, ""),
      normalizeDbParameter(reservation.drivingLicensePhotoUrl, ""),
      normalizeDbParameter(reservation.email),
      normalizeDbParameter(reservation.phone, ""),
      normalizeDbParameter(reservation.comment, ""),
      normalizeDbParameter(reservation.pickupLocationType, ""),
      normalizeDbParameter(reservation.returnLocationType, ""),
      normalizeDbParameter(reservation.pickupDatetime, null),
      normalizeDbParameter(reservation.returnDatetime, null),
      normalizeDbParameter(reservation.totalPrice),
      normalizeDbParameter(reservation.priceRateType, "daily"),
      reservation.priceManualOverride ? 1 : 0,
      normalizeDbParameter(reservation.status, "pending"),
      reservation.privacyPolicyAccepted ? 1 : 0
    ]
  );

  return findReservationById(result.insertId);
}

async function findReservationById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        vehicle_id,
        vehicle_brand,
        vehicle_model,
        vehicle_version,
        vehicle_photo_url,
        first_name,
        last_name,
        driving_license_photo_url,
        email,
        phone,
        comment,
        pickup_location_type,
        return_location_type,
        pickup_datetime,
        return_datetime,
        total_price,
        price_rate_type,
        price_manual_override,
        status,
        privacy_policy_accepted,
        created_at,
        updated_at
      FROM reservations
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapReservation(rows[0]);
}

async function listReservations({ status, futureOnly = false } = {}) {
  const pool = getPool();
  const whereClauses = [];
  const parameters = [];

  if (status) {
    whereClauses.push("status = ?");
    parameters.push(status);
  }

  if (futureOnly) {
    whereClauses.push("return_datetime >= NOW()");
  }

  const [rows] = await pool.execute(
    `
      SELECT
        id,
        vehicle_id,
        vehicle_brand,
        vehicle_model,
        vehicle_version,
        vehicle_photo_url,
        first_name,
        last_name,
        driving_license_photo_url,
        email,
        phone,
        comment,
        pickup_location_type,
        return_location_type,
        pickup_datetime,
        return_datetime,
        total_price,
        price_rate_type,
        price_manual_override,
        status,
        privacy_policy_accepted,
        created_at,
        updated_at
      FROM reservations
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY pickup_datetime ASC, id DESC
    `,
    parameters
  );

  return rows.map(mapReservation);
}

async function clearReservationDrivingLicensePhotoUrl(id) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE reservations
      SET driving_license_photo_url = NULL
      WHERE id = ?
    `,
    [id]
  );

  return findReservationById(id);
}

async function updateReservationStatus(id, status) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE reservations
      SET status = ?
      WHERE id = ?
    `,
    [status, id]
  );

  return findReservationById(id);
}

async function updateReservation(id, reservation) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE reservations
      SET
        vehicle_id = ?,
        vehicle_brand = ?,
        vehicle_model = ?,
        vehicle_version = ?,
        vehicle_photo_url = ?,
        first_name = ?,
        last_name = ?,
        driving_license_photo_url = ?,
        email = ?,
        phone = ?,
        comment = ?,
        pickup_location_type = ?,
        return_location_type = ?,
        pickup_datetime = ?,
        return_datetime = ?,
        total_price = ?,
        price_rate_type = ?,
        price_manual_override = ?,
        status = ?,
        privacy_policy_accepted = ?
      WHERE id = ?
    `,
    [
      normalizeDbParameter(reservation.vehicleId),
      normalizeDbParameter(reservation.vehicleBrand, ""),
      normalizeDbParameter(reservation.vehicleModel, ""),
      normalizeDbParameter(reservation.vehicleVersion, ""),
      normalizeDbParameter(reservation.vehiclePhotoUrl, DEFAULT_VEHICLE_IMAGE_URL),
      normalizeDbParameter(reservation.firstName, ""),
      normalizeDbParameter(reservation.lastName, ""),
      normalizeDbParameter(reservation.drivingLicensePhotoUrl, ""),
      normalizeDbParameter(reservation.email),
      normalizeDbParameter(reservation.phone, ""),
      normalizeDbParameter(reservation.comment, ""),
      normalizeDbParameter(reservation.pickupLocationType, ""),
      normalizeDbParameter(reservation.returnLocationType, ""),
      normalizeDbParameter(reservation.pickupDatetime, null),
      normalizeDbParameter(reservation.returnDatetime, null),
      normalizeDbParameter(reservation.totalPrice),
      normalizeDbParameter(reservation.priceRateType, "daily"),
      reservation.priceManualOverride ? 1 : 0,
      normalizeDbParameter(reservation.status, "pending"),
      reservation.privacyPolicyAccepted ? 1 : 0,
      id
    ]
  );

  return findReservationById(id);
}

async function deleteReservation(id) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM reservations
      WHERE id = ?
    `,
    [id]
  );
}

async function findOverlappingAcceptedReservation(vehicleId, pickupDatetime, returnDatetime, excludedReservationId = null) {
  const pool = getPool();
  const parameters = [
    vehicleId,
    returnDatetime,
    pickupDatetime
  ];
  const exclusionSql =
    Number.isInteger(excludedReservationId) && excludedReservationId > 0
      ? "AND id <> ?"
      : "";

  if (exclusionSql) {
    parameters.push(excludedReservationId);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        id,
        vehicle_id,
        vehicle_brand,
        vehicle_model,
        vehicle_version,
        vehicle_photo_url,
        first_name,
        last_name,
        driving_license_photo_url,
        email,
        phone,
        comment,
        pickup_location_type,
        return_location_type,
        pickup_datetime,
        return_datetime,
        status,
        privacy_policy_accepted,
        created_at,
        updated_at
      FROM reservations
      WHERE vehicle_id = ?
        AND status = 'accepted'
        AND pickup_datetime < ?
        AND return_datetime > ?
        ${exclusionSql}
      ORDER BY pickup_datetime ASC, id ASC
      LIMIT 1
    `,
    parameters
  );

  return mapReservation(rows[0]);
}

async function listVehicleIdsWithFutureAcceptedReservations() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT DISTINCT vehicle_id
      FROM reservations
      WHERE vehicle_id IS NOT NULL
        AND status = 'accepted'
        AND return_datetime >= NOW()
    `
  );

  return rows
    .map((row) => Number(row.vehicle_id))
    .filter((vehicleId) => Number.isInteger(vehicleId) && vehicleId > 0);
}

async function listAcceptedReservationsByVehicleId(vehicleId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        vehicle_id,
        vehicle_brand,
        vehicle_model,
        vehicle_version,
        vehicle_photo_url,
        first_name,
        last_name,
        driving_license_photo_url,
        email,
        phone,
        comment,
        pickup_location_type,
        return_location_type,
        pickup_datetime,
        return_datetime,
        status,
        privacy_policy_accepted,
        created_at,
        updated_at
      FROM reservations
      WHERE vehicle_id = ?
        AND status = 'accepted'
        AND return_datetime >= NOW()
      ORDER BY pickup_datetime ASC, id ASC
    `,
    [vehicleId]
  );

  return rows.map(mapReservation);
}

module.exports = {
  createReservation,
  deleteReservation,
  listAcceptedReservationsByVehicleId,
  findReservationById,
  findOverlappingAcceptedReservation,
  listReservations,
  listVehicleIdsWithFutureAcceptedReservations,
  updateReservation,
  updateReservationStatus,
  clearReservationDrivingLicensePhotoUrl
};
