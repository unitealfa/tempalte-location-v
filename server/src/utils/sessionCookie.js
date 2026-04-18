const crypto = require("crypto");

const ADMIN_SESSION_COOKIE_NAME = "lea_admin_session";
const ADMIN_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 * 10;

function createSessionToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function readAdminSessionToken(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  return cookies[ADMIN_SESSION_COOKIE_NAME] || "";
}

function setAdminSessionCookie(response, token) {
  response.cookie(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE_MS,
    path: "/"
  });
}

function clearAdminSessionCookie(response) {
  response.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

module.exports = {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_MS,
  clearAdminSessionCookie,
  createSessionToken,
  hashSessionToken,
  readAdminSessionToken,
  setAdminSessionCookie
};
