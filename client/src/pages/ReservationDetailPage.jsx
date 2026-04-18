import { useEffect, useMemo, useState } from "react";
import {
  acceptAdminReservation,
  deleteAdminReservation,
  getAdminReservationById,
  getCachedAdminReservationById,
  rejectAdminReservation
} from "../services/reservationService";
import {
  formatReservationDateTime,
  getReservationLocationLabel
} from "../utils/reservationFormatters";
import { getReservationRateLabel } from "../utils/reservationPricing";
import { formatVehiclePrice } from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

const miniWeekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "narrow"
});
const miniMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});

function toDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  if (isNaN(date.getTime())) return null;
  return date;
}

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

function buildWeekdayLabels() {
  const mondayReference = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(mondayReference);
    day.setDate(mondayReference.getDate() + index);
    return miniWeekdayFormatter.format(day);
  });
}

function isSameMonth(day, monthDate) {
  return (
    day.getFullYear() === monthDate.getFullYear() &&
    day.getMonth() === monthDate.getMonth()
  );
}

function isSameCalendarDay(left, right) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function reservationTouchesDay(day, pickupDate, returnDate) {
  if (!pickupDate || !returnDate) {
    return false;
  }

  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);

  return pickupDate < dayEnd && returnDate > dayStart;
}

function buildReservationMonths(pickupDate, returnDate) {
  if (!pickupDate || !returnDate) {
    return [];
  }

  const months = [];
  const current = createMonthReference(pickupDate);
  const end = createMonthReference(returnDate);

  while (current.getTime() <= end.getTime() && months.length < 12) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function ReservationDetailPage({
  content,
  vehicleContent,
  reservationId,
  detailScope,
  onAccepted,
  onRejected,
  onEditClick,
  onDeleted,
  onBackClick
}) {
  const [reservation, setReservation] = useState(() => getCachedAdminReservationById(reservationId));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !getCachedAdminReservationById(reservationId));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeLicenseIndex, setActiveLicenseIndex] = useState(-1);

  useEffect(() => {
    let isActive = true;

    const loadReservation = async () => {
      setIsLoading(() => !reservation);
      setErrorMessage("");

      try {
        const nextReservation = await getAdminReservationById(reservationId);

        if (!isActive) {
          return;
        }

        setReservation(nextReservation);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setReservation(null);
        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReservation();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, reservationId]);

  useEffect(() => {
    if (activeLicenseIndex < 0) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (!reservation?.drivingLicensePhotoUrls?.length) {
        return;
      }

      if (event.key === "Escape") {
        setActiveLicenseIndex(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveLicenseIndex((currentIndex) => {
          const nextIndex = currentIndex + 1;
          return nextIndex >= reservation.drivingLicensePhotoUrls.length ? 0 : nextIndex;
        });
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveLicenseIndex((currentIndex) => {
          const nextIndex = currentIndex - 1;
          return nextIndex < 0
            ? reservation.drivingLicensePhotoUrls.length - 1
            : nextIndex;
        });
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLicenseIndex, reservation?.drivingLicensePhotoUrls]);

  const miniWeekdayLabels = useMemo(() => buildWeekdayLabels(), []);
  const pickupDate = useMemo(
    () => (reservation ? toDate(reservation.pickupDatetime) : null),
    [reservation?.pickupDatetime]
  );
  const returnDate = useMemo(
    () => (reservation ? toDate(reservation.returnDatetime) : null),
    [reservation?.returnDatetime]
  );
  const reservationMonths = useMemo(
    () => buildReservationMonths(pickupDate, returnDate),
    [pickupDate, returnDate]
  );
  const activeLicenseUrl =
    activeLicenseIndex >= 0 && reservation?.drivingLicensePhotoUrls?.length
      ? reservation.drivingLicensePhotoUrls[activeLicenseIndex]
      : "";

  const handleOpenLicenseViewer = (index) => {
    setActiveLicenseIndex(index);
  };

  const handleCloseLicenseViewer = () => {
    setActiveLicenseIndex(-1);
  };

  const handleShowPreviousLicense = () => {
    if (!reservation?.drivingLicensePhotoUrls?.length) {
      return;
    }

    setActiveLicenseIndex((currentIndex) =>
      currentIndex - 1 < 0
        ? reservation.drivingLicensePhotoUrls.length - 1
        : currentIndex - 1
    );
  };

  const handleShowNextLicense = () => {
    if (!reservation?.drivingLicensePhotoUrls?.length) {
      return;
    }

    setActiveLicenseIndex((currentIndex) =>
      currentIndex + 1 >= reservation.drivingLicensePhotoUrls.length
        ? 0
        : currentIndex + 1
    );
  };

  const handleAccept = async () => {
    setIsActionLoading(true);
    setErrorMessage("");

    try {
      const updatedReservation = await acceptAdminReservation(reservationId);
      setReservation(updatedReservation);
      onAccepted();
    } catch (error) {
      setErrorMessage(error.message || content.acceptErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(content.rejectConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");

    try {
      await rejectAdminReservation(reservationId);
      onRejected();
    } catch (error) {
      setErrorMessage(error.message || content.rejectErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(content.deleteConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");

    try {
      await deleteAdminReservation(reservationId);
      onDeleted();
    } catch (error) {
      setErrorMessage(error.message || content.formDeleteErrorMessage);
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="reservation-detail-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement de la reservation...</p>
        </section>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="vehicle-form-page reservation-detail-theme">
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h1>{content.detailTitle}</h1>
            <p>{errorMessage || content.detailErrorMessage}</p>
            <button
              type="button"
              className="vehicle-form-page__back"
              onClick={onBackClick}
              aria-label={content.backLabel}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </section>
      </main>
    );
  }

  const statusLabel = reservation.isAccepted
    ? content.statusAcceptedLabel
    : content.statusPendingLabel;
  const reservationPriceLabel =
    reservation.totalPrice === null || reservation.totalPrice === undefined
      ? "-"
      : formatVehiclePrice(reservation.totalPrice);
  const reservationRateLabel = reservation.priceRateType
    ? getReservationRateLabel(reservation.priceRateType, vehicleContent)
    : "-";
  const reservationPriceModeLabel = reservation.priceManualOverride
    ? vehicleContent.reservationPriceModeManualLabel
    : vehicleContent.reservationPriceModeAutomaticLabel;

  return (
    <main className="vehicle-form-page reservation-detail-theme">
      <section className="vehicle-form-page__hero">
        <div className="vehicle-form-page__container">
          <button
            type="button"
            className="vehicle-form-page__back"
            onClick={onBackClick}
            aria-label={content.backLabel}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="vehicle-form-page__hero-copy">
            <h1>{content.detailTitle}</h1>
            <p className="hero-card__text">{content.detailDescription}</p>
          </div>
        </div>
      </section>

      <section className="vehicle-form-page__body">
        <div className="vehicle-form-page__container">
          {errorMessage ? (
            <div className="vehicle-form-page__panel reservation-detail-theme__alert-panel">
              <p className="login-form__message login-form__message--error">{errorMessage}</p>
            </div>
          ) : null}

          <div className="vehicle-form-page__layout">
            <div className="vehicle-form-page__main">
              <article className="vehicle-form-page__panel">
                <div className="vehicle-form-page__panel-header">
                  <h2>{content.vehicleLabel}</h2>
                </div>

                <div className="reservation-detail-theme__price-hero">
                  <span className="reservation-detail-theme__price-hero-label">
                    {vehicleContent.reservationEstimatedTotalLabel}
                  </span>
                  <strong className="reservation-detail-theme__price-hero-value">
                    {reservationPriceLabel}
                  </strong>
                  <div className="reservation-detail-theme__price-hero-meta">
                    <span className="reservation-detail-theme__price-chip">{reservationRateLabel}</span>
                    <span className="reservation-detail-theme__price-chip">{reservationPriceModeLabel}</span>
                    <span className="reservation-detail-theme__price-chip">{reservation.durationLabel}</span>
                  </div>
                </div>

                <dl className="reservation-detail-theme__info-list">
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.statusLabel}</dt>
                    <dd>
                      <span className={`reservation-detail-theme__status reservation-detail-theme__status--${reservation.status}`}>
                        {statusLabel}
                      </span>
                    </dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.vehicleLabel}</dt>
                    <dd>{reservation.vehicleName}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.durationLabel}</dt>
                    <dd>{reservation.durationLabel}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.createdAtLabel}</dt>
                    <dd>{formatReservationDateTime(reservation.createdAt)}</dd>
                  </div>
                </dl>
              </article>

              <article className="vehicle-form-page__panel">
                <div className="vehicle-form-page__panel-header">
                  <h2>{content.customerLabel}</h2>
                </div>

                <dl className="reservation-detail-theme__info-list">
                  <div className="reservation-detail-theme__info-row">
                    <dt>{vehicleContent.reservationLastNameLabel}</dt>
                    <dd>{reservation.lastName}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{vehicleContent.reservationFirstNameLabel}</dt>
                    <dd>{reservation.firstName}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.phoneLabel}</dt>
                    <dd>{reservation.phone}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.emailLabel}</dt>
                    <dd>{reservation.email || "-"}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.commentLabel}</dt>
                    <dd>{reservation.comment || "-"}</dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.pickupLabel}</dt>
                    <dd>
                      {getReservationLocationLabel(
                        vehicleContent.reservationPickupLocationOptions,
                        reservation.pickupLocationType
                      )}{" "}
                      | {formatReservationDateTime(reservation.pickupDatetime)}
                    </dd>
                  </div>
                  <div className="reservation-detail-theme__info-row">
                    <dt>{content.returnLabel}</dt>
                    <dd>
                      {getReservationLocationLabel(
                        vehicleContent.reservationPickupLocationOptions,
                        reservation.returnLocationType
                      )}{" "}
                      | {formatReservationDateTime(reservation.returnDatetime)}
                    </dd>
                  </div>
                </dl>
              </article>

              <section className="vehicle-form-page__panel reservation-detail-theme__actions-panel">
                {reservation.isPending ? (
                  <div className="reservation-detail-theme__actions">
                    <button
                      type="button"
                      className="login-form__submit"
                      disabled={isActionLoading}
                      onClick={handleAccept}
                    >
                      {content.acceptLabel}
                    </button>

                    <button
                      type="button"
                      className="vehicle-detail__secondary-action"
                      disabled={isActionLoading}
                      onClick={onEditClick}
                    >
                      {content.editLabel}
                    </button>

                    <button
                      type="button"
                      className="vehicle-detail__danger-action"
                      disabled={isActionLoading}
                      onClick={handleReject}
                    >
                      {content.rejectLabel}
                    </button>
                  </div>
                ) : detailScope !== "reservations" ? (
                  <div className="reservation-detail-theme__actions">
                    <button
                      type="button"
                      className="login-form__submit"
                      onClick={onAccepted}
                    >
                      {content.acceptedRedirectLabel}
                    </button>
                  </div>
                ) : (
                  <div className="reservation-detail-theme__actions">
                    <button
                      type="button"
                      className="login-form__submit"
                      disabled={isActionLoading}
                      onClick={onEditClick}
                    >
                      {content.editLabel}
                    </button>

                    <button
                      type="button"
                      className="vehicle-detail__danger-action"
                      disabled={isActionLoading}
                      onClick={handleDelete}
                    >
                      {content.deleteLabel}
                    </button>
                  </div>
                )}
              </section>
            </div>

            <aside className="vehicle-form-page__sidebar">
              <div className="vehicle-form-page__summary-card reservation-detail-theme__summary-card">
                <h2>{reservation.vehicleName}</h2>
                <p className="hero-card__text">{statusLabel}</p>

                <div className="vehicle-form-page__summary-grid">
                  <div className="vehicle-form-page__summary-item">
                    <span>{content.durationLabel}</span>
                    <strong>{reservation.durationLabel}</strong>
                  </div>
                  <div className="vehicle-form-page__summary-item">
                    <span>{vehicleContent.reservationEstimatedTotalLabel}</span>
                    <strong>{reservationPriceLabel}</strong>
                  </div>
                  <div className="vehicle-form-page__summary-item">
                    <span>{content.pickupLabel}</span>
                    <strong>{formatReservationDateTime(reservation.pickupDatetime)}</strong>
                  </div>
                  <div className="vehicle-form-page__summary-item">
                    <span>{content.returnLabel}</span>
                    <strong>{formatReservationDateTime(reservation.returnDatetime)}</strong>
                  </div>
                </div>
              </div>

              {reservationMonths.length > 0 ? (
                <div className="vehicle-form-page__panel reservation-detail-theme__calendar-panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{content.detailCalendarTitle}</h2>
                  </div>

                  <div className="reservation-detail-theme__calendar-stack">
                    {reservationMonths.map((monthDate) => {
                      const monthDays = createCalendarDays(monthDate);

                      return (
                        <section
                          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                          className="reservation-detail-theme__mini-calendar"
                        >
                          <div className="reservation-detail-theme__mini-calendar-month">
                            {miniMonthFormatter.format(monthDate)}
                          </div>

                          <div className="reservation-detail-theme__mini-calendar-grid">
                            {miniWeekdayLabels.map((label) => (
                              <div
                                key={`${monthDate.getMonth()}-${label}`}
                                className="reservation-detail-theme__mini-calendar-weekday"
                              >
                                {label}
                              </div>
                            ))}

                            {monthDays.map((day) => {
                              const isActive = reservationTouchesDay(day, pickupDate, returnDate);
                              const isStart = isSameCalendarDay(day, pickupDate);
                              const isEnd = isSameCalendarDay(day, returnDate);

                              return (
                                <div
                                  key={day.toISOString()}
                                  className={
                                    "reservation-detail-theme__mini-calendar-day" +
                                    (isSameMonth(day, monthDate)
                                      ? ""
                                      : " reservation-detail-theme__mini-calendar-day--muted") +
                                    (isActive
                                      ? " reservation-detail-theme__mini-calendar-day--active"
                                      : "") +
                                    (isStart
                                      ? " reservation-detail-theme__mini-calendar-day--start"
                                      : "") +
                                    (isEnd
                                      ? " reservation-detail-theme__mini-calendar-day--end"
                                      : "")
                                  }
                                >
                                  {day.getDate()}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="vehicle-form-page__panel reservation-detail-theme__media-panel">
                <div className="vehicle-form-page__panel-header">
                  <h2>{content.vehicleLabel}</h2>
                </div>
                <div className="reservation-detail-theme__image-frame">
                  <img
                    src={reservation.vehiclePhotoUrl}
                    alt={reservation.vehicleName}
                    onError={handleImageFallback}
                  />
                </div>
              </div>

              <div className="vehicle-form-page__panel reservation-detail-theme__media-panel">
                <div className="vehicle-form-page__panel-header">
                  <h2>{content.licenseLabel}</h2>
                </div>
                {reservation.drivingLicensePhotoUrls?.length ? (
                  <div className="reservation-detail-theme__image-grid">
                    {reservation.drivingLicensePhotoUrls.map((drivingLicensePhotoUrl, index) => (
                      <button
                        key={drivingLicensePhotoUrl + "-" + index}
                        type="button"
                        className="reservation-detail-theme__image-button"
                        onClick={() => handleOpenLicenseViewer(index)}
                        aria-label={`${content.licenseLabel} ${index + 1}`}
                      >
                        <span className="reservation-detail-theme__image-frame">
                          <img
                            src={drivingLicensePhotoUrl}
                            alt={`${content.licenseLabel} ${index + 1}`}
                            onError={handleImageFallback}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="reservation-detail-theme__image-empty">-</div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {activeLicenseUrl ? (
        <div
          className="reservation-detail-theme__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={content.licenseViewerTitle}
          onClick={handleCloseLicenseViewer}
        >
          <div className="reservation-detail-theme__lightbox-dialog">
            <button
              type="button"
              className="reservation-detail-theme__lightbox-close"
              onClick={(event) => {
                event.stopPropagation();
                handleCloseLicenseViewer();
              }}
              aria-label={content.closeViewerLabel}
            >
              <span aria-hidden="true">×</span>
            </button>

            {reservation.drivingLicensePhotoUrls.length > 1 ? (
              <>
                <button
                  type="button"
                  className="reservation-detail-theme__lightbox-nav reservation-detail-theme__lightbox-nav--previous"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleShowPreviousLicense();
                  }}
                  aria-label={content.previousViewerLabel}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="reservation-detail-theme__lightbox-nav reservation-detail-theme__lightbox-nav--next"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleShowNextLicense();
                  }}
                  aria-label={content.nextViewerLabel}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            ) : null}

            <div className="reservation-detail-theme__lightbox-stage">
              <img
                src={activeLicenseUrl}
                alt={`${content.licenseLabel} ${activeLicenseIndex + 1}`}
                className="reservation-detail-theme__lightbox-image"
                onError={handleImageFallback}
                onClick={(event) => event.stopPropagation()}
              />
            </div>

            {reservation.drivingLicensePhotoUrls.length > 1 ? (
              <div className="reservation-detail-theme__lightbox-count">
                {activeLicenseIndex + 1} / {reservation.drivingLicensePhotoUrls.length}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default ReservationDetailPage;
