require("./config/loadEnvironment");

const path = require("path");
const express = require("express");
const cors = require("cors");
const contentRoutes = require("./routes/contentRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminProtectedRoutes = require("./routes/adminProtectedRoutes");
const adminProfileRoutes = require("./routes/adminProfileRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const vehicleMediaRoutes = require("./routes/vehicleMediaRoutes");
const brandingMediaRoutes = require("./routes/brandingMediaRoutes");
const adminVehicleRoutes = require("./routes/adminVehicleRoutes");
const adminReservationRoutes = require("./routes/adminReservationRoutes");
const {
  requireDatabaseReady
} = require("./middleware/databaseReadyMiddleware");
const {
  hydrateAdminRequest
} = require("./middleware/adminAuthMiddleware");
const { getTargetDatabaseName } = require("./config/databaseConfig");
const { getRuntimeState } = require("./services/runtimeStateService");
const { resolveUploadsRoot } = require("./services/storagePathService");
const { createUploadsFallbackMiddleware } = require("./middleware/uploadsFallbackMiddleware");

const uploadsRoot = resolveUploadsRoot();

function createApiApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads/reservations", (request, response) => {
    response.status(404).json({
      message: "Not found"
    });
  });
  app.use(
    "/uploads",
    express.static(uploadsRoot, {
      immutable: true,
      maxAge: "30d"
    })
  );
  app.use("/uploads", createUploadsFallbackMiddleware());

  app.get("/api/health", (request, response) => {
    const runtimeState = getRuntimeState();
    response.json({
      status: "ok",
      database: runtimeState.database,
      databaseName: getTargetDatabaseName(),
      adminSeed: runtimeState.adminSeed,
      deploymentTarget: process.env.VERCEL ? "vercel" : "node"
    });
  });

  app.use("/api/content", contentRoutes);
  app.use("/api/media/branding", requireDatabaseReady, brandingMediaRoutes);
  app.use("/api/media/vehicles", requireDatabaseReady, vehicleMediaRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api/admin", adminAuthRoutes);
  app.use(
    "/api/admin/protected",
    hydrateAdminRequest,
    adminProtectedRoutes
  );
  app.use(
    "/api/admin/profile",
    hydrateAdminRequest,
    adminProfileRoutes
  );
  app.use(
    "/api/admin/vehicles",
    hydrateAdminRequest,
    adminVehicleRoutes
  );
  app.use(
    "/api/admin/reservations",
    hydrateAdminRequest,
    adminReservationRoutes
  );

  app.use("/api", (request, response) => {
    response.status(404).json({ message: "API route not found" });
  });

  app.use((error, request, response, next) => {
    if (!request.path.startsWith("/api")) {
      return next(error);
    }

    console.error("API request failed.", error);
    response.status(500).json({
      message: error.message || "Erreur serveur interne."
    });
  });

  return app;
}

module.exports = {
  createApiApp
};
