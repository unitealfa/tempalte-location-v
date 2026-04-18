import { useEffect, useMemo, useState } from "react";
import {
  getAdminDashboardStats,
  getCachedAdminDashboardLiveRequests,
  getCachedAdminDashboardStats,
  getAdminDashboardLiveRequests
} from "../services/adminDashboardService";
import { handleImageFallback } from "../utils/imageFallback";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0
});
const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Fevrier" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Aout" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Decembre" }
];

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function getRangeLabel(activeView, activeYear, activeMonth, content) {
  if (activeView === "month") {
    return `${MONTH_OPTIONS[activeMonth - 1]?.label || ""} ${activeYear}`.trim();
  }

  if (activeView === "year") {
    return String(activeYear);
  }

  return content.filterViewAllLabel;
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      className={"admin-dashboard-v2__pill" + (active ? " is-active" : "")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function MiniFilter({ labels, value, onChange }) {
  return (
    <div className="admin-dashboard-v2__mini-filter">
      {labels.map((item) => (
        <button
          key={item.value}
          type="button"
          className={"admin-dashboard-v2__mini-pill" + (value === item.value ? " is-active" : "")}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TopStatCard({
  label,
  value,
  iconClassName = "far fa-chart-bar",
  accent = "dark",
  onClick
}) {
  return (
    <button
      type="button"
      className={`admin-dashboard-v2__top-card admin-dashboard-v2__top-card--${accent}${onClick ? " is-clickable" : ""}`}
      onClick={onClick}
    >
      <span className="admin-dashboard-v2__top-label">{label}</span>
      <div className="admin-dashboard-v2__top-row">
        <strong>{formatNumber(value)}</strong>
        <i className={iconClassName} aria-hidden="true"></i>
      </div>
    </button>
  );
}

function OverviewChart({ items }) {
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, Number(item.value || 0)), 0);

  return (
    <div className="admin-dashboard-v2__overview-chart">
      {items.map((item) => {
        const ratio = maxValue > 0 ? Number(item.value || 0) / maxValue : 0;
        return (
          <div key={item.label} className="admin-dashboard-v2__overview-column">
            <div
              className="admin-dashboard-v2__overview-bar"
              style={{ height: `${Math.max(10, ratio * 100)}%` }}
            >
              <span>{formatNumber(item.value)}</span>
            </div>
            <small>{item.label}</small>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ title, label, helper, iconClassName = "far fa-star" }) {
  return (
    <article className="admin-dashboard-v2__insight-card">
      <i className={iconClassName} aria-hidden="true"></i>
      <span>{title}</span>
      <strong>{label}</strong>
      <p>{helper}</p>
    </article>
  );
}

function RankedList({ title, items, formatter = formatNumber, emptyLabel }) {
  return (
    <section className="admin-dashboard-v2__list-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="admin-dashboard-v2__empty">{emptyLabel}</p>
      ) : (
        <div className="admin-dashboard-v2__list">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="admin-dashboard-v2__list-row">
              <div className="admin-dashboard-v2__list-row-left">
                {item.photoUrl ? (
                  <img
                    className="admin-dashboard-v2__list-thumb"
                    src={item.photoUrl}
                    alt={item.label}
                    onError={handleImageFallback}
                    loading="lazy"
                  />
                ) : (
                  <div className="admin-dashboard-v2__list-icon">
                    <i className="far fa-car" aria-hidden="true"></i>
                  </div>
                )}
                <span>{item.label}</span>
              </div>
              <strong>{formatter(item.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WeekdayList({ title, items, emptyLabel }) {
  return (
    <section className="admin-dashboard-v2__list-card admin-dashboard-v2__list-card--plain">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="admin-dashboard-v2__empty">{emptyLabel}</p>
      ) : (
        <div className="admin-dashboard-v2__weekday-list">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="admin-dashboard-v2__weekday-row">
              <span>{item.label}</span>
              <strong>{formatNumber(item.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FleetStatusCard({ title, items }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const available = items.find((item) => item.tone === "available")?.value || 0;
  const reserved = items.find((item) => item.tone === "reserved")?.value || 0;
  const maintenance = items.find((item) => item.tone === "maintenance")?.value || 0;
  const availableRatio = total > 0 ? (available / total) * 100 : 0;
  const reservedRatio = total > 0 ? (reserved / total) * 100 : 0;
  const ringStyle = {
    background: `conic-gradient(#ffffff 0% ${availableRatio}%, rgba(255,255,255,0.38) ${availableRatio}% ${availableRatio + reservedRatio}%, rgba(255,255,255,0.12) ${availableRatio + reservedRatio}% 100%)`
  };

  return (
    <section className="admin-dashboard-v2__status-card">
      <h3>{title}</h3>
      <div className="admin-dashboard-v2__status-ring" style={ringStyle}>
        <div className="admin-dashboard-v2__status-center">
          <strong>{formatNumber(total)}</strong>
          <span>Vehicules</span>
        </div>
      </div>
      <div className="admin-dashboard-v2__status-legend">
        <div><span className="is-available"></span><label>Disponibles</label><strong>{formatNumber(available)}</strong></div>
        <div><span className="is-reserved"></span><label>Reserves</label><strong>{formatNumber(reserved)}</strong></div>
        <div><span className="is-maintenance"></span><label>Maintenance</label><strong>{formatNumber(maintenance)}</strong></div>
      </div>
    </section>
  );
}

function FocusCard({ pendingCount, helper, onClick }) {
  return (
    <button type="button" className="admin-dashboard-v2__focus-card admin-dashboard-v2__focus-card--button" onClick={onClick}>
      <div className="admin-dashboard-v2__focus-head">
        <span>Focus immediat</span>
        <h3>Aujourd'hui</h3>
      </div>
      <div className="admin-dashboard-v2__focus-body">
        <div className="admin-dashboard-v2__focus-inline">
          <i className="far fa-bell" aria-hidden="true"></i>
          <strong>{formatNumber(pendingCount)} Demande{Number(pendingCount) > 1 ? "s" : ""} en attente</strong>
        </div>
        <p>{helper}</p>
      </div>
    </button>
  );
}

function AdminAceulle({ content, admin, onNavigate }) {
  const today = new Date();
  const defaultFilters = {
    view: "month",
    year: today.getFullYear(),
    month: today.getMonth() + 1
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [stats, setStats] = useState(() => getCachedAdminDashboardStats(defaultFilters));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !getCachedAdminDashboardStats(defaultFilters));
  const [liveRequestRanges, setLiveRequestRanges] = useState(() => getCachedAdminDashboardLiveRequests());
  const [requestRangeFilter, setRequestRangeFilter] = useState("month");

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(() => !getCachedAdminDashboardStats(filters));
      }
      setErrorMessage("");

      try {
        const nextStats = await getAdminDashboardStats(filters);

        if (!isActive) {
          return;
        }

        setStats(nextStats);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.errorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    const refreshDashboard = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void loadDashboard({ silent: true });
    };

    const intervalId = window.setInterval(refreshDashboard, 15000);
    window.addEventListener("focus", refreshDashboard);
    document.addEventListener("visibilitychange", refreshDashboard);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDashboard);
      document.removeEventListener("visibilitychange", refreshDashboard);
    };
  }, [content.errorMessage, filters]);

  useEffect(() => {
    let isActive = true;

    const refreshLiveRequests = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const nextRequestRanges = await getAdminDashboardLiveRequests();

        if (!isActive) {
          return;
        }

        setLiveRequestRanges(nextRequestRanges);
      } catch (error) {
      }
    };

    refreshLiveRequests();

    const intervalId = window.setInterval(refreshLiveRequests, 5000);
    window.addEventListener("focus", refreshLiveRequests);
    document.addEventListener("visibilitychange", refreshLiveRequests);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshLiveRequests);
      document.removeEventListener("visibilitychange", refreshLiveRequests);
    };
  }, []);

  const summary = stats?.summary || {};
  const insights = stats?.insights || {};
  const charts = stats?.charts || {};
  const availableYears = stats?.filters?.availableYears || [filters.year];
  const activeView = stats?.filters?.view || filters.view;
  const activeYear = stats?.filters?.year || filters.year;
  const activeMonth = stats?.filters?.month || filters.month;
  const effectiveRequestRanges = liveRequestRanges || summary?.requestRanges || {};
  const requestRangeSummary = effectiveRequestRanges?.[requestRangeFilter] || {
    totalRequests: summary?.totalRequests || 0,
    totalClients: summary?.totalClients || 0
  };
  const performanceTitle = `Performance ${getRangeLabel(activeView, activeYear, activeMonth, content)}`;
  const requestFilterItems = [
    { value: "day", label: content.summaryVisitsFilterDayLabel },
    { value: "week", label: content.summaryVisitsFilterWeekLabel },
    { value: "month", label: content.summaryVisitsFilterMonthLabel }
  ];
  const topVehicles = (charts.topVehicles || []).slice(0, 3);
  const weekdayItems = charts.reservationsByWeekday || [];
  const fleetItems = charts.fleetStatus || [];
  const overviewItems = useMemo(() => {
    const source = charts.requestSeries || [];

    if (activeView === "year") {
      return source;
    }

    if (source.length <= 4) {
      return source;
    }

    return source.slice(-4);
  }, [activeView, charts.requestSeries]);
  const overviewChartTitle =
    activeView === "month"
      ? "Repartition des demandes par semaine du mois"
      : activeView === "year"
        ? "Repartition des demandes par mois sur l'annee"
        : "Repartition des demandes par annee";
  const overviewChartDescription =
    activeView === "month"
      ? "Chaque colonne represente le nombre de demandes de reservation recues sur une semaine du mois selectionne."
      : activeView === "year"
        ? "Chaque colonne represente le nombre de demandes de reservation recues sur un mois de l'annee selectionnee."
        : "Chaque colonne represente le nombre de demandes de reservation recues sur une annee complete.";

  return (
    <main className="admin-dashboard-v2">
      <header className="admin-dashboard-v2__header">
        <div>
          <h1>Bienvenue, {admin.username}</h1>
          <p>{content.description}</p>
        </div>
      </header>

      <section className="admin-dashboard-v2__filters">
        <div className="admin-dashboard-v2__filters-left">
          <span>{content.filterViewLabel}</span>
          <div className="admin-dashboard-v2__pills">
            <FilterButton
              label={content.filterViewMonthLabel}
              active={activeView === "month"}
              onClick={() => setFilters((current) => ({ ...current, view: "month" }))}
            />
            <FilterButton
              label={content.filterViewYearLabel}
              active={activeView === "year"}
              onClick={() => setFilters((current) => ({ ...current, view: "year" }))}
            />
            <FilterButton
              label={content.filterViewAllLabel}
              active={activeView === "all"}
              onClick={() => setFilters((current) => ({ ...current, view: "all" }))}
            />
          </div>
        </div>

        <div className="admin-dashboard-v2__filters-right">
          {activeView === "month" ? (
            <label className="admin-dashboard-v2__select-field">
              <span>{content.filterMonthLabel}</span>
              <select
                value={activeMonth}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, month: Number(event.target.value) }))
                }
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          {activeView !== "all" ? (
            <label className="admin-dashboard-v2__select-field">
              <span>{content.filterYearLabel}</span>
              <select
                value={activeYear}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, year: Number(event.target.value) }))
                }
              >
                {availableYears.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>{yearOption}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">{content.loadingLabel}</p>
        </section>
      ) : errorMessage ? (
        <section className="vehicles-empty">
          <p className="login-form__message login-form__message--error">{errorMessage}</p>
        </section>
      ) : (
        <>
          <section className="admin-dashboard-v2__top-grid">
            <TopStatCard
              label={content.fleetCountLabel}
              value={summary.vehicleCount}
              iconClassName="far fa-car"
              accent="neutral"
              onClick={() => onNavigate?.("/location-de-voitures")}
            />
            <TopStatCard
              label={content.summaryPendingLabel}
              value={summary.pendingCount}
              iconClassName="far fa-clock"
              accent="alert"
              onClick={() => onNavigate?.("/reservations")}
            />
            <TopStatCard
              label={content.summaryAcceptedLabel}
              value={summary.acceptedCount}
              iconClassName="far fa-check-circle"
              accent="primary"
              onClick={() => onNavigate?.("/reservations")}
            />
          </section>

          <section className="admin-dashboard-v2__layout">
            <div className="admin-dashboard-v2__main">
              <section className="admin-dashboard-v2__overview-card">
                <div className="admin-dashboard-v2__overview-head">
                  <div>
                    <span>{performanceTitle}</span>
                    <h2>{content.summaryVisitsLabel}: {formatNumber(requestRangeSummary.totalRequests)}</h2>
                  </div>
                  <div className="admin-dashboard-v2__overview-right">
                    <MiniFilter labels={requestFilterItems} value={requestRangeFilter} onChange={setRequestRangeFilter} />
                    <div>
                      <span>{content.summaryRevenueLabel}</span>
                      <p>{formatCurrency(summary.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
                <div className="admin-dashboard-v2__overview-caption">
                  <strong>{overviewChartTitle}</strong>
                  <p>{overviewChartDescription}</p>
                </div>
                <OverviewChart items={overviewItems} />
              </section>

              <section className="admin-dashboard-v2__insights-grid">
                <InsightCard
                  title={content.insightTopVehicleTitle}
                  label={insights.topVehicle?.label || "-"}
                  helper={insights.topVehicle?.helper || content.emptyChartLabel}
                  iconClassName="far fa-star"
                />
                <InsightCard
                  title={content.insightBusiestMonthTitle}
                  label={insights.busiestMonth?.label || "-"}
                  helper={insights.busiestMonth?.helper || content.emptyChartLabel}
                  iconClassName="far fa-clock"
                />
                <InsightCard
                  title={content.insightBusiestWeekdayTitle}
                  label={insights.busiestWeekday?.label || "-"}
                  helper={insights.busiestWeekday?.helper || content.emptyChartLabel}
                  iconClassName="far fa-calendar-alt"
                />
              </section>

              <section className="admin-dashboard-v2__lists-grid">
                <RankedList
                  title={content.barsTopVehiclesTitle}
                  items={topVehicles}
                  emptyLabel={content.emptyChartLabel}
                />
                <WeekdayList
                  title={content.barsWeekdayTitle}
                  items={weekdayItems}
                  emptyLabel={content.emptyChartLabel}
                />
              </section>
            </div>

            <aside className="admin-dashboard-v2__side">
              <FleetStatusCard title={content.chartFleetStatusTitle} items={fleetItems} />
              <FocusCard
                pendingCount={summary.pendingCount}
                helper={content.summaryPendingHelper}
                onClick={() => onNavigate?.("/reservations")}
              />
            </aside>
          </section>
        </>
      )}
    </main>
  );
}

export default AdminAceulle;
