const mysql = require("mysql2/promise");
const {
  getTargetDatabaseName,
  resolveAdminConnectionConfig,
  resolveDatabaseConfig
} = require("../config/databaseConfig");

let pool;
let ensureDatabaseExistsPromise = null;
let databaseExistsEnsured = false;

function shouldSkipDatabaseProvisioning() {
  return process.env.DB_SKIP_CREATE === "true";
}

function getGlobalRuntime() {
  return globalThis;
}

function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

function getPool() {
  const runtime = getGlobalRuntime();

  if (runtime.__leaLocationDbPool) {
    pool = runtime.__leaLocationDbPool;
    return pool;
  }

  if (!pool) {
    pool = mysql.createPool(resolveDatabaseConfig());
    runtime.__leaLocationDbPool = pool;
  }

  return pool;
}

async function ensureDatabaseExists() {
  if (databaseExistsEnsured) {
    return;
  }

  if (shouldSkipDatabaseProvisioning()) {
    databaseExistsEnsured = true;
    return;
  }

  if (ensureDatabaseExistsPromise) {
    return ensureDatabaseExistsPromise;
  }

  ensureDatabaseExistsPromise = (async () => {
    const connection = await mysql.createConnection(resolveAdminConnectionConfig());

    try {
      const databaseName = escapeIdentifier(getTargetDatabaseName());
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      databaseExistsEnsured = true;
    } finally {
      await connection.end();
    }
  })();

  return ensureDatabaseExistsPromise.finally(() => {
    ensureDatabaseExistsPromise = null;
  });
}

async function pingDatabase() {
  await ensureDatabaseExists();

  const connection = await getPool().getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    const runtime = getGlobalRuntime();
    runtime.__leaLocationDbPool = null;
  }
}

module.exports = {
  closePool,
  ensureDatabaseExists,
  getPool,
  pingDatabase
};
