const { resolveAdminFromSessionToken } = require("../services/adminAuthService");
const { clearAdminSessionCookie, readAdminSessionToken } = require("../utils/sessionCookie");
const { isDatabaseUnavailableError } = require("../utils/databaseError");

async function hydrateAdminRequest(request, response, next) {
  try {
    const sessionToken = readAdminSessionToken(request);

    if (!sessionToken) {
      request.admin = null;
      return next();
    }

    const admin = await resolveAdminFromSessionToken(sessionToken);

    if (!admin) {
      clearAdminSessionCookie(response);
      request.admin = null;
      return next();
    }

    request.admin = admin;
    return next();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      request.admin = null;
      return next();
    }

    return next(error);
  }
}

function requireAdminApiAuth(request, response, next) {
  if (!request.admin) {
    return response.status(401).json({
      message: "Authentification admin requise."
    });
  }

  return next();
}

function requireAdminPageAuth(request, response, next) {
  if (!request.admin) {
    return response.redirect(302, "/admin/login");
  }

  return next();
}

module.exports = {
  hydrateAdminRequest,
  requireAdminApiAuth,
  requireAdminPageAuth
};
