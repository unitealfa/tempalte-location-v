import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Aceulle from "./pages/Aceulle";
import AdminLogin from "./pages/AdminLogin";
import AdminAceulle from "./pages/AdminAceulle";
import AdminProfile from "./pages/AdminProfile";
import AdminVisualPage from "./pages/AdminVisualPage";
import PublicPage from "./pages/PublicPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import LocationVehiclesPage from "./pages/LocationVehiclesPage";
import ComparePage from "./pages/ComparePage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import AdminVehicleFormPage from "./pages/AdminVehicleFormPage";
import CommencerReservationsPage from "./pages/CommencerReservationsPage";
import ReservationDetailPage from "./pages/ReservationDetailPage";
import ClientsCalendarPage from "./pages/ClientsCalendarPage";
import AdminReservationFormPage from "./pages/AdminReservationFormPage";
import {
  getCachedHomePageContentStatus,
  getAdminVisualSettings,
  getCachedHomePageContent,
  getHomePageContent,
  getHomePageContentStatus
} from "./services/contentService";
import {
  getVehicleById,
  listVehicles
} from "./services/vehicleService";
import {
  getAdminDashboardStats,
  getCachedAdminDashboardStats
} from "./services/adminDashboardService";
import {
  getAdminReservationById,
  getCachedAdminReservationById,
  getCachedAdminReservations,
  getCachedVehicleReservationAvailability,
  getVehicleReservationAvailability,
  listAdminReservations,
  preloadAdminReservationCaches
} from "./services/reservationService";
import {
  getAdminSession,
  logoutAdmin
} from "./services/adminAuthService";
import { getAdminUnauthorizedEventName } from "./services/adminSessionGuard";
import { clearLegacyAdminClientState } from "./services/clientSecurityService";
import {
  getStoredCompareVehicleIds,
  persistCompareVehicleIds,
  toggleCompareVehicleId
} from "./services/compareService";

function normalizePath(path) {
  if (path === "/Accueil" || path === "/accueil" || path === "/aceulle") {
    return "/";
  }

  if (path === "/clients") {
    return "/reservations";
  }

  if (path === "/clients/reservations/creer") {
    return "/reservations/creer";
  }

  const clientReservationEditMatch = path.match(/^\/clients\/reservations\/(\d+)\/modifier$/);

  if (clientReservationEditMatch) {
    return `/reservations/${clientReservationEditMatch[1]}/modifier`;
  }

  const clientReservationDetailMatch = path.match(/^\/clients\/reservations\/(\d+)$/);

  if (clientReservationDetailMatch) {
    return `/reservations/${clientReservationDetailMatch[1]}`;
  }

  return path;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

const ADMIN_REDIRECT_STORAGE_KEY = "admin:redirect-after-login";

function storeAdminRedirectPath(path) {
  try {
    window.sessionStorage.setItem(ADMIN_REDIRECT_STORAGE_KEY, path);
  } catch (error) {
  }
}

function readAdminRedirectPath() {
  try {
    return window.sessionStorage.getItem(ADMIN_REDIRECT_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function clearAdminRedirectPath() {
  try {
    window.sessionStorage.removeItem(ADMIN_REDIRECT_STORAGE_KEY);
  } catch (error) {
  }
}

function isAdminOnlyPath(path) {
  return (
    path === "/admin/profile" ||
    path === "/admin/visuelle" ||
    path === "/reservations" ||
    path === "/reservations/creer" ||
    path === "/location-de-voitures/creer" ||
    /^\/location-de-voitures\/\d+\/reserver$/.test(path) ||
    /^\/location-de-voitures\/\d+\/modifier$/.test(path) ||
    /^\/commencer\/reservations\/\d+$/.test(path) ||
    /^\/reservations\/\d+$/.test(path) ||
    /^\/commencer\/reservations\/\d+\/modifier$/.test(path) ||
    /^\/reservations\/\d+\/modifier$/.test(path)
  );
}

function getVehicleDetailId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getVehicleEditId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)\/modifier$/);
  return match ? Number(match[1]) : null;
}

function getVehicleReserveId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)\/reserver$/);
  return match ? Number(match[1]) : null;
}

function getReservationDetailId(path) {
  let match = path.match(/^\/commencer\/reservations\/(\d+)$/);

  if (match) {
    return Number(match[1]);
  }

  match = path.match(/^\/reservations\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getReservationDetailScope(path) {
  if (/^\/commencer\/reservations\/\d+$/.test(path)) {
    return "commencer";
  }

  if (/^\/reservations\/\d+$/.test(path)) {
    return "reservations";
  }

  return null;
}

function getReservationEditId(path) {
  let match = path.match(/^\/commencer\/reservations\/(\d+)\/modifier$/);

  if (match) {
    return Number(match[1]);
  }

  match = path.match(/^\/reservations\/(\d+)\/modifier$/);
  return match ? Number(match[1]) : null;
}

function getReservationEditScope(path) {
  if (/^\/commencer\/reservations\/\d+\/modifier$/.test(path)) {
    return "commencer";
  }

  if (/^\/reservations\/\d+\/modifier$/.test(path)) {
    return "reservations";
  }

  return null;
}

function isReservationDetailPath(path) {
  return /^\/commencer\/reservations\/\d+$/.test(path) || /^\/reservations\/\d+$/.test(path);
}

function isReservationEditPath(path) {
  return /^\/commencer\/reservations\/\d+\/modifier$/.test(path) || /^\/reservations\/\d+\/modifier$/.test(path);
}

function getReservationListPath(path) {
  const scope = getReservationDetailScope(path);
  return scope === "reservations" ? "/reservations" : "/commencer";
}

function getReservationDetailDestination(scopePath, reservationId) {
  if (scopePath === "/reservations") {
    return `/reservations/${reservationId}`;
  }

  return `/commencer/reservations/${reservationId}`;
}

function BootLoader({ progress, isExiting }) {
  const paddedProgress = String(Math.max(0, Math.min(100, Math.round(progress)))).padStart(2, "0");

  return (
    <div className={"boot-loader" + (isExiting ? " boot-loader--exit" : "") } aria-hidden="true">
      <div className="boot-loader__simple">
        <strong className="boot-loader__counter">{paddedProgress}</strong>
      </div>
    </div>
  );
}

function getBootTargetProgress({
  hasContent,
  isAuthResolved,
  isRouteDataReady,
  hasWindowLoaded
}) {
  let value = 8;

  if (hasContent) {
    value += 36;
  }

  if (isAuthResolved) {
    value += 18;
  }

  if (isRouteDataReady) {
    value += 27;
  }

  if (hasWindowLoaded) {
    value += 10;
  }

  return Math.min(99, value);
}

function buildBootPreloadTasks({ currentPath, currentAdmin }) {
  const tasks = [];
  const taskKeys = new Set();
  const vehicleDetailId = getVehicleDetailId(currentPath);
  const vehicleEditId = getVehicleEditId(currentPath);
  const vehicleReserveId = getVehicleReserveId(currentPath);
  const reservationDetailId = getReservationDetailId(currentPath);
  const reservationEditId = getReservationEditId(currentPath);
  const isAdmin = Boolean(currentAdmin);
  const today = new Date();

  const pushTask = (key, taskFactory) => {
    if (taskKeys.has(key)) {
      return;
    }

    taskKeys.add(key);
    tasks.push(Promise.resolve().then(taskFactory).catch(() => null));
  };

  if (currentPath === "/" || currentPath === "/compare") {
    pushTask("vehicles:public:list", () => listVehicles());
  }

  if (currentPath === "/location-de-voitures") {
    pushTask(`vehicles:${isAdmin ? "admin" : "public"}:list`, () =>
      listVehicles({ adminView: isAdmin })
    );
  }

  if (vehicleDetailId) {
    pushTask(`vehicles:${isAdmin ? "admin" : "public"}:list`, () =>
      listVehicles({ adminView: isAdmin })
    );
    pushTask(`vehicle:${isAdmin ? "admin" : "public"}:${vehicleDetailId}`, () =>
      getVehicleById(vehicleDetailId, { adminView: isAdmin })
    );
    pushTask(`vehicle:availability:${vehicleDetailId}`, () =>
      getVehicleReservationAvailability(vehicleDetailId)
    );
  }

  if (isAdmin) {
    pushTask("admin:dashboard:default", () =>
      getAdminDashboardStats({
        view: "month",
        year: today.getFullYear(),
        month: today.getMonth() + 1
      })
    );
    pushTask("admin:reservations:pending", () => listAdminReservations({ scope: "pending" }));
    pushTask("admin:reservations:accepted", () => listAdminReservations({ scope: "accepted" }));
  }

  if (currentPath === "/admin/visuelle" && isAdmin) {
    pushTask("admin:visual-settings", () => getAdminVisualSettings());
    pushTask("vehicles:admin:list", () => listVehicles({ adminView: true }));
  }

  if (vehicleEditId && isAdmin) {
    pushTask(`vehicle:admin:${vehicleEditId}`, () =>
      getVehicleById(vehicleEditId, { adminView: true })
    );
  }

  if (vehicleReserveId && isAdmin) {
    pushTask("vehicles:admin:list", () => listVehicles({ adminView: true }));
    pushTask(`vehicle:admin:${vehicleReserveId}`, () =>
      getVehicleById(vehicleReserveId, { adminView: true })
    );
    pushTask("admin:reservations:accepted", () => listAdminReservations({ scope: "accepted" }));
  }

  if (currentPath === "/reservations/creer" && isAdmin) {
    pushTask("vehicles:admin:list", () => listVehicles({ adminView: true }));
    pushTask("admin:reservations:accepted", () => listAdminReservations({ scope: "accepted" }));
  }

  if (reservationDetailId && isAdmin) {
    pushTask(`admin:reservation:${reservationDetailId}`, () =>
      getAdminReservationById(reservationDetailId)
    );
  }

  if (reservationEditId && isAdmin) {
    pushTask("vehicles:admin:list", () => listVehicles({ adminView: true }));
    pushTask("admin:reservations:accepted", () => listAdminReservations({ scope: "accepted" }));
    pushTask(`admin:reservation:${reservationEditId}`, () =>
      getAdminReservationById(reservationEditId)
    );
  }

  return tasks;
}

function App() {
  const [content, setContent] = useState(() => getCachedHomePageContent());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isContentLoading, setIsContentLoading] = useState(
    () => !getCachedHomePageContent()
  );
  const [contentRevision, setContentRevision] = useState(
    () => String(getCachedHomePageContentStatus()?.revision || "0")
  );
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [compareVehicleIds, setCompareVehicleIds] = useState(getStoredCompareVehicleIds);
  const [bootProgress, setBootProgress] = useState(0);
  const [isBootVisible, setIsBootVisible] = useState(true);
  const [isBootExiting, setIsBootExiting] = useState(false);
  const [isBootDataReady, setIsBootDataReady] = useState(false);
  const [hasWindowLoaded, setHasWindowLoaded] = useState(() => document.readyState === "complete");

  useEffect(() => {
    let isActive = true;

    const loadContent = async () => {
      setIsContentLoading((currentValue) => (content ? false : currentValue));

      try {
        const [response, status] = await Promise.all([
          getHomePageContent(),
          getHomePageContentStatus().catch(() => null)
        ]);

        if (!isActive) {
          return;
        }

        setContent(response);
        if (status?.revision) {
          setContentRevision(String(status.revision));
        }
        setErrorMessage("");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (!content) {
          setErrorMessage("Le contenu n'a pas pu etre charge depuis le serveur.");
        }
      } finally {
        if (isActive) {
          setIsContentLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!content) {
      return undefined;
    }

    let isActive = true;

    const refreshContentIfChanged = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const status = await getHomePageContentStatus();
        const nextRevision = String(status?.revision || "0");

        if (!isActive) {
          return;
        }

        if (nextRevision === contentRevision) {
          return;
        }

        const nextContent = await getHomePageContent({ forceFresh: true });

        if (!isActive) {
          return;
        }

        setContent(nextContent);
        setContentRevision(nextRevision);
      } catch (error) {
      }
    };

    const intervalId = window.setInterval(refreshContentIfChanged, 2500);
    window.addEventListener("focus", refreshContentIfChanged);
    document.addEventListener("visibilitychange", refreshContentIfChanged);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshContentIfChanged);
      document.removeEventListener("visibilitychange", refreshContentIfChanged);
    };
  }, [content, contentRevision]);

  useEffect(() => {
    if (!isBootVisible || hasWindowLoaded) {
      return undefined;
    }

    const handleWindowLoad = () => {
      setHasWindowLoaded(true);
    };

    window.addEventListener("load", handleWindowLoad, { once: true });

    return () => {
      window.removeEventListener("load", handleWindowLoad);
    };
  }, [hasWindowLoaded, isBootVisible]);

  useEffect(() => {
    if (!isBootVisible || !content || isAuthLoading) {
      return undefined;
    }

    let isActive = true;

    const preloadSiteData = async () => {
      const preloadTasks = buildBootPreloadTasks({
        currentPath,
        currentAdmin
      });

      if (preloadTasks.length === 0) {
        if (isActive) {
          setIsBootDataReady(true);
        }
        return;
      }

      await Promise.allSettled(preloadTasks);

      if (isActive) {
        setIsBootDataReady(true);
      }
    };

    setIsBootDataReady(false);
    preloadSiteData();

    return () => {
      isActive = false;
    };
  }, [content, currentAdmin, currentPath, isAuthLoading, isBootVisible]);

  const isBootReadyToReveal =
    Boolean(content) && !isAuthLoading && isBootDataReady && hasWindowLoaded;

  useEffect(() => {
    if (!isBootVisible) {
      return undefined;
    }

    if (isBootReadyToReveal) {
      setBootProgress(100);
      return undefined;
    }

    let timerId = 0;

    const tick = () => {
      setBootProgress((currentValue) => {
        const targetValue = getBootTargetProgress({
          hasContent: Boolean(content),
          isAuthResolved: !isAuthLoading,
          isRouteDataReady: isBootDataReady,
          hasWindowLoaded
        });

        if (targetValue <= currentValue) {
          return currentValue;
        }

        const nextValue = currentValue + Math.max(1, Math.ceil((targetValue - currentValue) * 0.12));
        return nextValue >= targetValue ? targetValue : nextValue;
      });

      timerId = window.setTimeout(tick, 32);
    };

    timerId = window.setTimeout(tick, 120);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [content, hasWindowLoaded, isAuthLoading, isBootDataReady, isBootReadyToReveal, isBootVisible]);

  useEffect(() => {
    if (!isBootVisible || isBootExiting || !isBootReadyToReveal || bootProgress < 100) {
      return undefined;
    }

    const exitTimerId = window.setTimeout(() => {
      setIsBootExiting(true);
    }, 120);
    const hideTimerId = window.setTimeout(() => {
      setIsBootVisible(false);
    }, 1120);

    return () => {
      window.clearTimeout(exitTimerId);
      window.clearTimeout(hideTimerId);
    };
  }, [bootProgress, isBootExiting, isBootReadyToReveal, isBootVisible]);

  useEffect(() => {
    const faviconHref = content?.brand?.faviconImagePath || content?.brand?.logoImagePath;
    const browserTitle = content?.brand?.browserTitle || content?.brand?.name || "Lea Location";

    document.title = browserTitle;

    if (!faviconHref) {
      return;
    }

    let favicon = document.querySelector("link[rel='icon']");

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      document.head.appendChild(favicon);
    }

    favicon.setAttribute("href", faviconHref);
    favicon.setAttribute("type", "image/jpeg");
  }, [content?.brand?.browserTitle, content?.brand?.name, content?.brand?.faviconImagePath, content?.brand?.logoImagePath]);

  useEffect(() => {
    const loadAdminSession = async () => {
      try {
        clearLegacyAdminClientState();
        const admin = await getAdminSession();
        setCurrentAdmin(admin);
      } catch (error) {
        setCurrentAdmin(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAdminSession();
  }, []);

  useEffect(() => {
    const handleAdminUnauthorized = () => {
      clearLegacyAdminClientState();
      setCurrentAdmin(null);
      setIsAuthLoading(false);
    };

    const eventName = getAdminUnauthorizedEventName();
    window.addEventListener(eventName, handleAdminUnauthorized);

    return () => {
      window.removeEventListener(eventName, handleAdminUnauthorized);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCurrentPath());
      setIsMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const normalizedPath = normalizePath(window.location.pathname);

    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, "", normalizedPath);
      setCurrentPath(normalizedPath);
    }
  }, []);

  const navigateTo = (path) => {
    const normalizedPath = normalizePath(path);
    const currentBrowserPath = normalizePath(window.location.pathname);

    if (currentBrowserPath === normalizedPath) {
      setIsMenuOpen(false);
      return;
    }

    window.history.pushState({}, "", normalizedPath);
    window.scrollTo(0, 0);
    setCurrentPath(normalizedPath);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (
      (currentPath.startsWith("/admin") && currentPath !== "/admin/login") ||
      isAdminOnlyPath(currentPath)
    ) {
      if (currentAdmin) {
        return;
      }

      storeAdminRedirectPath(currentPath);
      window.history.replaceState({}, "", "/admin/login");
      setCurrentPath("/admin/login");
    }
  }, [currentAdmin, currentPath, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (currentPath === "/admin/login" && currentAdmin) {
      const redirectPath = normalizePath(readAdminRedirectPath() || "/admin");
      clearAdminRedirectPath();
      window.history.replaceState({}, "", redirectPath);
      setCurrentPath(redirectPath);
    }
  }, [currentAdmin, currentPath, isAuthLoading]);

  const handleAdminLoginSuccess = async (admin) => {
    setCurrentAdmin(admin);

    const today = new Date();
    await Promise.allSettled([
      preloadAdminReservationCaches(),
      getAdminDashboardStats({
        view: "month",
        year: today.getFullYear(),
        month: today.getMonth() + 1
      }),
      listVehicles()
    ]);

    const redirectPath = normalizePath(readAdminRedirectPath() || "/admin");
    clearAdminRedirectPath();
    window.history.pushState({}, "", redirectPath);
    window.scrollTo(0, 0);
    setCurrentPath(redirectPath);
    setIsMenuOpen(false);
  };

  const handleAdminUpdated = (admin) => {
    setCurrentAdmin(admin);
  };

  const handleContentSaved = (nextContent, nextRevision) => {
    if (!nextContent) {
      return;
    }

    setContent(JSON.parse(JSON.stringify(nextContent)));

    if (nextRevision) {
      setContentRevision(String(nextRevision));
    }
  };

  const persistCompareIds = (nextVehicleIds) => {
    const persistedVehicleIds = persistCompareVehicleIds(nextVehicleIds);
    setCompareVehicleIds(persistedVehicleIds);
    return persistedVehicleIds;
  };

  const handleCompareToggle = (vehicleId) => {
    setCompareVehicleIds((currentValue) => {
      const nextValue = toggleCompareVehicleId(currentValue, vehicleId);
      return persistCompareVehicleIds(nextValue);
    });
  };

  const handleCompareRemove = (vehicleId) => {
    setCompareVehicleIds((currentValue) => {
      const nextValue = currentValue.filter((entry) => entry !== vehicleId);
      return persistCompareVehicleIds(nextValue);
    });
  };

  const handleCompareClear = () => {
    persistCompareIds([]);
  };

  const vehicleDetailId = getVehicleDetailId(currentPath);
  const vehicleEditId = getVehicleEditId(currentPath);
  const vehicleReserveId = getVehicleReserveId(currentPath);
  const reservationDetailId = getReservationDetailId(currentPath);
  const reservationDetailScope = getReservationDetailScope(currentPath);
  const reservationEditId = getReservationEditId(currentPath);
  const reservationEditScope = getReservationEditScope(currentPath);
  const isHomePage = currentPath === "/";

  const handleAdminLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
    } finally {
      clearLegacyAdminClientState();
      setCurrentAdmin(null);
      setIsMenuOpen(false);
      window.history.replaceState({}, "", "/");
      window.location.replace("/");
    }
  };

  const isProtectedPath =
    ((currentPath.startsWith("/admin") && currentPath !== "/admin/login") ||
      isAdminOnlyPath(currentPath));

  const shouldRenderApp = Boolean(content) && (!isProtectedPath || !isAuthLoading || Boolean(currentAdmin));
  const shouldRenderBootedApp = shouldRenderApp && (!isBootVisible || isBootExiting);

  return (
    <>
      {isBootVisible ? <BootLoader progress={bootProgress} isExiting={isBootExiting} /> : null}
      {errorMessage && !content ? (
        <main className="page-shell page-shell--centered">
          <p className="status-message">{errorMessage}</p>
        </main>
      ) : shouldRenderBootedApp ? (
        <div className={isHomePage ? "page-shell home" : "page-shell"}>
      <Header
        brand={content.brand}
        header={content.header}
        footerContent={content.footer}
        currentAdmin={currentAdmin}
        currentPath={currentPath}
        isProfilePage={currentPath === "/admin/profile"}
        isMenuOpen={isMenuOpen}
        isHomePage={isHomePage}
        onMenuClose={() => setIsMenuOpen(false)}
        onMenuToggle={() => setIsMenuOpen((currentValue) => !currentValue)}
        onNavigate={navigateTo}
        onLoginClick={() => navigateTo("/admin/login")}
        onLogoutClick={handleAdminLogout}
        onProfileClick={() => navigateTo("/admin/profile")}
        onClientsClick={() => navigateTo("/reservations")}
      />
      {currentPath === "/admin/login" ? (
        <AdminLogin
          content={content.adminLogin}
          onBackClick={() => navigateTo("/")}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      ) : currentPath === "/admin/profile" && currentAdmin ? (
        <AdminProfile
          content={content.adminProfile}
          admin={currentAdmin}
          onAdminUpdated={handleAdminUpdated}
          onBackClick={() => navigateTo("/admin")}
        />
      ) : currentPath === "/admin/visuelle" && currentAdmin ? (
        <AdminVisualPage
          content={content}
          brand={content.brand}
          header={content.header}
          footer={content.footer}
          onContentSaved={handleContentSaved}
        />
      ) : currentPath === "/reservations/creer" && currentAdmin ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="create"
          onBackClick={() => navigateTo("/reservations")}
          onSaved={(reservation) =>
            navigateTo(`/reservations/${reservation.id}`)
          }
        />
      ) : reservationEditId && currentAdmin && isReservationEditPath(currentPath) ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="edit"
          reservationId={reservationEditId}
          onBackClick={() =>
            navigateTo(
              reservationEditScope === "reservations"
                ? `/reservations/${reservationEditId}`
                : `/commencer/reservations/${reservationEditId}`
            )
          }
          onSaved={(reservation) =>
            navigateTo(
              reservation.status === "accepted"
                ? `/reservations/${reservation.id}`
                : `/commencer/reservations/${reservation.id}`
            )
          }
        />
      ) : reservationDetailId && currentAdmin && isReservationDetailPath(currentPath) ? (
        <ReservationDetailPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          reservationId={reservationDetailId}
          detailScope={reservationDetailScope}
          onAccepted={() => navigateTo("/reservations")}
          onRejected={() => navigateTo("/reservations")}
          onEditClick={() =>
            navigateTo(
              reservationDetailScope === "reservations"
                ? `/reservations/${reservationDetailId}/modifier`
                : `/commencer/reservations/${reservationDetailId}/modifier`
            )
          }
          onDeleted={() =>
            navigateTo(reservationDetailScope === "reservations" ? "/reservations" : "/commencer")
          }
          onBackClick={() => navigateTo(getReservationListPath(currentPath))}
        />
      ) : currentPath === "/commencer" && currentAdmin ? (
        <CommencerReservationsPage
          content={content.reservations}
          onReservationClick={(reservationId) =>
            navigateTo(getReservationDetailDestination("/commencer", reservationId))
          }
        />
      ) : currentPath === "/reservations" && currentAdmin ? (
        <ClientsCalendarPage
          content={content.reservations}
          onCreateClick={() => navigateTo("/reservations/creer")}
          onReservationClick={(reservationId) =>
            navigateTo(getReservationDetailDestination("/reservations", reservationId))
          }
        />
      ) : currentPath === "/commencer" ? (
        <PublicPage title={content.publicPages.commencer.title} />
      ) : currentPath === "/location-de-voitures/creer" && currentAdmin ? (
        <AdminVehicleFormPage
          content={content.vehicles}
          mode="create"
          onBackClick={() => navigateTo("/location-de-voitures")}
          onSaved={() => navigateTo("/location-de-voitures")}
        />
      ) : vehicleReserveId && currentAdmin ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="create"
          initialVehicleId={vehicleReserveId}
          onBackClick={() => navigateTo(`/location-de-voitures/${vehicleReserveId}`)}
          onSaved={(reservation) => navigateTo(`/reservations/${reservation.id}`)}
        />
      ) : vehicleEditId && currentAdmin ? (
        <AdminVehicleFormPage
          content={content.vehicles}
          mode="edit"
          vehicleId={vehicleEditId}
          onBackClick={() => navigateTo(`/location-de-voitures/${vehicleEditId}`)}
          onSaved={(vehicle) => navigateTo(`/location-de-voitures/${vehicle.id}`)}
        />
      ) : vehicleDetailId ? (
        <VehicleDetailPage
          content={content.vehicles}
          footerContent={content.footer}
          currentAdmin={currentAdmin}
          vehicleId={vehicleDetailId}
          onBackClick={() => navigateTo("/location-de-voitures")}
          onDeleted={() => navigateTo("/location-de-voitures")}
          onEditClick={() => navigateTo(`/location-de-voitures/${vehicleDetailId}/modifier`)}
          onReserveClick={() => navigateTo(`/location-de-voitures/${vehicleDetailId}/reserver`)}
          onVehicleClick={(nextVehicleId) => navigateTo(`/location-de-voitures/${nextVehicleId}`)}
        />
      ) : currentPath === "/location-de-voitures" ? (
        <LocationVehiclesPage
          content={content.vehicles}
          currentAdmin={currentAdmin}
          compareVehicleIds={compareVehicleIds}
          onCompareToggle={handleCompareToggle}
          onCompareRemove={handleCompareRemove}
          onCompareClear={handleCompareClear}
          onComparePageOpen={() => navigateTo("/compare")}
          onCreateClick={() => navigateTo("/location-de-voitures/creer")}
          onVehicleClick={(vehicleId) => navigateTo(`/location-de-voitures/${vehicleId}`)}
        />
      ) : currentPath === "/compare" ? (
        <ComparePage
          content={content.vehicles}
          compareVehicleIds={compareVehicleIds}
          onBackClick={() => navigateTo("/location-de-voitures")}
          onRemove={handleCompareRemove}
          onVehicleOpen={(vehicleId) => navigateTo(`/location-de-voitures/${vehicleId}`)}
        />
      ) : currentPath === "/contact" ? (
        <ContactPage
          content={content.contactPage}
          footerContent={content.footer}
          brand={content.brand}
        />
      ) : currentPath === "/foire-aux-questions" ? (
        <FaqPage
          content={content.faqPage}
          onContactClick={() => navigateTo("/contact")}
        />
      ) : currentPath === "/admin" && currentAdmin ? (
        <AdminAceulle
          content={content.adminAceulle}
          admin={currentAdmin}
          onNavigate={navigateTo}
        />
      ) : (
        <Aceulle content={content.aceulle} onNavigate={navigateTo} />
      )}
      <Footer
        brand={content.brand}
        content={content.footer}
        header={content.header}
        onNavigate={navigateTo}
      />
        </div>
      ) : (
        <main className="page-shell page-shell--centered page-shell--preload" />
      )}
    </>
  );
}

export default App;
