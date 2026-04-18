const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  createVerificationRequest,
  deleteVerificationRequestsByPurpose,
  findVerificationRequestById,
  markVerificationRequestUsed,
  updateVerificationRequest
} = require("../repositories/adminVerificationRepository");
const {
  findConflictingAdminUser,
  findAdminUserById,
  updateAdminUserPassword,
  updateAdminUserProfile
} = require("../repositories/adminUserRepository");
const { sendVerificationCodeEmail } = require("./emailService");

const PASSWORD_BCRYPT_ROUNDS = 10;
const VERIFICATION_PURPOSES = {
  PROFILE_UPDATE: "profile_update",
  PASSWORD_CHANGE: "password_change"
};
const VERIFICATION_EXPIRY_SECONDS = 300;

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

function createVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function buildExpiryDate() {
  return new Date(Date.now() + VERIFICATION_EXPIRY_SECONDS * 1000);
}

function parsePayload(payloadJson) {
  try {
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}

function maskEmail(email) {
  const [localPart, domain = ""] = String(email).split("@");

  if (!localPart) {
    return email;
  }

  let prefixLength = 3;
  let suffixLength = 2;

  if (localPart.length <= 3) {
    prefixLength = 1;
    suffixLength = 0;
  } else if (localPart.length <= 5) {
    prefixLength = 2;
    suffixLength = 1;
  }

  const visiblePrefix = localPart.slice(0, prefixLength);
  const visibleSuffix = suffixLength > 0 ? localPart.slice(-suffixLength) : "";
  const maskedLength = Math.max(
    3,
    localPart.length - visiblePrefix.length - visibleSuffix.length
  );
  const maskedLocalPart = `${visiblePrefix}${"*".repeat(maskedLength)}${visibleSuffix}`;

  return domain ? `${maskedLocalPart}@${domain}` : maskedLocalPart;
}

function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function getRetryAfterSeconds(expiresAt) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

async function createAndSendVerification({
  admin,
  purpose,
  deliveryEmail,
  payload
}) {
  const code = createVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = buildExpiryDate();

  await deleteVerificationRequestsByPurpose(admin.id, purpose);

  const verification = await createVerificationRequest({
    adminUserId: admin.id,
    purpose,
    deliveryEmail,
    codeHash,
    payloadJson: JSON.stringify(payload),
    expiresAt
  });

  await sendVerificationCodeEmail({
    to: deliveryEmail,
    code,
    purpose
  });

  return {
    verificationId: verification.id,
    maskedEmail: maskEmail(deliveryEmail),
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: VERIFICATION_EXPIRY_SECONDS
  };
}

async function requestProfileUpdateVerification({
  admin,
  username,
  email
}) {
  const nextUsername = String(username || "").trim();
  const nextEmail = String(email || "").trim().toLowerCase();

  if (!nextUsername || !nextEmail) {
    throw new Error("Nom d'utilisateur et email requis.");
  }

  if (nextUsername === admin.username && nextEmail === admin.email) {
    throw new Error("Aucune modification detectee.");
  }

  const conflictingAdmin = await findConflictingAdminUser({
    username: nextUsername,
    email: nextEmail,
    excludeId: admin.id
  });

  if (conflictingAdmin) {
    throw new Error("Le nom d'utilisateur ou l'email est deja utilise.");
  }

  return createAndSendVerification({
    admin,
    purpose: VERIFICATION_PURPOSES.PROFILE_UPDATE,
    deliveryEmail: admin.email,
    payload: {
      username: nextUsername,
      email: nextEmail
    }
  });
}

async function requestPasswordChangeVerification({
  admin,
  currentPassword,
  newPassword
}) {
  const currentAdmin = await findAdminUserById(admin.id);
  const normalizedCurrentPassword = String(currentPassword || "");
  const normalizedNewPassword = String(newPassword || "");

  if (!normalizedCurrentPassword || !normalizedNewPassword) {
    throw new Error("Mot de passe actuel et nouveau mot de passe requis.");
  }

  const currentPasswordMatches = await bcrypt.compare(
    normalizedCurrentPassword,
    currentAdmin.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new Error("Le mot de passe actuel est incorrect.");
  }

  const nextPasswordHash = await bcrypt.hash(
    normalizedNewPassword,
    PASSWORD_BCRYPT_ROUNDS
  );

  return createAndSendVerification({
    admin,
    purpose: VERIFICATION_PURPOSES.PASSWORD_CHANGE,
    deliveryEmail: currentAdmin.email,
    payload: {
      passwordHash: nextPasswordHash
    }
  });
}

async function confirmVerificationRequest({
  admin,
  verificationId,
  code,
  purpose
}) {
  const verification = await findVerificationRequestById(verificationId);

  if (!verification || verification.adminUserId !== admin.id) {
    throw new Error("Demande de verification introuvable.");
  }

  if (verification.purpose !== purpose) {
    throw new Error("Type de verification invalide.");
  }

  if (verification.usedAt) {
    throw new Error("Ce code a deja ete utilise.");
  }

  if (isExpired(verification.expiresAt)) {
    throw new Error("Le code a expire.");
  }

  const codeHash = hashVerificationCode(String(code || "").trim());

  if (!String(code || "").trim() || codeHash !== verification.codeHash) {
    throw new Error("Code de verification invalide.");
  }

  const payload = parsePayload(verification.payloadJson);

  if (!payload) {
    throw new Error("Demande de verification invalide.");
  }

  let updatedAdmin;

  if (purpose === VERIFICATION_PURPOSES.PROFILE_UPDATE) {
    const conflictingAdmin = await findConflictingAdminUser({
      username: payload.username,
      email: payload.email,
      excludeId: admin.id
    });

    if (conflictingAdmin) {
      throw new Error("Le nom d'utilisateur ou l'email est deja utilise.");
    }

    updatedAdmin = await updateAdminUserProfile(admin.id, {
      username: payload.username,
      email: payload.email
    });
  } else if (purpose === VERIFICATION_PURPOSES.PASSWORD_CHANGE) {
    updatedAdmin = await updateAdminUserPassword(admin.id, payload.passwordHash);
  } else {
    throw new Error("Type de verification non pris en charge.");
  }

  await markVerificationRequestUsed(verification.id);

  return sanitizeAdminUser(updatedAdmin);
}

async function resendVerificationRequest({
  admin,
  verificationId,
  purpose
}) {
  const verification = await findVerificationRequestById(verificationId);

  if (!verification || verification.adminUserId !== admin.id) {
    throw new Error("Demande de verification introuvable.");
  }

  if (verification.purpose !== purpose) {
    throw new Error("Type de verification invalide.");
  }

  if (verification.usedAt) {
    throw new Error("Cette demande a deja ete validee.");
  }

  if (!isExpired(verification.expiresAt)) {
    const retryAfterSeconds = getRetryAfterSeconds(verification.expiresAt);
    const error = new Error("Le code actuel est encore valide.");
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  const code = createVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = buildExpiryDate();

  await updateVerificationRequest(verification.id, {
    codeHash,
    expiresAt
  });

  await sendVerificationCodeEmail({
    to: verification.deliveryEmail,
    code,
    purpose
  });

  return {
    verificationId: verification.id,
    maskedEmail: maskEmail(verification.deliveryEmail),
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: VERIFICATION_EXPIRY_SECONDS
  };
}

module.exports = {
  VERIFICATION_PURPOSES,
  confirmVerificationRequest,
  requestPasswordChangeVerification,
  requestProfileUpdateVerification,
  resendVerificationRequest
};
