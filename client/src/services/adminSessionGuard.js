const ADMIN_UNAUTHORIZED_EVENT = "lea:admin-unauthorized";
let lastAdminUnauthorizedAt = 0;

export function notifyAdminUnauthorized() {
  const now = Date.now();

  if (now - lastAdminUnauthorizedAt < 2000) {
    return;
  }

  lastAdminUnauthorizedAt = now;
  window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
}

export function isAdminUnauthorizedError(error) {
  return Boolean(error && error.adminUnauthorized === true);
}

export function createAdminUnauthorizedError(
  message = "Session admin expiree. Reconnectez-vous."
) {
  const error = new Error(message);
  error.adminUnauthorized = true;
  return error;
}

export function getAdminUnauthorizedEventName() {
  return ADMIN_UNAUTHORIZED_EVENT;
}
