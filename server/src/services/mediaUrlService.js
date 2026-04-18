const fs = require("fs");
const path = require("path");
const { resolveUploadsRoot } = require("./storagePathService");

const uploadsRoot = resolveUploadsRoot();
const DEFAULT_VEHICLE_IMAGE_URL = "/home/rentzo-catalog-hero.jpg";
const DEFAULT_BRANDING_IMAGE_URL = "/home/rentzo-logo.jpg";

function isManagedUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

function toManagedUploadPath(url) {
  if (!isManagedUploadUrl(url)) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

function hasManagedUploadFile(url) {
  const filePath = toManagedUploadPath(url);

  if (!filePath) {
    return true;
  }

  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function sanitizeVehicleImageUrl(url) {
  const normalizedUrl = String(url || "").trim();

  if (!normalizedUrl) {
    return "";
  }

  if (!isManagedUploadUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  return hasManagedUploadFile(normalizedUrl) ? normalizedUrl : "";
}

function sanitizeVehicleVideoUrl(url) {
  const normalizedUrl = String(url || "").trim();

  if (!normalizedUrl) {
    return "";
  }

  if (!isManagedUploadUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  return hasManagedUploadFile(normalizedUrl) ? normalizedUrl : "";
}

function sanitizeBrandingImageUrl(url) {
  const normalizedUrl = String(url || "").trim();

  if (!normalizedUrl) {
    return DEFAULT_BRANDING_IMAGE_URL;
  }

  if (!isManagedUploadUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  return hasManagedUploadFile(normalizedUrl)
    ? normalizedUrl
    : DEFAULT_BRANDING_IMAGE_URL;
}

function sanitizeVehiclePhotoUrls(urls) {
  return (Array.isArray(urls) ? urls : [])
    .map((url) => sanitizeVehicleImageUrl(url))
    .filter(Boolean);
}

module.exports = {
  DEFAULT_BRANDING_IMAGE_URL,
  DEFAULT_VEHICLE_IMAGE_URL,
  sanitizeBrandingImageUrl,
  sanitizeVehicleImageUrl,
  sanitizeVehiclePhotoUrls,
  sanitizeVehicleVideoUrl
};
