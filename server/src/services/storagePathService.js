const path = require("path");

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

function resolveWritableRoot() {
  if (isVercelRuntime()) {
    return path.resolve("/tmp/location-de-voiture-lea");
  }

  return path.resolve(__dirname, "../../");
}

function resolveUploadsRoot() {
  return path.resolve(resolveWritableRoot(), "uploads");
}

function resolveSecureStorageRoot() {
  return path.resolve(resolveWritableRoot(), "secure-storage");
}

module.exports = {
  isVercelRuntime,
  resolveWritableRoot,
  resolveUploadsRoot,
  resolveSecureStorageRoot
};
