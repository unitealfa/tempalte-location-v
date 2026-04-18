const path = require("path");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".jfif"
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogg",
  ".ogv"
]);

function createUploadsFallbackMiddleware() {
  return function uploadsFallbackMiddleware(request, response) {
    const extension = path.extname(request.path || "").toLowerCase();

    if (request.path.startsWith("/branding/") && IMAGE_EXTENSIONS.has(extension)) {
      return response.redirect(307, "/home/rentzo-logo.jpg");
    }

    if (request.path.startsWith("/vehicles/") && IMAGE_EXTENSIONS.has(extension)) {
      return response.redirect(307, "/home/rentzo-catalog-hero.jpg");
    }

    if (request.path.startsWith("/vehicles/") && VIDEO_EXTENSIONS.has(extension)) {
      return response.status(204).end();
    }

    return response.status(204).end();
  };
}

module.exports = {
  createUploadsFallbackMiddleware
};
