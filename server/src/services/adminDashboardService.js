const {
  listReservations
} = require("../repositories/reservationRepository");
const { listAdminVehicles } = require("./vehicleService");
const { DEFAULT_VEHICLE_IMAGE_URL } = require("./mediaUrlService");

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "short"
});
const MONTH_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "numeric"
});
const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
];
const PERIOD_OPTIONS = new Set(["month", "year", "all"]);

function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === "string" && value.trim()) {
    const normalizedValue = value.includes("T")
      ? value
      : value.replace(" ", "T");
    return new Date(normalizedValue);
  }

  return new Date(value);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function startOfMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1, 0, 0, 0, 0);
}

function startOfYear(year) {
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

function endOfWeek(date) {
  const next = new Date(date);
  next.setDate(date.getDate() + 7);
  return next;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function normalizeClientContactValue(value) {
  return String(value || "").trim().toLowerCase();
}

function buildClientIdentityKey(reservation) {
  const email = normalizeClientContactValue(reservation.email);
  const phone = normalizeClientContactValue(reservation.phone).replace(/\s+/g, "");
  const firstName = normalizeClientContactValue(reservation.firstName);
  const lastName = normalizeClientContactValue(reservation.lastName);

  if (email) {
    return `email:${email}`;
  }

  if (phone) {
    return `phone:${phone}`;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(":");
  return fullName ? `name:${fullName}` : `reservation:${reservation.id}`;
}

function getRequestRangeStats(reservations, startDate, endDate) {
  const filteredReservations = reservations.filter((reservation) =>
    reservationCreatedInRange(reservation, startDate, endDate)
  );
  const uniqueClients = new Set(
    filteredReservations.map(buildClientIdentityKey).filter(Boolean)
  );

  return {
    totalRequests: filteredReservations.length,
    totalClients: uniqueClients.size
  };
}

function getRequestRangeSummaries(reservations, now = new Date()) {
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -6);
  const monthStart = startOfMonth(now.getFullYear(), now.getMonth());
  const dayStats = getRequestRangeStats(reservations, todayStart, tomorrowStart);
  const weekStats = getRequestRangeStats(reservations, weekStart, tomorrowStart);
  const monthStats = getRequestRangeStats(reservations, monthStart, tomorrowStart);

  return {
    day: {
      totalRequests: dayStats.totalRequests,
      totalClients: dayStats.totalClients
    },
    week: {
      totalRequests: weekStats.totalRequests,
      totalClients: weekStats.totalClients
    },
    month: {
      totalRequests: monthStats.totalRequests,
      totalClients: monthStats.totalClients
    }
  };
}

async function getAdminDashboardLiveRequestRanges() {
  const reservations = await listReservations();
  return getRequestRangeSummaries(reservations);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYearOptions(reservations) {
  const years = new Set([new Date().getFullYear()]);

  reservations.forEach((reservation) => {
    [reservation.pickupDatetime, reservation.returnDatetime, reservation.createdAt].forEach(
      (value) => {
        const date = toDate(value);

        if (isValidDate(date)) {
          years.add(date.getFullYear());
        }
      }
    );
  });

  return Array.from(years).sort((left, right) => right - left);
}

function normalizeDashboardFilters(filters, reservations) {
  const availableYears = getYearOptions(reservations);
  const now = new Date();
  const requestedView = String(filters.view || "month").toLowerCase();
  const view = PERIOD_OPTIONS.has(requestedView) ? requestedView : "month";
  const requestedYear = Number(filters.year);
  const year = availableYears.includes(requestedYear)
    ? requestedYear
    : now.getFullYear();
  const requestedMonth = Number(filters.month);
  const month =
    Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth
      : now.getMonth() + 1;

  let startDate = null;
  let endDate = null;

  if (view === "month") {
    startDate = startOfMonth(year, month - 1);
    endDate = startOfMonth(year, month);
  } else if (view === "year") {
    startDate = startOfYear(year);
    endDate = startOfYear(year + 1);
  }

  return {
    view,
    year,
    month,
    startDate,
    endDate,
    availableYears
  };
}

function isDateInRange(date, startDate, endDate) {
  if (!isValidDate(date)) {
    return false;
  }

  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date >= endDate) {
    return false;
  }

  return true;
}

function reservationCreatedInRange(reservation, startDate, endDate) {
  return isDateInRange(toDate(reservation.createdAt), startDate, endDate);
}

function reservationPickupInRange(reservation, startDate, endDate) {
  return isDateInRange(toDate(reservation.pickupDatetime), startDate, endDate);
}

function reservationTouchesRange(reservation, startDate, endDate) {
  const pickupDate = toDate(reservation.pickupDatetime);
  const returnDate = toDate(reservation.returnDatetime);

  if (!isValidDate(pickupDate) || !isValidDate(returnDate)) {
    return false;
  }

  if (!startDate && !endDate) {
    return true;
  }

  if (startDate && returnDate < startDate) {
    return false;
  }

  if (endDate && pickupDate >= endDate) {
    return false;
  }

  return true;
}

function buildVehiclePhotoMap(vehicles) {
  const vehiclePhotoMap = new Map();

  vehicles.forEach((vehicle) => {
    const primaryPhotoUrl =
      (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls[0]) || "";

    if (vehicle?.id && primaryPhotoUrl) {
      vehiclePhotoMap.set(Number(vehicle.id), primaryPhotoUrl);
    }
  });

  return vehiclePhotoMap;
}

function resolveDashboardVehiclePhotoUrl(reservation, vehiclePhotoMap) {
  const vehicleId = Number(reservation.vehicleId || 0);
  const currentVehiclePhotoUrl =
    vehicleId > 0 ? vehiclePhotoMap.get(vehicleId) || "" : "";
  const snapshotPhotoUrl =
    reservation.vehiclePhotoUrl &&
    reservation.vehiclePhotoUrl !== DEFAULT_VEHICLE_IMAGE_URL
      ? reservation.vehiclePhotoUrl
      : "";

  return currentVehiclePhotoUrl || snapshotPhotoUrl || "";
}

function buildTopVehiclesChart(acceptedReservations, vehiclePhotoMap, limit = 6) {
  const vehicleMap = new Map();

  acceptedReservations.forEach((reservation) => {
    const label = [reservation.vehicleBrand, reservation.vehicleModel]
      .filter(Boolean)
      .join(" ") || `Vehicule #${reservation.vehicleId || reservation.id}`;
    const resolvedPhotoUrl = resolveDashboardVehiclePhotoUrl(
      reservation,
      vehiclePhotoMap
    );
    const current = vehicleMap.get(label) || {
      label,
      value: 0,
      photoUrl: resolvedPhotoUrl
    };

    current.value += 1;
    if (!current.photoUrl && resolvedPhotoUrl) {
      current.photoUrl = resolvedPhotoUrl;
    }

    vehicleMap.set(label, current);
  });

  return Array.from(vehicleMap.values())
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function buildFleetStatusChart(vehicles) {
  const counts = {
    available: 0,
    reserved: 0,
    maintenance: 0
  };

  vehicles.forEach((vehicle) => {
    if (vehicle.availabilityStatus === "reserved") {
      counts.reserved += 1;
      return;
    }

    if (vehicle.availabilityStatus === "maintenance") {
      counts.maintenance += 1;
      return;
    }

    counts.available += 1;
  });

  return [
    { label: "Disponibles", value: counts.available, tone: "available" },
    { label: "Réservés", value: counts.reserved, tone: "reserved" },
    { label: "Maintenance", value: counts.maintenance, tone: "maintenance" }
  ];
}

function buildTopVehicleInsight(topVehicles) {
  if (topVehicles.length === 0) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Aucune réservation confirmée pour le moment.",
      photoUrl: ""
    };
  }

  return {
    label: topVehicles[0].label,
    value: topVehicles[0].value,
    helper: "véhicule le plus loué",
    photoUrl: topVehicles[0].photoUrl || ""
  };
}

function buildPeriodDistribution(acceptedReservations) {
  const monthCounts = new Map();

  acceptedReservations.forEach((reservation) => {
    const pickupDate = toDate(reservation.pickupDatetime);

    if (!isValidDate(pickupDate)) {
      return;
    }

    const key = `${pickupDate.getFullYear()}-${pickupDate.getMonth()}`;
    const current = monthCounts.get(key) || {
      label: MONTH_WITH_YEAR_FORMATTER.format(pickupDate),
      value: 0
    };

    current.value += 1;
    monthCounts.set(key, current);
  });

  return Array.from(monthCounts.values())
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, 6);
}

function buildBusiestMonthInsight(periodDistribution) {
  const busiestMonth = [...periodDistribution].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label)
  )[0];

  if (!busiestMonth) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Le site n'a pas encore assez d'historique."
    };
  }

  return {
    label: busiestMonth.label,
    value: busiestMonth.value,
    helper: "période la plus demandée"
  };
}

function buildWeekdayChart(acceptedReservations) {
  const weekdayCounts = Array.from({ length: 7 }, (_, index) => ({
    label: WEEKDAY_LABELS[index],
    value: 0
  }));

  acceptedReservations.forEach((reservation) => {
    const pickupDate = toDate(reservation.pickupDatetime);

    if (!isValidDate(pickupDate)) {
      return;
    }

    const weekdayIndex = (pickupDate.getDay() + 6) % 7;
    weekdayCounts[weekdayIndex].value += 1;
  });

  return weekdayCounts;
}

function buildBusiestWeekdayInsight(weekdayChart) {
  const busiestWeekday = [...weekdayChart].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label)
  )[0];

  if (!busiestWeekday || busiestWeekday.value === 0) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Aucune tendance détectée pour le moment."
    };
  }

  return {
    label: busiestWeekday.label,
    value: busiestWeekday.value,
    helper: "jour qui reçoit le plus de départs"
  };
}

function buildWeeklyRequestSeries({ startDate, endDate, reservations }) {
  const periods = [];
  let cursor = new Date(startDate);
  let weekIndex = 0;

  while (cursor < endDate) {
    const periodStart = new Date(cursor);
    const periodEnd = endOfWeek(periodStart);
    periods.push({
      key: `week-${weekIndex + 1}`,
      label: `Sem ${weekIndex + 1}`,
      start: periodStart,
      end: periodEnd > endDate ? new Date(endDate) : periodEnd,
      requests: 0
    });
    cursor = periodEnd;
    weekIndex += 1;
  }

  reservations.forEach((reservation) => {
    const createdAt = toDate(reservation.createdAt);

    if (!isDateInRange(createdAt, startDate, endDate)) {
      return;
    }

    const period = periods.find(
      (item) => createdAt >= item.start && createdAt < item.end
    );

    if (!period) {
      return;
    }

    period.requests += 1;
  });

  return {
    requestSeries: periods.map((item) => ({ label: item.label, value: item.requests }))
  };
}

function buildMonthlyRequestSeries({ startDate, endDate, reservations }) {
  const requestsMap = new Map();
  let cursor = new Date(startDate);

  reservations.forEach((reservation) => {
    const createdAt = toDate(reservation.createdAt);

    if (!isDateInRange(createdAt, startDate, endDate)) {
      return;
    }

    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    requestsMap.set(key, (requestsMap.get(key) || 0) + 1);
  });

  const requestItems = [];

  while (cursor < endDate) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    const label = MONTH_LABEL_FORMATTER.format(cursor);

    requestItems.push({ label, value: requestsMap.get(key) || 0 });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    requestSeries: requestItems
  };
}

function buildYearlyRequestSeries({ reservations }) {
  const requestsMap = new Map();
  const years = new Set();

  reservations.forEach((reservation) => {
    const createdAt = toDate(reservation.createdAt);

    if (!isValidDate(createdAt)) {
      return;
    }

    const year = createdAt.getFullYear();
    years.add(year);
    requestsMap.set(year, (requestsMap.get(year) || 0) + 1);
  });

  const sortedYears = Array.from(years).sort((left, right) => left - right).slice(-5);

  return {
    requestSeries: sortedYears.map((year) => ({ label: String(year), value: requestsMap.get(year) || 0 }))
  };
}

async function getAdminDashboardStats(filters = {}) {
  const [allReservations, vehicles] = await Promise.all([
    listReservations(),
    listAdminVehicles()
  ]);
  const pendingReservations = allReservations.filter(
    (reservation) => reservation.status === "pending"
  );
  const acceptedReservations = allReservations.filter(
    (reservation) => reservation.status === "accepted"
  );
  const normalizedFilters = normalizeDashboardFilters(filters, allReservations);
  const requestRangeSummaries = getRequestRangeSummaries(allReservations);

  const filteredPendingReservations = pendingReservations.filter((reservation) =>
    normalizedFilters.view === "all"
      ? true
      : reservationCreatedInRange(
          reservation,
          normalizedFilters.startDate,
          normalizedFilters.endDate
        )
  );
  const filteredAcceptedReservations = acceptedReservations.filter((reservation) =>
    normalizedFilters.view === "all"
      ? true
      : reservationPickupInRange(
          reservation,
          normalizedFilters.startDate,
          normalizedFilters.endDate
        )
  );
  const visibleRangeReservations = acceptedReservations.filter((reservation) =>
    normalizedFilters.view === "all"
      ? true
      : reservationTouchesRange(
          reservation,
          normalizedFilters.startDate,
          normalizedFilters.endDate
        )
  );

  let series = null;
  const filteredRequestReservations = allReservations.filter((reservation) =>
    normalizedFilters.view === "all"
      ? true
      : reservationCreatedInRange(
          reservation,
          normalizedFilters.startDate,
          normalizedFilters.endDate
        )
  );

  if (normalizedFilters.view === "month") {
    series = buildWeeklyRequestSeries({
      startDate: normalizedFilters.startDate,
      endDate: normalizedFilters.endDate,
      reservations: filteredRequestReservations
    });
  } else if (normalizedFilters.view === "year") {
    series = buildMonthlyRequestSeries({
      startDate: normalizedFilters.startDate,
      endDate: normalizedFilters.endDate,
      reservations: filteredRequestReservations
    });
  } else {
    series = buildYearlyRequestSeries({
      reservations: allReservations
    });
  }

  const totalRevenue = filteredAcceptedReservations.reduce(
    (sum, reservation) => sum + Number(reservation.totalPrice || 0),
    0
  );
  const filteredRequestTotal = series.requestSeries.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );
  const filteredUniqueClients = new Set(
    filteredRequestReservations.map(buildClientIdentityKey).filter(Boolean)
  ).size;
  const vehiclePhotoMap = buildVehiclePhotoMap(vehicles);
  const topVehicles = buildTopVehiclesChart(
    filteredAcceptedReservations,
    vehiclePhotoMap
  );
  const weekdayChart = buildWeekdayChart(filteredAcceptedReservations);
  const periodDistribution = buildPeriodDistribution(filteredAcceptedReservations);

  return {
    filters: {
      view: normalizedFilters.view,
      year: normalizedFilters.year,
      month: normalizedFilters.month,
      availableYears: normalizedFilters.availableYears
    },
    summary: {
      pendingCount: filteredPendingReservations.length,
      acceptedCount: filteredAcceptedReservations.length,
      visibleThisMonthCount: visibleRangeReservations.length,
      totalRevenue,
      totalRequests: filteredRequestTotal,
      totalClients: filteredUniqueClients,
      vehicleCount: vehicles.length,
      requestRanges: requestRangeSummaries
    },
    insights: {
      topVehicle: buildTopVehicleInsight(topVehicles),
      busiestMonth: buildBusiestMonthInsight(periodDistribution),
      busiestWeekday: buildBusiestWeekdayInsight(weekdayChart)
    },
    charts: {
      requestSeries: series.requestSeries,
      topVehicles,
      reservationsByWeekday: weekdayChart,
      periodDistribution,
      fleetStatus: buildFleetStatusChart(vehicles)
    }
  };
}

module.exports = {
  getAdminDashboardStats,
  getAdminDashboardLiveRequestRanges
};
