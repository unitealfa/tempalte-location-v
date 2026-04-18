const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  VERIFICATION_PURPOSES,
  confirmVerificationRequest,
  requestPasswordChangeVerification,
  requestProfileUpdateVerification,
  resendVerificationRequest
} = require("../services/adminProfileService");
const {
  getDatabaseUnavailableMessage,
  isDatabaseUnavailableError
} = require("../utils/databaseError");

const router = express.Router();

router.use(requireAdminApiAuth);

router.get("/", (request, response) => {
  response.json({
    admin: request.admin
  });
});

router.post("/update/request", async (request, response) => {
  try {
    const result = await requestProfileUpdateVerification({
      admin: request.admin,
      username: request.body?.username,
      email: request.body?.email
    });

    response.json({
      message: "Code de verification envoye par email.",
      ...result
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "La mise a jour du profil est impossible pour le moment. Reessayez dans quelques instants."
        )
      });
    }

    const statusCode =
      error.message === "Le nom d'utilisateur ou l'email est deja utilise."
        ? 409
        : 400;

    response.status(statusCode).json({
      message: error.message || "Impossible de preparer la modification du profil."
    });
  }
});

router.post("/update/confirm", async (request, response) => {
  try {
    const updatedAdmin = await confirmVerificationRequest({
      admin: request.admin,
      verificationId: Number(request.body?.verificationId),
      code: request.body?.code,
      purpose: VERIFICATION_PURPOSES.PROFILE_UPDATE
    });

    response.json({
      message: "Profil admin mis a jour avec succes.",
      admin: updatedAdmin
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "La confirmation de la mise a jour du profil est impossible pour le moment. Reessayez dans quelques instants."
        )
      });
    }

    const statusCode =
      error.message === "Le nom d'utilisateur ou l'email est deja utilise."
        ? 409
        : 400;

    response.status(statusCode).json({
      message: error.message || "Impossible de confirmer la modification du profil."
    });
  }
});

router.post("/update/resend", async (request, response) => {
  try {
    const result = await resendVerificationRequest({
      admin: request.admin,
      verificationId: Number(request.body?.verificationId),
      purpose: VERIFICATION_PURPOSES.PROFILE_UPDATE
    });

    response.json({
      message: "Nouveau code envoye par email.",
      ...result
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "Le renvoi du code est impossible pour le moment. Reessayez dans quelques instants."
        ),
        retryAfterSeconds: 0
      });
    }

    const statusCode = error.retryAfterSeconds ? 429 : 400;

    response.status(statusCode).json({
      message: error.message || "Impossible de renvoyer le code.",
      retryAfterSeconds: error.retryAfterSeconds || 0
    });
  }
});

router.post("/password/request", async (request, response) => {
  try {
    const result = await requestPasswordChangeVerification({
      admin: request.admin,
      currentPassword: request.body?.currentPassword,
      newPassword: request.body?.newPassword
    });

    response.json({
      message: "Code de verification envoye par email.",
      ...result
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "La modification du mot de passe est impossible pour le moment. Reessayez dans quelques instants."
        )
      });
    }

    response.status(400).json({
      message:
        error.message ||
        "Impossible de preparer la modification du mot de passe."
    });
  }
});

router.post("/password/confirm", async (request, response) => {
  try {
    const updatedAdmin = await confirmVerificationRequest({
      admin: request.admin,
      verificationId: Number(request.body?.verificationId),
      code: request.body?.code,
      purpose: VERIFICATION_PURPOSES.PASSWORD_CHANGE
    });

    response.json({
      message: "Mot de passe mis a jour avec succes.",
      admin: updatedAdmin
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "La confirmation du mot de passe est impossible pour le moment. Reessayez dans quelques instants."
        )
      });
    }

    response.status(400).json({
      message:
        error.message ||
        "Impossible de confirmer la modification du mot de passe."
    });
  }
});

router.post("/password/resend", async (request, response) => {
  try {
    const result = await resendVerificationRequest({
      admin: request.admin,
      verificationId: Number(request.body?.verificationId),
      purpose: VERIFICATION_PURPOSES.PASSWORD_CHANGE
    });

    response.json({
      message: "Nouveau code envoye par email.",
      ...result
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage(
          "Le renvoi du code est impossible pour le moment. Reessayez dans quelques instants."
        ),
        retryAfterSeconds: 0
      });
    }

    const statusCode = error.retryAfterSeconds ? 429 : 400;

    response.status(statusCode).json({
      message: error.message || "Impossible de renvoyer le code.",
      retryAfterSeconds: error.retryAfterSeconds || 0
    });
  }
});

module.exports = router;
