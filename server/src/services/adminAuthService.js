const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { ensureSchema } = require("../db/schema");
const {
  createAdminUser,
  findAdminUserById,
  findAdminUserByIdentity,
  findAdminUserByLogin
} = require("../repositories/adminUserRepository");
const {
  createAdminSession,
  deleteAdminSessionByTokenHash,
  deleteAdminSessionsByAdminUserId,
  findAdminSessionByTokenHash,
  touchAdminSession
} = require("../repositories/adminSessionRepository");
const {
  ADMIN_SESSION_MAX_AGE_MS,
  createSessionToken,
  hashSessionToken
} = require("../utils/sessionCookie");
const { getRuntimeState } = require("./runtimeStateService");
const { isDatabaseUnavailableError } = require("../utils/databaseError");

const DEFAULT_ADMIN = {
  username: "lea",
  email: "lea@gmail.com",
  role: "admin",
  password: "123"
};

const BCRYPT_ROUNDS = 10;
const FALLBACK_SESSION_PREFIX = "fallback";

function sanitizeAdminUser(adminUser) {
  if (!adminUser) {
    return null;
  }

  return {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    role: adminUser.role
  };
}

function getFallbackAdminConfig() {
  return {
    id: "fallback-admin",
    username: String(
      process.env.ADMIN_FALLBACK_USERNAME || DEFAULT_ADMIN.username
    ).trim(),
    email: String(
      process.env.ADMIN_FALLBACK_EMAIL || DEFAULT_ADMIN.email
    ).trim(),
    role: String(process.env.ADMIN_FALLBACK_ROLE || DEFAULT_ADMIN.role).trim() || "admin",
    password: String(
      process.env.ADMIN_FALLBACK_PASSWORD || DEFAULT_ADMIN.password
    )
  };
}

function getFallbackSessionSecret() {
  return String(
    process.env.SESSION_SECRET || "lea-location-fallback-session-secret"
  );
}

function buildFallbackAdminUser() {
  const fallbackAdminConfig = getFallbackAdminConfig();

  return {
    id: fallbackAdminConfig.id,
    username: fallbackAdminConfig.username,
    email: fallbackAdminConfig.email,
    role: fallbackAdminConfig.role
  };
}

function normalizeLoginValue(login) {
  return String(login || "").trim().toLowerCase();
}

function matchesFallbackCredentials({ login, password }) {
  const fallbackAdminConfig = getFallbackAdminConfig();
  const normalizedLogin = normalizeLoginValue(login);
  const normalizedUsername = normalizeLoginValue(fallbackAdminConfig.username);
  const normalizedEmail = normalizeLoginValue(fallbackAdminConfig.email);

  return (
    (normalizedLogin === normalizedUsername || normalizedLogin === normalizedEmail) &&
    String(password || "") === fallbackAdminConfig.password
  );
}

function signFallbackSessionPayload(payloadSegment) {
  return crypto
    .createHmac("sha256", getFallbackSessionSecret())
    .update(payloadSegment)
    .digest("base64url");
}

function createFallbackAdminSessionToken(admin) {
  const payloadSegment = Buffer.from(
    JSON.stringify({
      sub: String(admin.id),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      exp: Date.now() + ADMIN_SESSION_MAX_AGE_MS
    })
  ).toString("base64url");

  return [
    FALLBACK_SESSION_PREFIX,
    payloadSegment,
    signFallbackSessionPayload(payloadSegment)
  ].join(".");
}

function resolveFallbackAdminFromToken(sessionToken) {
  const [prefix, payloadSegment, signature] = String(sessionToken || "").split(".");

  if (
    prefix !== FALLBACK_SESSION_PREFIX ||
    !payloadSegment ||
    !signature ||
    signFallbackSessionPayload(payloadSegment) !== signature
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf8")
    );

    if (!payload || Number(payload.exp) <= Date.now()) {
      return null;
    }

    return {
      id: payload.sub || "fallback-admin",
      username: String(payload.username || "").trim(),
      email: String(payload.email || "").trim(),
      role: String(payload.role || "admin").trim() || "admin"
    };
  } catch (error) {
    return null;
  }
}

function isFallbackSessionToken(sessionToken) {
  return String(sessionToken || "").startsWith(`${FALLBACK_SESSION_PREFIX}.`);
}

async function verifyAdminCredentials({ login, password }) {
  const normalizedLogin = typeof login === "string" ? login.trim() : "";
  const rawPassword = typeof password === "string" ? password : "";

  if (!normalizedLogin || !rawPassword) {
    return null;
  }

  const adminUser = await findAdminUserByLogin(normalizedLogin);

  if (!adminUser) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    rawPassword,
    adminUser.passwordHash
  );

  if (!passwordMatches) {
    return null;
  }

  return adminUser;
}

async function initializeAdminAuth() {
  await ensureSchema();

  const existingAdmin = await findAdminUserByIdentity(
    DEFAULT_ADMIN.username,
    DEFAULT_ADMIN.email
  );

  if (existingAdmin) {
    return sanitizeAdminUser(existingAdmin);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, BCRYPT_ROUNDS);
  const createdAdmin = await createAdminUser({
    username: DEFAULT_ADMIN.username,
    email: DEFAULT_ADMIN.email,
    role: DEFAULT_ADMIN.role,
    passwordHash
  });

  return sanitizeAdminUser(createdAdmin);
}

async function authenticateAdmin({ login, password }) {
  try {
    const adminUser = await verifyAdminCredentials({ login, password });

    if (adminUser) {
      return sanitizeAdminUser(adminUser);
    }
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
  }

  if (matchesFallbackCredentials({ login, password })) {
    return buildFallbackAdminUser();
  }

  return null;
}

async function createAuthenticatedAdminSession({ login, password }) {
  const runtimeState = getRuntimeState();

  if (!runtimeState.database.ready) {
    if (!matchesFallbackCredentials({ login, password })) {
      return null;
    }

    const admin = buildFallbackAdminUser();

    return {
      admin,
      sessionToken: createFallbackAdminSessionToken(admin)
    };
  }

  let adminUser;

  try {
    adminUser = await verifyAdminCredentials({ login, password });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    if (!matchesFallbackCredentials({ login, password })) {
      return null;
    }

    const admin = buildFallbackAdminUser();

    return {
      admin,
      sessionToken: createFallbackAdminSessionToken(admin)
    };
  }

  if (!adminUser) {
    return null;
  }

  await deleteAdminSessionsByAdminUserId(adminUser.id);

  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);

  await createAdminSession({
    adminUserId: adminUser.id,
    tokenHash: sessionTokenHash
  });

  return {
    admin: sanitizeAdminUser(adminUser),
    sessionToken
  };
}

async function resolveAdminFromSessionToken(sessionToken) {
  const normalizedToken =
    typeof sessionToken === "string" ? sessionToken.trim() : "";

  if (!normalizedToken) {
    return null;
  }

  if (isFallbackSessionToken(normalizedToken)) {
    return resolveFallbackAdminFromToken(normalizedToken);
  }

  if (!getRuntimeState().database.ready) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(normalizedToken);
  let session;

  try {
    session = await findAdminSessionByTokenHash(sessionTokenHash);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }

  if (!session) {
    return null;
  }

  await touchAdminSession(session.id);

  const adminUser = await findAdminUserById(session.admin_user_id);

  if (!adminUser) {
    await deleteAdminSessionByTokenHash(sessionTokenHash);
    return null;
  }

  return sanitizeAdminUser(adminUser);
}

async function revokeAdminSession(sessionToken) {
  const normalizedToken =
    typeof sessionToken === "string" ? sessionToken.trim() : "";

  if (!normalizedToken) {
    return;
  }

  if (isFallbackSessionToken(normalizedToken) || !getRuntimeState().database.ready) {
    return;
  }

  const sessionTokenHash = hashSessionToken(normalizedToken);

  try {
    await deleteAdminSessionByTokenHash(sessionTokenHash);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
  }
}

module.exports = {
  authenticateAdmin,
  createAuthenticatedAdminSession,
  initializeAdminAuth,
  resolveAdminFromSessionToken,
  revokeAdminSession
};
