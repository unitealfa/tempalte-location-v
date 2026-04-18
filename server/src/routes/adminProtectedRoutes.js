const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  getAdminDashboardStats,
  getAdminDashboardLiveRequestRanges
} = require("../services/adminDashboardService");
const {
  getVisualSettings,
  updateVisualSettings,
  getCurrentSiteContent
} = require("../services/contentService");
const {
  handleBrandingImageUpload,
  saveBrandingImage,
  removeStoredBrandingImage
} = require("../middleware/brandingUploadMiddleware");
const {
  getOrSetResponseCache,
  clearResponseCacheByPrefixes
} = require("../services/responseCacheService");
const { isDatabaseUnavailableError } = require("../utils/databaseError");

const router = express.Router();

function createEmptyRequestRangeSummary() {
  return {
    totalRequests: 0,
    totalClients: 0
  };
}

function createEmptyDashboardStats(filters = {}) {
  const today = new Date();
  const view = ["month", "year", "all"].includes(String(filters.view || ""))
    ? String(filters.view)
    : "month";
  const year = Number(filters.year) || today.getFullYear();
  const month = Number(filters.month) || today.getMonth() + 1;

  return {
    filters: {
      view,
      year,
      month,
      availableYears: [year]
    },
    summary: {
      pendingCount: 0,
      acceptedCount: 0,
      visibleThisMonthCount: 0,
      totalRevenue: 0,
      totalRequests: 0,
      totalClients: 0,
      vehicleCount: 0,
      requestRanges: {
        day: createEmptyRequestRangeSummary(),
        week: createEmptyRequestRangeSummary(),
        month: createEmptyRequestRangeSummary()
      }
    },
    insights: {
      topVehicle: {
        label: "-",
        helper: "Aucune donnee synchronisee."
      },
      busiestMonth: {
        label: "-",
        helper: "Aucune donnee synchronisee."
      },
      busiestWeekday: {
        label: "-",
        helper: "Aucune donnee synchronisee."
      }
    },
    charts: {
      requestSeries: [],
      topVehicles: [],
      reservationsByWeekday: [],
      periodDistribution: [],
      fleetStatus: []
    }
  };
}

function createEmptyLiveRequestRanges() {
  return {
    day: createEmptyRequestRangeSummary(),
    week: createEmptyRequestRangeSummary(),
    month: createEmptyRequestRangeSummary()
  };
}

router.use(requireAdminApiAuth);

router.get("/me", (request, response) => {
  response.json({
    admin: request.admin
  });
});

router.get("/visual-settings", async (request, response) => {
  response.json({
    admin: request.admin,
    settings: await getVisualSettings()
  });
});

router.post("/visual-settings/upload", handleBrandingImageUpload, async (request, response, next) => {
  try {
    const slot = String(request.body?.slot || "branding").trim();
    const nextUrl = await saveBrandingImage(request.file, slot);

    response.json({
      admin: request.admin,
      url: nextUrl,
      content: await getCurrentSiteContent()
    });
  } catch (error) {
    next(error);
  }
});

router.put("/visual-settings", async (request, response, next) => {
  try {
    const previousContent = await getCurrentSiteContent();
    const payload = await updateVisualSettings(request.body || {});
    clearResponseCacheByPrefixes(["content:"]);

    const previousBrandingUrls = [
      previousContent.brand?.faviconImagePath,
      previousContent.brand?.logoImagePath,
      previousContent.footer?.logoImagePath
    ].filter(Boolean);

    const nextBrandingUrls = new Set(
      [
        payload.content.brand?.faviconImagePath,
        payload.content.brand?.logoImagePath,
        payload.content.footer?.logoImagePath
      ].filter(Boolean)
    );

    Promise.all(
      previousBrandingUrls
        .filter((url) => !nextBrandingUrls.has(url))
        .map((url) => removeStoredBrandingImage(url))
    ).catch(() => {});

    response.json({
      admin: request.admin,
      settings: payload.visualSettings,
      content: payload.content,
      revision: payload.revision
    });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (request, response, next) => {
  try {
    const queryKey = new URLSearchParams(request.query || {}).toString();
    const cacheKey = `dashboard:${request.admin?.id || "admin"}:${queryKey}`;
    const stats = await getOrSetResponseCache(cacheKey, 1000 * 20, async () => getAdminDashboardStats(request.query || {}));

    response.set("Cache-Control", "private, max-age=15, stale-while-revalidate=60");
    response.json({
      admin: request.admin,
      stats
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    if (isDatabaseUnavailableError(error)) {
      return response.json({
        admin: request.admin,
        stats: createEmptyDashboardStats(request.query || {})
      });
    }

    if (error?.code === "ER_CON_COUNT_ERROR") {
      return response.status(503).json({
        message: "Le dashboard se resynchronise. Reessayez dans quelques secondes."
      });
    }

    next(error);
  }
});

router.get("/dashboard/live-requests", async (request, response, next) => {
  try {
    const cacheKey = `dashboard-live-requests:${request.admin?.id || "admin"}`;
    const requestRanges = await getOrSetResponseCache(cacheKey, 1000 * 5, async () =>
      getAdminDashboardLiveRequestRanges()
    );

    response.set("Cache-Control", "private, max-age=3, stale-while-revalidate=10");
    response.json({
      admin: request.admin,
      requestRanges
    });
  } catch (error) {
    console.error("Dashboard live request error:", error);
    if (isDatabaseUnavailableError(error)) {
      return response.json({
        admin: request.admin,
        requestRanges: createEmptyLiveRequestRanges()
      });
    }

    if (error?.code === "ER_CON_COUNT_ERROR") {
      return response.status(503).json({
        message: "Les statistiques des demandes se resynchronisent. Reessayez dans quelques secondes."
      });
    }

    next(error);
  }
});

module.exports = router;
