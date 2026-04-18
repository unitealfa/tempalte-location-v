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
  createSessionToken,
  hashSessionToken
} = require("../utils/sessionCookie");

const DEFAULT_ADMIN = {
  username: "lea",
  email: "lea@gmail.com",
  role: "admin",
  password: "123"
};

const BCRYPT_ROUNDS = 10;

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
  const adminUser = await verifyAdminCredentials({ login, password });
  return sanitizeAdminUser(adminUser);
}

async function createAuthenticatedAdminSession({ login, password }) {
  const adminUser = await verifyAdminCredentials({ login, password });

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

  const sessionTokenHash = hashSessionToken(normalizedToken);
  const session = await findAdminSessionByTokenHash(sessionTokenHash);

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

  const sessionTokenHash = hashSessionToken(normalizedToken);
  await deleteAdminSessionByTokenHash(sessionTokenHash);
}

module.exports = {
  authenticateAdmin,
  createAuthenticatedAdminSession,
  initializeAdminAuth,
  resolveAdminFromSessionToken,
  revokeAdminSession
};
