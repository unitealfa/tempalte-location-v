import { useEffect, useState } from "react";
import {
  getCachedAdminReservations,
  hasCachedAdminReservations,
  listAdminReservations
} from "../services/reservationService";
import { formatReservationDateTime } from "../utils/reservationFormatters";
import { handleImageFallback } from "../utils/imageFallback";

function CommencerReservationsPage({ content, onReservationClick }) {
  const [reservations, setReservations] = useState(() => getCachedAdminReservations("pending"));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !hasCachedAdminReservations("pending"));

  useEffect(() => {
    let isActive = true;

    const loadReservations = async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(() => !hasCachedAdminReservations("pending"));
      }
      setErrorMessage("");

      try {
        const nextReservations = await listAdminReservations({
          scope: "pending"
        });

        if (!isActive) {
          return;
        }

        setReservations(nextReservations);
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

  return (
    <main className="reservations-calendar-page reservations-calendar-page--pending-only">
      <section className="reservations-calendar-page__hero">
        <div className="reservations-calendar-page__container reservations-calendar-page__hero-inner">
          <div className="reservations-calendar-page__hero-copy">
            <p className="hero-card__eyebrow">{content.clientsPendingEyebrow || content.eyebrow}</p>
            <h1>{content.clientsPendingTitle || content.title}</h1>
            <p className="hero-card__text">
              {content.clientsPendingDescription || content.description}
            </p>
          </div>

          <div className="reservations-calendar-page__count reservations-calendar-page__count--pending">
            {reservations.length} {content.clientsPendingCountSuffix}
          </div>
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
      ) : reservations.length === 0 ? (
        <section className="vehicles-empty">
          <div className="reservations-calendar-page__container">
            <div className="reservations-calendar-page__empty-box">
              <h3>{content.clientsPendingEmptyTitle || content.emptyTitle}</h3>
              <p>{content.clientsPendingEmptyDescription || content.emptyDescription}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="reservations-calendar-page__body">
          <div className="reservations-calendar-page__container">
            <section className="reservations-calendar-page__panel reservations-calendar-page__panel--pending">
              <div className="reservations-calendar-page__panel-head">
                <div className="reservations-calendar-page__panel-head-copy">
                  <p className="hero-card__eyebrow">{content.clientsPendingEyebrow || content.eyebrow}</p>
                  <h2>{content.clientsPendingTitle || content.title}</h2>
                  <p className="reservations-calendar-page__panel-text">
                    {content.clientsPendingDescription || content.description}
                  </p>
                </div>

                <span className="reservations-calendar-page__count reservations-calendar-page__count--pending">
                  {reservations.length} {content.clientsPendingCountSuffix}
                </span>
              </div>

              <div className="reservations-calendar-page__pending-list">
                {reservations.map((reservation) => (
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
                        <span className="reservations-calendar-page__status reservations-calendar-page__status--pending">
                          {content.statusPendingLabel}
                        </span>
                        <span className="reservations-calendar-page__pending-date">
                          {content.createdAtLabel}: {formatReservationDateTime(reservation.createdAt)}
                        </span>
                      </div>

                      <h3>{reservation.vehicleName}</h3>

                      <p className="reservations-calendar-page__pending-client">
                        {reservation.firstName} {reservation.lastName}
                      </p>

                      <div className="reservations-calendar-page__pending-meta">
                        <span>{content.durationLabel}: {reservation.durationLabel}</span>
                        <span>{content.calendarPickupLabel}: {formatReservationDateTime(reservation.pickupDatetime)}</span>
                        <span>{content.calendarReturnLabel}: {formatReservationDateTime(reservation.returnDatetime)}</span>
                      </div>

                      <span className="reservations-calendar-page__pending-cta">
                        {content.clientsPendingActionLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

export default CommencerReservationsPage;
