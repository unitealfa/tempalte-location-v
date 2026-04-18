require("./config/loadEnvironment");

const fs = require("fs/promises");
const http = require("http");
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
  hydrateAdminRequest,
  requireAdminPageAuth
} = require("./middleware/adminAuthMiddleware");
const {
  closePool
} = require("./db/pool");
const { getTargetDatabaseName } = require("./config/databaseConfig");
const { stopReservationLicenseCleanupScheduler } = require("./services/reservationService");
const {
  getRuntimeState,
  setDatabaseState
} = require("./services/runtimeStateService");
const {
  ensureDatabaseBootstrap,
  DATABASE_RETRY_DELAY_MS
} = require("./services/databaseBootstrapService");
const { resolveUploadsRoot } = require("./services/storagePathService");
const { createUploadsFallbackMiddleware } = require("./middleware/uploadsFallbackMiddleware");
const {
  getDatabaseUnavailableMessage,
  isDatabaseUnavailableError
} = require("./utils/databaseError");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "127.0.0.1";
const isProduction = process.env.NODE_ENV === "production";
const clientRoot = path.resolve(__dirname, "../../client");
const clientDist = path.resolve(clientRoot, "dist");
const uploadsRoot = resolveUploadsRoot();
const HTTP_RETRY_DELAY_MS = 3000;

let bootstrapRetryTimer = null;
let listenRetryTimer = null;
let isBootstrapping = false;
let activeHttpServer = null;

async function createApp() {
  const app = express();
  const httpServer = http.createServer(app);
  activeHttpServer = httpServer;

  setDatabaseState({
    ready: false,
    status: "starting",
    lastError: "",
    retryDelayMs: DATABASE_RETRY_DELAY_MS
  });

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
      adminSeed: runtimeState.adminSeed
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

  app.use("/admin", hydrateAdminRequest, (request, response, next) => {
    if (request.path === "/login") {
      return next();
    }

    return requireAdminPageAuth(request, response, next);
  });

  app.use((request, response, next) => {
    if (!matchesAdminOnlyClientPath(request.path)) {
      return next();
    }

    return hydrateAdminRequest(request, response, (error) => {
      if (error) {
        return next(error);
      }

      return requireAdminPageAuth(request, response, next);
    });
  });

  app.use((error, request, response, next) => {
    if (!request.path.startsWith("/api")) {
      return next(error);
    }

    if (isDatabaseUnavailableError(error)) {
      return response.status(503).json({
        message: getDatabaseUnavailableMessage()
      });
    }

    console.error("API request failed.", error);
    response.status(500).json({
      message: error.message || "Erreur serveur interne."
    });
  });

  if (isProduction) {
    app.use(express.static(clientDist));

    app.use("*", (request, response) => {
      response.sendFile(path.resolve(clientDist, "index.html"));
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: clientRoot,
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      }
    });

    app.use(vite.middlewares);

    app.use("*", async (request, response, next) => {
      try {
        const url = request.originalUrl;
        let template = await fs.readFile(
          path.resolve(clientRoot, "index.html"),
          "utf8"
        );

        template = await vite.transformIndexHtml(url, template);
        response
          .status(200)
          .set({ "Content-Type": "text/html" })
          .end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        next(error);
      }
    });
  }

  httpServer.on("error", (error) => {
    console.error(
      `HTTP server listen failed. Retrying in ${HTTP_RETRY_DELAY_MS / 1000}s.`,
      error
    );
    scheduleHttpListenRetry(httpServer);
  });

  startHttpServer(httpServer);
}

function startHttpServer(httpServer) {
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
    bootstrapDatabaseInBackground();
  });
}

function scheduleHttpListenRetry(httpServer) {
  if (listenRetryTimer) {
    return;
  }

  listenRetryTimer = setTimeout(() => {
    listenRetryTimer = null;
    startHttpServer(httpServer);
  }, HTTP_RETRY_DELAY_MS);
}

function scheduleDatabaseRetry() {
  if (bootstrapRetryTimer) {
    return;
  }

  bootstrapRetryTimer = setTimeout(() => {
    bootstrapRetryTimer = null;
    bootstrapDatabaseInBackground();
  }, DATABASE_RETRY_DELAY_MS);
}

async function bootstrapDatabaseInBackground() {
  if (isBootstrapping) {
    return;
  }

  isBootstrapping = true;

  try {
    await ensureDatabaseBootstrap();
    console.log("Database bootstrap ready.");
  } catch (error) {
    console.error(
      `Database bootstrap failed. Retrying in ${DATABASE_RETRY_DELAY_MS / 1000}s.`,
      error
    );

    scheduleDatabaseRetry();
  } finally {
    isBootstrapping = false;
  }
}

async function shutdown() {
  try {
    if (bootstrapRetryTimer) {
      clearTimeout(bootstrapRetryTimer);
      bootstrapRetryTimer = null;
    }
    if (listenRetryTimer) {
      clearTimeout(listenRetryTimer);
      listenRetryTimer = null;
    }
    stopReservationLicenseCleanupScheduler();
    if (activeHttpServer && activeHttpServer.listening) {
      await new Promise((resolve) => activeHttpServer.close(resolve));
    }
    await closePool();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

createApp().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
