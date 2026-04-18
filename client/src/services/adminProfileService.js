import {
  createAdminUnauthorizedError,
  notifyAdminUnauthorized
} from "./adminSessionGuard";

async function parseApiResponse(response, fallbackMessage) {
  if (response.status === 401) {
    notifyAdminUnauthorized();
    throw createAdminUnauthorizedError();
  }

  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    const error = new Error(payload.message || fallbackMessage);
    error.retryAfterSeconds = payload.retryAfterSeconds || 0;
    throw error;
  }

  return payload;
}

export async function getAdminProfile() {
  const response = await fetch("/api/admin/profile", {
    credentials: "include"
  });

  return parseApiResponse(response, "Lecture du profil admin impossible.");
}

export async function requestAdminProfileUpdate(payload) {
  const response = await fetch("/api/admin/profile/update/request", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(
    response,
    "Preparation de la modification du profil impossible."
  );
}

export async function confirmAdminProfileUpdate(payload) {
  const response = await fetch("/api/admin/profile/update/confirm", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(
    response,
    "Confirmation de la modification du profil impossible."
  );
}

export async function resendAdminProfileUpdateCode(payload) {
  const response = await fetch("/api/admin/profile/update/resend", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(response, "Renvoi du code profile impossible.");
}

export async function requestAdminPasswordChange(payload) {
  const response = await fetch("/api/admin/profile/password/request", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(
    response,
    "Preparation de la modification du mot de passe impossible."
  );
}

export async function confirmAdminPasswordChange(payload) {
  const response = await fetch("/api/admin/profile/password/confirm", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(
    response,
    "Confirmation de la modification du mot de passe impossible."
  );
}

export async function resendAdminPasswordCode(payload) {
  const response = await fetch("/api/admin/profile/password/resend", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(response, "Renvoi du code mot de passe impossible.");
}
