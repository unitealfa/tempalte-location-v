const LEGACY_ADMIN_SESSION_KEY = "lea_admin_session";

export function clearLegacyAdminClientState() {
  window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}
