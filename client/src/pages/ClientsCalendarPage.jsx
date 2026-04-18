import { useEffect, useMemo, useState } from "react";
import {
  getCachedAdminReservations,
  hasCachedAdminReservations,
  listAdminReservations
} from "../services/reservationService";
import { formatReservationDateTime } from "../utils/reservationFormatters";
import { handleImageFallback } from "../utils/imageFallback";

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});
const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});

function createMonthReference(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function createCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  if (isNaN(date.getTime())) return null;
  return date;
}

function getDayKey(day) {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function isSameMonth(day, monthDate) {
  return (
    day.getFullYear() === monthDate.getFullYear() &&
    day.getMonth() === monthDate.getMonth()
  );
}

function isToday(day) {
  const today = new Date();
  return (
    day.getFullYear() === today.getFullYear() &&
    day.getMonth() === today.getMonth() &&
    day.getDate() === today.getDate()
  );
}

function reservationTouchesDay(reservation, day) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
  const pickupDate = toDate(reservation.pickupDatetime);
  const returnDate = toDate(reservation.returnDatetime);

  return pickupDate < dayEnd && returnDate > dayStart;
}

function buildDayLabels(calendarDays) {
  return calendarDays.slice(0, 7).map((day) => weekdayFormatter.format(day));
}

function sortByPickup(left, right) {
  return toDate(left.pickupDatetime).getTime() - toDate(right.pickupDatetime).getTime();
}

function sortByCreatedDesc(left, right) {
  return toDate(right.createdAt).getTime() - toDate(left.createdAt).getTime();
}

function ReservationStatusPill({ label, type }) {
  return (
    <span
      className={
        "reservations-calendar-page__status reservations-calendar-page__status--" + type
      }
    >
      {label}
    </span>
  );
}

function ClientsCalendarPage({ content, onCreateClick, onReservationClick }) {
  const [pendingReservations, setPendingReservations] = useState(() => getCachedAdminReservations("pending"));
  const [acceptedReservations, setAcceptedReservations] = useState(() => getCachedAdminReservations("accepted"));
  const [monthDate, setMonthDate] = useState(() => createMonthReference(new Date()));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(
    () => !hasCachedAdminReservations("pending") || !hasCachedAdminReservations("accepted")
  );

  useEffect(() => {
    let isActive = true;

    const loadReservations = async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(
          () => !hasCachedAdminReservations("pending") || !hasCachedAdminReservations("accepted")
        );
      }
      setErrorMessage("");

      try {
        const [nextPendingReservations, nextAcceptedReservations] = await Promise.all([
          listAdminReservations({ scope: "pending" }),
          listAdminReservations({ scope: "accepted" })
        ]);

        if (!isActive) {
          return;
        }

        setPendingReservations(nextPendingReservations.sort(sortByCreatedDesc));
        setAcceptedReservations(nextAcceptedReservations.sort(sortByPickup));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReservations();

    const refreshReservations = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void loadReservations({ silent: true });
    };

    const intervalId = window.setInterval(refreshReservations, 15000);
    window.addEventListener("focus", refreshReservations);
    document.addEventListener("visibilitychange", refreshReservations);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshReservations);
      document.removeEventListener("visibilitychange", refreshReservations);
    };
  }, [content.detailErrorMessage]);

  const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
  const weekdayLabels = useMemo(() => buildDayLabels(calendarDays), [calendarDays]);
  const visibleAcceptedReservations = useMemo(
    () =>
      acceptedReservations.filter((reservation) =>
        calendarDays.some((day) => reservationTouchesDay(reservation, day))
      ),
    [acceptedReservations, calendarDays]
  );
  const reservationsByDay = useMemo(() => {
    const map = new Map(calendarDays.map((day) => [getDayKey(day), []]));

    visibleAcceptedReservations.forEach((reservation) => {
      calendarDays.forEach((day) => {
        if (reservationTouchesDay(reservation, day)) {
          map.get(getDayKey(day))?.push(reservation);
        }
      });
    });

    return map;
  }, [calendarDays, visibleAcceptedReservations]);
  const visibleCountLabel = `${visibleAcceptedReservations.length} ${content.clientsVisibleCountSuffix}`;
  const hasAnyReservation =
    pendingReservations.length > 0 || acceptedReservations.length > 0;

  return (
    <main className="reservations-calendar-page">
      <section className="reservations-calendar-page__hero">
        <div className="reservations-calendar-page__container reservations-calendar-page__hero-inner">
          <div className="reservations-calendar-page__hero-copy">
            <p className="hero-card__eyebrow">{content.eyebrow}</p>
            <h1>{content.clientsTitle}</h1>
            <p className="hero-card__text">{content.clientsDescription}</p>
          </div>

          <button
            type="button"
            className="login-form__submit reservations-calendar-page__create"
            onClick={onCreateClick}
          >
            {content.createLabel}
          </button>
        </div>
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">Chargement des reservations...</p>
        </section>
      ) : errorMessage ? (
        <section className="vehicles-empty">
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        </section>
      ) : !hasAnyReservation ? (
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h2>{content.clientsEmptyTitle}</h2>
            <p>{content.clientsEmptyDescription}</p>
          </div>
        </section>
      ) : (
        <section className="reservations-calendar-page__body">
          <div className="reservations-calendar-page__container">

            <section className="reservations-calendar-page__panel reservations-calendar-page__panel--pending">
              <div className="reservations-calendar-page__panel-head">
                <div className="reservations-calendar-page__panel-head-copy">
                  <p className="hero-card__eyebrow">{content.clientsPendingEyebrow}</p>
                  <h2>{content.clientsPendingTitle}</h2>
                  <p className="reservations-calendar-page__panel-text">
                    {content.clientsPendingDescription}
                  </p>
                </div>

                <span className="reservations-calendar-page__count reservations-calendar-page__count--pending">
                  {pendingReservations.length} {content.clientsPendingCountSuffix}
                </span>
              </div>

              {pendingReservations.length === 0 ? (
                <div className="reservations-calendar-page__empty-box">
                  <h3>{content.clientsPendingEmptyTitle}</h3>
                  <p>{content.clientsPendingEmptyDescription}</p>
                </div>
              ) : (
                <div className="reservations-calendar-page__pending-list">
                  {pendingReservations.map((reservation) => (
                    <button
                      key={reservation.id}
                      type="button"
                      className="reservations-calendar-page__pending-card"
                      onClick={() => onReservationClick(reservation.id)}
                    >
                      <img
                        src={reservation.vehiclePhotoUrl || "/home/rentzo-catalog-hero.jpg"}
                        alt={reservation.vehicleName}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageFallback}
                      />

                      <div className="reservations-calendar-page__pending-body">
                        <div className="reservations-calendar-page__pending-top">
                          <ReservationStatusPill
                            label={content.statusPendingLabel}
                            type="pending"
                          />
                          <span className="reservations-calendar-page__pending-date">
                            {content.createdAtLabel}: {formatReservationDateTime(reservation.createdAt)}
                          </span>
                        </div>

                        <h3>{reservation.vehicleName}</h3>
                        <p className="reservations-calendar-page__pending-client">
                          {reservation.firstName} {reservation.lastName}
                        </p>

                        <div className="reservations-calendar-page__pending-meta">
                          <span>{reservation.durationLabel}</span>
                          <span>
                            {content.calendarPickupLabel}: {formatReservationDateTime(reservation.pickupDatetime)}
                          </span>
                          <span>
                            {content.calendarReturnLabel}: {formatReservationDateTime(reservation.returnDatetime)}
                          </span>
                        </div>

                        <span className="reservations-calendar-page__pending-cta">
                          {content.clientsPendingActionLabel}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="reservations-calendar-page__layout">
              <section className="reservations-calendar-page__panel reservations-calendar-page__panel--calendar">
                <div className="reservations-calendar-page__panel-head">
                  <div className="reservations-calendar-page__panel-head-copy">
                    <p className="hero-card__eyebrow">{content.clientsAcceptedEyebrow}</p>
                    <h2>{monthFormatter.format(monthDate)}</h2>
                    <p className="reservations-calendar-page__panel-text">
                      {content.clientsAcceptedDescription}
                    </p>
                  </div>

                  <span className="reservations-calendar-page__count">{visibleCountLabel}</span>
                </div>

                <div className="reservations-calendar-page__toolbar">
                  <button
                    type="button"
                    className="vehicle-detail__secondary-action reservations-calendar-page__nav"
                    onClick={() =>
                      setMonthDate(
                        (currentMonthDate) =>
                          new Date(
                            currentMonthDate.getFullYear(),
                            currentMonthDate.getMonth() - 1,
                            1
                          )
                      )
                    }
                  >
                    {content.clientsMonthPreviousLabel}
                  </button>

                  <button
                    type="button"
                    className="vehicle-detail__secondary-action reservations-calendar-page__nav"
                    onClick={() =>
                      setMonthDate(
                        (currentMonthDate) =>
                          new Date(
                            currentMonthDate.getFullYear(),
                            currentMonthDate.getMonth() + 1,
                            1
                          )
                      )
                    }
                  >
                    {content.clientsMonthNextLabel}
                  </button>
                </div>

                {acceptedReservations.length === 0 ? (
                  <div className="reservations-calendar-page__empty-box reservations-calendar-page__empty-box--calendar">
                    <h3>{content.clientsAcceptedEmptyTitle}</h3>
                    <p>{content.clientsAcceptedEmptyDescription}</p>
                  </div>
                ) : (
                  <div className="reservations-calendar-page__grid" role="grid">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="reservations-calendar-page__weekday">
                        {label}
                      </div>
                    ))}

                    {calendarDays.map((day) => {
                      const dayReservations = reservationsByDay.get(getDayKey(day)) || [];

                      return (
                        <div
                          key={day.toISOString()}
                          className={
                            "reservations-calendar-page__day" +
                            (isSameMonth(day, monthDate)
                              ? ""
                              : " reservations-calendar-page__day--muted") +
                            (isToday(day) ? " reservations-calendar-page__day--today" : "") +
                            (dayReservations.length > 0
                              ? " reservations-calendar-page__day--has-events"
                              : "") +
                            (dayReservations.length > 2
                              ? " reservations-calendar-page__day--busy"
                              : "")
                          }
                        >
                          <div className="reservations-calendar-page__day-head">
                            <span className="reservations-calendar-page__day-number">
                              {day.getDate()}
                            </span>

                            {dayReservations.length > 0 ? (
                              <span className="reservations-calendar-page__day-count">
                                {dayReservations.length}
                              </span>
                            ) : null}
                          </div>

                          <div className="reservations-calendar-page__events">
                            {dayReservations.map((reservation) => (
                              <button
                                key={`${reservation.id}-${day.toISOString()}`}
                                type="button"
                                className="reservations-calendar-page__event"
                                onClick={() => onReservationClick(reservation.id)}
                              >
                                <span className="reservations-calendar-page__event-name">
                                  {reservation.firstName} {reservation.lastName}
                                </span>
                                <span className="reservations-calendar-page__event-vehicle">
                                  {reservation.vehicleName}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="reservations-calendar-page__panel reservations-calendar-page__panel--sidebar">
                <div className="reservations-calendar-page__panel-head reservations-calendar-page__panel-head--sidebar">
                  <div className="reservations-calendar-page__panel-head-copy">
                    <p className="hero-card__eyebrow">{content.clientsSidebarTitle}</p>
                    <h2>{acceptedReservations.length} {content.clientsAcceptedCountSuffix}</h2>
                    <p className="reservations-calendar-page__panel-text">
                      {content.clientsAcceptedSidebarDescription}
                    </p>
                  </div>
                </div>

                {acceptedReservations.length === 0 ? (
                  <div className="reservations-calendar-page__empty-box reservations-calendar-page__empty-box--sidebar">
                    <h3>{content.clientsAcceptedEmptyTitle}</h3>
                    <p>{content.clientsAcceptedEmptyDescription}</p>
                  </div>
                ) : (
                  <div className="reservations-calendar-page__list">
                    {visibleAcceptedReservations.map((reservation) => (
                      <button
                        key={reservation.id}
                        type="button"
                        className="reservations-calendar-page__card"
                        onClick={() => onReservationClick(reservation.id)}
                      >
                        <img
                          src={reservation.vehiclePhotoUrl || "/home/rentzo-catalog-hero.jpg"}
                          alt={reservation.vehicleName}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageFallback}
                        />
                        <div className="reservations-calendar-page__card-body">
                          <div className="reservations-calendar-page__card-top">
                            <ReservationStatusPill
                              label={content.statusAcceptedLabel}
                              type="accepted"
                            />
                          </div>
                          <h3>{reservation.vehicleName}</h3>
                          <p>
                            {reservation.firstName} {reservation.lastName}
                          </p>
                          <p>{reservation.durationLabel}</p>
                          <p>
                            {content.calendarPickupLabel}: {formatReservationDateTime(reservation.pickupDatetime)}
                          </p>
                          <p>
                            {content.calendarReturnLabel}: {formatReservationDateTime(reservation.returnDatetime)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default ClientsCalendarPage;
