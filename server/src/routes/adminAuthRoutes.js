const express = require("express");
const {
  createAuthenticatedAdminSession,
  revokeAdminSession
} = require("../services/adminAuthService");
const { hydrateAdminRequest } = require("../middleware/adminAuthMiddleware");
const {
  clearAdminSessionCookie,
  readAdminSessionToken,
  setAdminSessionCookie
} = require("../utils/sessionCookie");

const router = express.Router();

router.post("/login", async (request, response) => {
  try {
    const { login, password } = request.body || {};

    if (typeof login !== "string" || typeof password !== "string") {
      return response.status(400).json({
        message: "Login et mot de passe requis."
      });
    }

    const authenticatedSession = await createAuthenticatedAdminSession({
      login,
      password
    });

    if (!authenticatedSession) {
      return response.status(401).json({
        message: "Identifiants invalides."
      });
    }

    setAdminSessionCookie(response, authenticatedSession.sessionToken);

    return response.json({
      message: "Connexion admin reussie.",
      admin: authenticatedSession.admin
    });
  } catch (error) {
    console.error("Admin login failed", error);
    return response.status(500).json({
      message: "Erreur interne pendant la connexion admin."
    });
  }
});

router.get("/session", hydrateAdminRequest, (request, response) => {
  return response.json({ admin: request.admin || null });
});

router.post("/logout", async (request, response) => {
  try {
    const sessionToken = readAdminSessionToken(request);
    await revokeAdminSession(sessionToken);
    clearAdminSessionCookie(response);

    return response.json({
      message: "Deconnexion admin reussie."
    });
  } catch (error) {
    console.error("Admin logout failed", error);
    return response.status(500).json({
      message: "Erreur interne pendant la deconnexion admin."
    });
  }
});

module.exports = router;
