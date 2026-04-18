require("./loadEnvironment");

const fs = require("fs");
const path = require("path");

const DBINFO_PATH = path.resolve(__dirname, "../../../dbinfo.txt");
const TARGET_DATABASE_NAME = process.env.DB_NAME || "location-de-v";

function readDbInfoFile() {
  if (!fs.existsSync(DBINFO_PATH)) {
    return "";
  }

  return fs.readFileSync(DBINFO_PATH, "utf8");
}

function readSectionValue(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedLabel}\\s*$\\n([^\\n]+)`, "m");
  const match = content.match(pattern);

  return match ? match[1].trim() : "";
}

function readPassword(content) {
  const commandMatch = content.match(/--password=([^\s]+)/);

  if (commandMatch) {
    return commandMatch[1].trim();
  }

  const passwordMatch = content.match(/^Password\s*$\n(?:<redacted>\n)?\((.+)\)$/m);
  return passwordMatch ? passwordMatch[1].trim() : "";
}

function readCaCertificate(content) {
  const marker = "CA certificate : ";
  const certificateIndex = content.indexOf(marker);

  if (certificateIndex === -1) {
    return "";
  }

  return content.slice(certificateIndex + marker.length).trim();
}

function resolveConnectionSettings() {
  const content = readDbInfoFile();
  const host = process.env.DB_HOST || readSectionValue(content, "Host");
  const port = Number(process.env.DB_PORT || readSectionValue(content, "Port"));
  const user = process.env.DB_USER || readSectionValue(content, "User");
  const password = process.env.DB_PASSWORD || readPassword(content);
  const ca = process.env.DB_SSL_CA || readCaCertificate(content);

  if (!host || !port || !user || !password) {
    throw new Error(
      "Database configuration is incomplete. Provide DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME, or keep dbinfo.txt locally."
    );
  }

  const isVercelRuntime = Boolean(process.env.VERCEL);

  return {
    host,
    port,
    user,
    password,
    waitForConnections: true,
    connectionLimit: isVercelRuntime ? 2 : 10,
    maxIdle: isVercelRuntime ? 1 : 10,
    idleTimeout: isVercelRuntime ? 10000 : 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: "utf8mb4",
    ssl: ca
      ? {
          ca
        }
      : undefined
  };
}

function resolveDatabaseConfig() {
  return {
    ...resolveConnectionSettings(),
    database: TARGET_DATABASE_NAME
  };
}

function resolveAdminConnectionConfig() {
  return resolveConnectionSettings();
}

function getTargetDatabaseName() {
  return TARGET_DATABASE_NAME;
}

module.exports = {
  DBINFO_PATH,
  TARGET_DATABASE_NAME,
  getTargetDatabaseName,
  resolveAdminConnectionConfig,
  resolveDatabaseConfig
};
