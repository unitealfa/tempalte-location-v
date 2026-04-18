import { useEffect, useMemo, useRef, useState } from "react";
import {
  createVehicleReservation,
  getCachedVehicleReservationAvailability,
  getVehicleReservationAvailability
} from "../services/reservationService";
import { hasCachedVehicleReservationAvailability } from "../services/reservationService";
import { extractAcceptedFilesFromDrop, isAcceptedMediaFile } from "../utils/dropFiles";
import { handleImageFallback } from "../utils/imageFallback";
import { openWhatsappOrCall } from "../utils/contactLinks";
import { calculateReservationPricing, getReservationRateLabel } from "../utils/reservationPricing";
import { formatVehicleName, formatVehiclePrice } from "../utils/vehicleFormatters";
import { formatReservationDateTime } from "../utils/reservationFormatters";

const MAX_DRIVING_LICENSE_FILES = 2;
const RESERVATION_DAY_START_TIME = "00:00";
const RESERVATION_DAY_END_TIME = "23:59";
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});
function getInitialFormValues() {
  return {
    fullName: "",
    email: "",
    phone: "",
    comment: "",
    pickupLocationType: "bureau",
    returnLocationType: "bureau",
    privacyPolicyAccepted: false
  };
}

function splitFullName(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return {
      firstName: "",
      lastName: ""
    };
  }

  const parts = normalized.split(" ");

  if (parts.length === 1) {
    return {
      firstName: normalized,
      lastName: normalized
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
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

function parseServerDateTime(value) {
  return new Date(String(value).replace(" ", "T"));
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildReservationStartDateTime(dateValue) {
  return dateValue ? `${dateValue}T${RESERVATION_DAY_START_TIME}` : "";
}

function buildReservationEndDateTime(dateValue) {
  return dateValue ? `${dateValue}T${RESERVATION_DAY_END_TIME}` : "";
}

function createDayStartDate(dateValue) {
  return new Date(buildReservationStartDateTime(dateValue));
}

function createDayEndDate(dateValue) {
  return new Date(buildReservationEndDateTime(dateValue));
}

function dayTouchesReservation(day, reservationRanges) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

  return reservationRanges.some(
    (range) => range.start.getTime() <= dayEnd.getTime() && range.end.getTime() >= dayStart.getTime()
  );
}

function isSameMonth(date, monthDate) {
  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
}

function ReservationCalendar({
  content,
  monthDate,
  onMonthChange,
  selectedStartDateValue,
  selectedEndDateValue,
  isDayAvailable,
  isDayReserved,
  isDayInRange,
  onDateSelect,
  isDisabled
}) {
  const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
  const firstAvailableMonth = useMemo(() => createMonthReference(new Date()), []);
  const weekdayLabels = useMemo(
    () => calendarDays.slice(0, 7).map((day) => WEEKDAY_FORMATTER.format(day)),
    [calendarDays]
  );
  const isPreviousMonthDisabled =
    isDisabled || createMonthReference(monthDate).getTime() <= firstAvailableMonth.getTime();

  return (
    <div className={`reservation-calendar${isDisabled ? " reservation-calendar--disabled" : ""}`}>
      <div className="reservation-calendar__toolbar">
        <button
          type="button"
          className="reservation-calendar__nav"
          onClick={() => {
            if (isPreviousMonthDisabled) {
              return;
            }

            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
            );
          }}
          disabled={isPreviousMonthDisabled}
        >
          {content.reservationMonthPreviousLabel}
        </button>

        <strong>{MONTH_FORMATTER.format(monthDate)}</strong>

        <button
          type="button"
          className="reservation-calendar__nav"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
            )
          }
          disabled={isDisabled}
        >
          {content.reservationMonthNextLabel}
        </button>
      </div>

      <div className="reservation-calendar__grid">
        {weekdayLabels.map((label) => (
          <span key={label} className="reservation-calendar__weekday">
            {label}
          </span>
        ))}

        {calendarDays.map((day) => {
          const dateValue = formatDateValue(day);
          const isAvailable = !isDisabled && isDayAvailable(day);
          const isReserved = typeof isDayReserved === "function" ? isDayReserved(day) : false;
          const isStart = selectedStartDateValue === dateValue;
          const isEnd = selectedEndDateValue === dateValue;
          const isInRange = typeof isDayInRange === "function" ? isDayInRange(day) : false;

          return (
            <button
              key={dateValue}
              type="button"
              className={`reservation-calendar__day${
                isSameMonth(day, monthDate) ? "" : " reservation-calendar__day--muted"
              }${isInRange ? " reservation-calendar__day--range" : ""}${
                isStart ? " reservation-calendar__day--range-start reservation-calendar__day--selected" : ""
              }${isEnd ? " reservation-calendar__day--range-end reservation-calendar__day--selected" : ""}${
                isReserved ? " reservation-calendar__day--reserved" : ""
              }${!isAvailable ? " reservation-calendar__day--unavailable" : ""}`}
              onClick={() => onDateSelect(dateValue)}
              disabled={!isAvailable}
            >
              <span>{day.getDate()}</span>
              {isReserved ? <span className="reservation-calendar__marker" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VehicleReservationForm({
  content,
  footerContent,
  vehicle,
  hideActionButtons = false,
  hideIntro = false
}) {
  const sectionRef = useRef(null);
  const drivingLicenseInputRef = useRef(null);
  const [formValues, setFormValues] = useState(getInitialFormValues);
  const [drivingLicensePhotos, setDrivingLicensePhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLicenseDragActive, setIsLicenseDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityErrorMessage, setAvailabilityErrorMessage] = useState("");
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(
    () => !hasCachedVehicleReservationAvailability(vehicle.id)
  );
  const [reservedSlots, setReservedSlots] = useState(
    () => getCachedVehicleReservationAvailability(vehicle.id)
  );
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [calendarMonthDate, setCalendarMonthDate] = useState(() =>
    createMonthReference(new Date())
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((previewUrl) => {
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [previewUrls]);

  useEffect(() => {
    let isActive = true;

    const loadAvailability = async () => {
      setIsAvailabilityLoading(() => !hasCachedVehicleReservationAvailability(vehicle.id));
      setAvailabilityErrorMessage("");

      try {
        const reservations = await getVehicleReservationAvailability(vehicle.id);

        if (!isActive) {
          return;
        }

        setReservedSlots(reservations);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setReservedSlots([]);
        setAvailabilityErrorMessage(
          error.message || "Impossible de charger les disponibilites."
        );
      } finally {
        if (isActive) {
          setIsAvailabilityLoading(false);
        }
      }
    };

    loadAvailability();
    setPickupDate("");
    setReturnDate("");
    setCalendarMonthDate(createMonthReference(new Date()));

    return () => {
      isActive = false;
    };
  }, [vehicle.id]);

  const whatsappNumber = useMemo(
    () =>
      footerContent?.whatsappNumber ||
      content.whatsappInternationalNumber ||
      content.whatsappNumber ||
      footerContent?.phoneValue ||
      "",
    [
      content.whatsappInternationalNumber,
      content.whatsappNumber,
      footerContent?.phoneValue,
      footerContent?.whatsappNumber
    ]
  );
  const drivingLicenseInputId = useMemo(
    () => `driving-license-photo-${vehicle.id}`,
    [vehicle.id]
  );

  const reservationRanges = useMemo(
    () =>
      reservedSlots
        .map((reservation) => ({
          start: parseServerDateTime(reservation.pickupDatetime),
          end: parseServerDateTime(reservation.returnDatetime)
        }))
        .sort((left, right) => left.start.getTime() - right.start.getTime()),
    [reservedSlots]
  );

  const todayStartDate = useMemo(() => {
    const nextDate = new Date();
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }, []);
  const pickupDateTime = useMemo(
    () => (pickupDate ? new Date(buildReservationStartDateTime(pickupDate)) : null),
    [pickupDate]
  );
  const returnDateTime = useMemo(
    () => (returnDate ? new Date(buildReservationEndDateTime(returnDate)) : null),
    [returnDate]
  );
  const pickupSummaryText =
    pickupDate
      ? formatReservationDateTime(buildReservationStartDateTime(pickupDate))
      : content.reservationPickupDatetimeLabel;
  const returnSummaryText =
    returnDate
      ? formatReservationDateTime(buildReservationEndDateTime(returnDate))
      : content.reservationReturnDatetimeLabel;
  const drivingLicenseSelectedLabel =
    drivingLicensePhotos.length > 0
      ? drivingLicensePhotos.map((file) => file.name).join(" • ")
      : content.reservationDrivingLicenseEmptyLabel;
  const livePricing = useMemo(
    () => calculateReservationPricing(vehicle, pickupDateTime, returnDateTime),
    [pickupDateTime, returnDateTime, vehicle]
  );
  const hasLivePricing = livePricing.billingDays > 0;
  const livePricingRateLabel = hasLivePricing
    ? getReservationRateLabel(livePricing.rateType, content)
    : "-";

  const isDateRangeAvailable = (startDateValue, endDateValue) => {
    if (!startDateValue || !endDateValue) {
      return false;
    }

    const rangeStart = createDayStartDate(startDateValue);
    const rangeEnd = createDayEndDate(endDateValue);

    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      return false;
    }

    return !reservationRanges.some(
      (range) => range.start.getTime() <= rangeEnd.getTime() && range.end.getTime() >= rangeStart.getTime()
    );
  };

  const isPickupDayAvailable = (day) => {
    const dateValue = formatDateValue(day);
    const dayStart = createDayStartDate(dateValue);

    if (dayStart.getTime() < todayStartDate.getTime()) {
      return false;
    }

    return isDateRangeAvailable(dateValue, dateValue);
  };

  const isReturnDayAvailable = (day) => {
    if (!pickupDate) {
      return false;
    }

    const dateValue = formatDateValue(day);
    const pickupStart = createDayStartDate(pickupDate);
    const candidateStart = createDayStartDate(dateValue);

    if (candidateStart.getTime() < pickupStart.getTime()) {
      return false;
    }

    return isDateRangeAvailable(pickupDate, dateValue);
  };

  const isReservedDay = (day) => dayTouchesReservation(day, reservationRanges);
  const isRangeDay = (day) => {
    if (!pickupDate || !returnDate) {
      return false;
    }

    const dateValue = formatDateValue(day);
    return dateValue >= pickupDate && dateValue <= returnDate;
  };

  const isCalendarDayAvailable = (day) => {
    const dateValue = formatDateValue(day);

    if (!pickupDate || returnDate) {
      return isPickupDayAvailable(day);
    }

    if (dateValue < pickupDate) {
      return isPickupDayAvailable(day);
    }

    return isDateRangeAvailable(pickupDate, dateValue);
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const applyDrivingLicensePhotos = (nextFiles) => {
    const selectedFiles = Array.from(nextFiles || []).filter(Boolean);
    const validFiles = selectedFiles
      .filter((file) => isAcceptedMediaFile(file, "image"))
      .slice(0, MAX_DRIVING_LICENSE_FILES);

    setSuccessMessage("");

    if (selectedFiles.length > 0 && validFiles.length === 0) {
      setErrorMessage(content.reservationDrivingLicenseInvalidMessage);
      return;
    }

    setErrorMessage("");
    setDrivingLicensePhotos(validFiles);
    setPreviewUrls((currentUrls) => {
      currentUrls.forEach((previewUrl) => {
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      return validFiles.map((file) => URL.createObjectURL(file));
    });
  };

  const handleDrivingLicensePhoto = (event) => {
    applyDrivingLicensePhotos(event.target.files);
    event.target.value = "";
  };

  const openDrivingLicensePicker = () => {
    drivingLicenseInputRef.current?.click();
  };

  const handleDrivingLicenseDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsLicenseDragActive(true);
  };

  const handleDrivingLicenseDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsLicenseDragActive(false);
  };

  const handleDrivingLicenseDrop = async (event) => {
    event.preventDefault();
    setIsLicenseDragActive(false);
    const droppedFiles = await extractAcceptedFilesFromDrop(event, {
      acceptPrefix: "image",
      maxFiles: 2
    });
    applyDrivingLicensePhotos(droppedFiles);
  };

  const scrollToForm = (event) => {
    event?.currentTarget?.blur();

    const target = sectionRef.current;

    if (!target || typeof window === "undefined") {
      return;
    }

    const stickyHeader = document.querySelector(".vehica-menu__wrapper");
    const headerOffset = Math.ceil(
      stickyHeader?.getBoundingClientRect().height || 100
    );
    const targetTop = Math.max(
      window.scrollY + target.getBoundingClientRect().top - headerOffset - 24,
      0
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    if (pickupDate && !isPickupDayAvailable(new Date(`${pickupDate}T00:00:00`))) {
      setPickupDate("");
      setReturnDate("");
      return;
    }

    if (returnDate && !isDateRangeAvailable(pickupDate, returnDate)) {
      setReturnDate("");
    }
  }, [pickupDate, returnDate, reservationRanges]);

  useEffect(() => {
    if (pickupDate) {
      setCalendarMonthDate(createMonthReference(new Date(`${pickupDate}T00:00:00`)));
    }
  }, [pickupDate]);

  const handleCalendarDateSelect = (dateValue) => {
    if (!pickupDate || returnDate) {
      setPickupDate(dateValue);
      setReturnDate("");
      setSuccessMessage("");
      return;
    }

    if (dateValue < pickupDate) {
      setPickupDate(dateValue);
      setReturnDate("");
      setSuccessMessage("");
      return;
    }

    if (!isDateRangeAvailable(pickupDate, dateValue)) {
      if (isDateRangeAvailable(dateValue, dateValue)) {
        setPickupDate(dateValue);
        setReturnDate("");
        setSuccessMessage("");
      }
      return;
    }

    setReturnDate(dateValue);
    setSuccessMessage("");
  };

  const isCommentRequired =
    formValues.pickupLocationType === "commentaire" ||
    formValues.returnLocationType === "commentaire";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const pickupDatetime = buildReservationStartDateTime(pickupDate);
      const returnDatetime = buildReservationEndDateTime(returnDate);

      if (!pickupDatetime || !returnDatetime) {
        throw new Error("Selectionnez une periode disponible.");
      }

      const parsedFullName = splitFullName(formValues.fullName);

      if (drivingLicensePhotos.length === 0) {
        throw new Error(
          content.reservationDrivingLicenseRequiredMessage ||
            "Ajoutez obligatoirement la photo du permis de conduire."
        );
      }

      await createVehicleReservation(vehicle.id, {
        firstName: parsedFullName.firstName,
        lastName: parsedFullName.lastName,
        email: formValues.email,
        phone: formValues.phone,
        comment: formValues.comment,
        pickupLocationType: formValues.pickupLocationType,
        returnLocationType: formValues.returnLocationType,
        privacyPolicyAccepted: formValues.privacyPolicyAccepted,
        pickupDatetime,
        returnDatetime,
        drivingLicensePhotos
      });

      setFormValues(getInitialFormValues());
      setDrivingLicensePhotos([]);
      setPickupDate("");
      setReturnDate("");
      setCalendarMonthDate(createMonthReference(new Date()));
      setPreviewUrls((currentUrls) => {
        currentUrls.forEach((previewUrl) => {
          if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
          }
        });

        return [];
      });
      setSuccessMessage(content.reservationSuccessMessage);
    } catch (error) {
      setErrorMessage(error.message || content.reservationErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {hideActionButtons ? null : (
        <div className="vehicle-reservation-actions">
          <button
            type="button"
            className="login-form__submit"
            onClick={scrollToForm}
          >
            {content.reserveFormLabel}
          </button>

          <a
            className="vehicle-detail__secondary-action vehicle-detail__secondary-action--link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              openWhatsappOrCall({
                phoneNumber: whatsappNumber,
                message: `Bonjour, je souhaite reserver ${formatVehicleName(vehicle)}.`
              });
            }}
          >
            {content.reserveWhatsappLabel}
          </a>
        </div>
      )}

      <section
        className="reservation-form-section"
        ref={sectionRef}
        id="contact"
        data-vehicle-reservation-form="true"
      >
        {hideIntro ? null : (
          <div className="reservation-form-section__hero">
            <p className="hero-card__eyebrow">{content.reservationSectionEyebrow}</p>
            <h2>{content.reservationSectionTitle}</h2>
            <p className="hero-card__text">{content.reservationSectionDescription}</p>
          </div>
        )}

        {isAvailabilityLoading ? (
          <p className="rentzo-detail-form__status">
            {content.reservationAvailabilityLoadingLabel}
          </p>
        ) : null}

        {!isAvailabilityLoading && availabilityErrorMessage ? (
          <p className="login-form__message login-form__message--error">
            {availabilityErrorMessage}
          </p>
        ) : null}

        <form className="reservation-form vehica-contact-form rentzo-detail-form rentzo-detail-form--source" onSubmit={handleSubmit}>
          <div className="clearfix">
            <div className="rentzo-detail-form__calendar-shell">
              <div className="rentzo-detail-form__calendar-summary">
                <div className="rentzo-detail-form__calendar-card">
                  <span>{content.reservationPickupGroupLabel}</span>
                  <strong>{pickupSummaryText}</strong>
                </div>

                <div className="rentzo-detail-form__calendar-card">
                  <span>{content.reservationReturnGroupLabel}</span>
                  <strong>
                    {pickupDateTime
                      ? returnSummaryText
                      : content.reservationSelectPickupFirstLabel}
                  </strong>
                </div>
              </div>

              <div className="rentzo-detail-form__calendar-fields">
                <div className="rentzo-detail-form__calendar-field">
                  <label>{content.pickupLabel}</label>
                  <span className="wpcf7-form-control-wrap">
                    <select
                      name="pickupLocationType"
                      value={formValues.pickupLocationType}
                      onChange={updateField}
                    >
                      {content.reservationPickupLocationOptions.map((option) => (
                        <option key={`pickup-location-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </div>

                <div className="rentzo-detail-form__calendar-field">
                  <label>{content.returnLabel}</label>
                  <span className="wpcf7-form-control-wrap">
                    <select
                      name="returnLocationType"
                      value={formValues.returnLocationType}
                      onChange={updateField}
                    >
                      {content.reservationPickupLocationOptions.map((option) => (
                        <option key={`return-location-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
              </div>

              <div className="rentzo-detail-form__datetime-panel rentzo-detail-form__datetime-panel--single">
                <ReservationCalendar
                  content={content}
                  monthDate={calendarMonthDate}
                  onMonthChange={setCalendarMonthDate}
                  selectedStartDateValue={pickupDate}
                  selectedEndDateValue={returnDate}
                  onDateSelect={handleCalendarDateSelect}
                  isDayAvailable={isCalendarDayAvailable}
                  isDayReserved={isReservedDay}
                  isDayInRange={isRangeDay}
                  isDisabled={isAvailabilityLoading}
                />
              </div>
            </div>

            <div
              className={
                "rentzo-detail-form__price-summary" +
                (hasLivePricing ? "" : " rentzo-detail-form__price-summary--pending")
              }
            >
              {hasLivePricing ? (
                <>
                  <div className="rentzo-detail-form__price-hero">
                    <span className="rentzo-detail-form__price-hero-label">
                      {content.reservationEstimatedTotalLabel}
                    </span>
                    <strong className="rentzo-detail-form__price-hero-value">
                      {formatVehiclePrice(livePricing.totalPrice)}
                    </strong>
                    <p className="rentzo-detail-form__price-hero-meta">
                      {livePricing.billingDays} jour{livePricing.billingDays > 1 ? "s" : ""} · {livePricingRateLabel} · {formatVehiclePrice(livePricing.ratePerDay)}{content.pricePerDaySuffix}
                    </p>
                  </div>

                  <div className="rentzo-detail-form__price-meta">
                    <div className="rentzo-detail-form__price-card">
                      <span>{content.reservationAppliedRateLabel}</span>
                      <strong>{livePricingRateLabel}</strong>
                      <small>
                        {formatVehiclePrice(livePricing.ratePerDay)}
                        {content.pricePerDaySuffix}
                      </small>
                    </div>

                    <div className="rentzo-detail-form__price-card">
                      <span>{content.reservationBilledDaysLabel}</span>
                      <strong>
                        {livePricing.billingDays} jour{livePricing.billingDays > 1 ? "s" : ""}
                      </strong>
                      <small>{content.reservationPricingTitle}</small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rentzo-detail-form__price-hero rentzo-detail-form__price-hero--pending">
                  <span className="rentzo-detail-form__price-hero-label">
                    {content.reservationPricingTitle}
                  </span>
                  <strong className="rentzo-detail-form__price-hero-value">
                    {content.reservationPricePendingLabel}
                  </strong>
                </div>
              )}
            </div>

            <p className="rentzo-detail-form__section-label">
              <label> </label>
              <br />
              <label>{content.reservationCustomerGroupLabel}</label>
            </p>

            <div className="vehica-1-fields rentzo-detail-form__customer-fields">
              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="text"
                      name="fullName"
                      value={formValues.fullName}
                      onChange={updateField}
                      placeholder={content.reservationFullNamePlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>

              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={updateField}
                      placeholder={content.reservationEmailPlaceholder}
                    />
                  </span>
                </p>
              </div>

              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="tel"
                      name="phone"
                      value={formValues.phone}
                      onChange={updateField}
                      placeholder={content.reservationPhonePlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>

            </div>

            <p className="rentzo-detail-form__section-label rentzo-detail-form__section-label--license">
              <label> </label>
              <br />
              <label>{content.reservationLicenseGroupLabel}</label>
              <br />
            </p>

            <div className="vehica-1-fields rentzo-detail-form__license-fields">
              <div className="vehica-1-fields__middle vehica-1-fields__middle--full">
                <div
                  className="rentzo-detail-form__license-upload"
                  onDragOver={handleDrivingLicenseDragOver}
                  onDragLeave={handleDrivingLicenseDragLeave}
                  onDrop={handleDrivingLicenseDrop}
                >
                  <p className="rentzo-detail-form__license-selected">
                    {drivingLicenseSelectedLabel}
                  </p>

                  <input
                    id={drivingLicenseInputId}
                    ref={drivingLicenseInputRef}
                    className="rentzo-detail-form__license-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDrivingLicensePhoto}
                  />

                  <button
                    type="button"
                    className={
                      "rentzo-detail-form__license-trigger" +
                      (isLicenseDragActive
                        ? " rentzo-detail-form__license-trigger--active"
                        : "")
                    }
                    onClick={openDrivingLicensePicker}
                  >
                    <span className="rentzo-detail-form__license-trigger-text">
                      {content.reservationDrivingLicensePlaceholder}
                    </span>
                    <span className="rentzo-detail-form__license-trigger-action">
                      {content.mediaSelectLabel}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {previewUrls.length > 0 ? (
              <div className="reservation-form__license-preview-grid">
                {previewUrls.map((previewUrl, index) => (
                  <div key={previewUrl + "-" + index} className="reservation-form__license-preview">
                    <img
                      src={previewUrl}
                      alt={`${content.reservationDrivingLicenseLabel} ${index + 1}`}
                      onError={handleImageFallback}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <p className="rentzo-detail-form__section-block rentzo-detail-form__section-block--comment">
              <label> </label>
              <br />
              <label>{content.reservationCommentGroupLabel}</label>
              <br />
              <span className="wpcf7-form-control-wrap">
                <textarea
                  name="comment"
                  value={formValues.comment}
                  onChange={updateField}
                  rows="4"
                  placeholder={content.reservationCommentPlaceholder}
                  required={isCommentRequired}
                />
              </span>
            </p>

            {errorMessage ? (
              <p className="login-form__message login-form__message--error">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <div className="reservation-form__success-card" role="status" aria-live="polite">
                <div className="reservation-form__success-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7L10.75 16.25L6 11.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="reservation-form__success-copy">
                  <strong>{successMessage}</strong>
                  <span>{content.reservationSuccessDetailMessage}</span>
                </div>
              </div>
            ) : null}

            <div className="detail-reservation-form__actions">
              <div className="detail-reservation-form__policy">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <span className="wpcf7-form-control wpcf7-acceptance">
                      <span className="wpcf7-list-item">
                        <label>
                          <input
                            type="checkbox"
                            name="privacyPolicyAccepted"
                            checked={formValues.privacyPolicyAccepted}
                            onChange={updateField}
                            required
                          />
                          <span className="wpcf7-list-item-label">
                            {content.reservationPrivacyLabel}
                          </span>
                        </label>
                      </span>
                    </span>
                  </span>
                </p>
              </div>

              <div className="detail-reservation-form__submit-wrap">
                <p>
                  <button
                    type="submit"
                    className="wpcf7-form-control wpcf7-submit detail-reservation-form__submit"
                    disabled={isSubmitting || isAvailabilityLoading}
                  >
                    {content.reservationSubmitLabel}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

export default VehicleReservationForm;
