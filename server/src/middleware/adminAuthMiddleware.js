const { resolveAdminFromSessionToken } = require("../services/adminAuthService");
const { getRuntimeState } = require("../services/runtimeStateService");
const { clearAdminSessionCookie, readAdminSessionToken } = require("../utils/sessionCookie");

async function hydrateAdminRequest(request, response, next) {
  try {
    const runtimeState = getRuntimeState();

    if (!runtimeState.database.ready) {
      request.admin = null;
      return next();
    }

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
