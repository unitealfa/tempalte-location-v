import { useEffect, useMemo, useRef, useState } from "react";
import {
  hasCachedVehicleList,
  listVehicles,
  readCachedVehicleList
} from "../services/vehicleService";
import {
  createAdminReservation,
  getCachedAdminReservationById,
  getCachedAdminReservations,
  getAdminReservationById,
  hasCachedAdminReservationById,
  hasCachedAdminReservations,
  listAdminReservations,
  updateAdminReservation
} from "../services/reservationService";
import { extractAcceptedFilesFromDrop, isAcceptedMediaFile } from "../utils/dropFiles";
import { formatReservationDateTime } from "../utils/reservationFormatters";
import { calculateReservationPricing, getReservationRateLabel } from "../utils/reservationPricing";
import { formatVehicleName, formatVehiclePrice } from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

const RESERVATION_DAY_START_TIME = "00:00:00";
const RESERVATION_DAY_END_TIME = "23:59:59";
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
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

function isSameMonth(date, monthDate) {
  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
}

function dayTouchesReservation(day, reservationRanges) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

  return reservationRanges.some(
    (range) => range.start.getTime() <= dayEnd.getTime() && range.end.getTime() >= dayStart.getTime()
  );
}

function buildInitialFormValues(initialVehicleId = "") {
  return {
    vehicleId: initialVehicleId ? String(initialVehicleId) : "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
    pickupLocationType: "bureau",
    returnLocationType: "bureau",
    pickupDatetime: "",
    returnDatetime: "",
    totalPrice: "",
    privacyPolicyAccepted: true
  };
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(String(value).replace(" ", "T"));
  if (isNaN(date.getTime())) {
    return "";
  }

  return String(value).replace(" ", "T").slice(0, 16);
}

function mapReservationToFormValues(reservation) {
  return {
    vehicleId: String(reservation.vehicleId || ""),
    firstName: reservation.firstName || "",
    lastName: reservation.lastName || "",
    email: reservation.email || "",
    phone: reservation.phone || "",
    comment: reservation.comment || "",
    pickupLocationType: reservation.pickupLocationType || "bureau",
    returnLocationType: reservation.returnLocationType || "bureau",
    pickupDatetime: toDateTimeLocalValue(reservation.pickupDatetime),
    returnDatetime: toDateTimeLocalValue(reservation.returnDatetime),
    totalPrice:
      reservation.totalPrice === null || reservation.totalPrice === undefined
        ? ""
        : String(reservation.totalPrice),
    privacyPolicyAccepted: Boolean(reservation.privacyPolicyAccepted)
  };
}

function formatDurationLabel(pickupDatetime, returnDatetime) {
  const pickupTime = new Date(pickupDatetime).getTime();
  const returnTime = new Date(returnDatetime).getTime();

  if (Number.isNaN(pickupTime) || Number.isNaN(returnTime) || returnTime <= pickupTime) {
    return "";
  }

  const durationMs = returnTime - pickupTime;
  const totalHours = Math.ceil(durationMs / (1000 * 60 * 60));

  if (totalHours < 24) {
    return `${totalHours} heure${totalHours > 1 ? "s" : ""}`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (remainingHours === 0) {
    return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  }

  return `${totalDays} jour${totalDays > 1 ? "s" : ""} ${remainingHours} heure${remainingHours > 1 ? "s" : ""}`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  if (isNaN(date.getTime())) return null;
  return date;
}

function getDatePart(value) {
  const normalizedValue = toDateTimeLocalValue(value);
  return normalizedValue ? normalizedValue.slice(0, 10) : "";
}

function reservationsOverlap(startA, endA, startB, endB) {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

function AdminAvailabilityCalendar({
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
    <div className={`reservation-calendar reservation-calendar--admin${isDisabled ? " reservation-calendar--disabled" : ""}`}>
      <div className="reservation-calendar__toolbar">
        <button
          type="button"
          className="reservation-calendar__nav"
          onClick={() => {
            if (isPreviousMonthDisabled) {
              return;
            }

            onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
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
            onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
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

function AdminReservationFormPage({
  content,
  vehicleContent,
  mode,
  reservationId,
  initialVehicleId,
  onBackClick,
  onSaved
}) {
  const cachedVehicles = readCachedVehicleList({ adminView: true });
  const cachedAcceptedReservations = getCachedAdminReservations("accepted");
  const cachedReservation =
    mode === "edit" && reservationId ? getCachedAdminReservationById(reservationId) : null;
  const hasBootstrappedCache =
    hasCachedVehicleList({ adminView: true }) &&
    hasCachedAdminReservations("accepted") &&
    (mode === "edit" ? hasCachedAdminReservationById(reservationId) : true);
  const [vehicles, setVehicles] = useState(() => cachedVehicles);
  const [acceptedReservations, setAcceptedReservations] = useState(() => cachedAcceptedReservations);
  const [currentReservation, setCurrentReservation] = useState(() => cachedReservation || null);
  const [formValues, setFormValues] = useState(() =>
    cachedReservation ? mapReservationToFormValues(cachedReservation) : buildInitialFormValues(initialVehicleId)
  );
  const [drivingLicensePhotos, setDrivingLicensePhotos] = useState([]);
  const [licensePreviewUrls, setLicensePreviewUrls] = useState(() =>
    cachedReservation?.drivingLicensePhotoUrls ||
    (cachedReservation?.drivingLicensePhotoUrl ? [cachedReservation.drivingLicensePhotoUrl] : [])
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !hasBootstrappedCache);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLicenseDragActive, setIsLicenseDragActive] = useState(false);
  const [isManualPriceEdited, setIsManualPriceEdited] = useState(() =>
    Boolean(cachedReservation?.priceManualOverride)
  );
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => createMonthReference(new Date()));
  const drivingLicenseInputRef = useRef(null);

  useEffect(() => {
    const body = document.body;
    const documentElement = document.documentElement;

    body.classList.add("reservation-admin-page-lock");
    documentElement.classList.add("reservation-admin-page-lock");

    return () => {
      body.classList.remove("reservation-admin-page-lock");
      documentElement.classList.remove("reservation-admin-page-lock");
    };
  }, []);

  useEffect(() => {
    return () => {
      licensePreviewUrls.forEach((previewUrl) => {
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [licensePreviewUrls]);

  useEffect(() => {
    let isActive = true;

    const loadFormData = async () => {
      setIsLoading(
        () =>
          !hasCachedVehicleList({ adminView: true }) ||
          !hasCachedAdminReservations("accepted") ||
          (mode === "edit" ? !hasCachedAdminReservationById(reservationId) : false)
      );
      setErrorMessage("");

      try {
        const [nextVehicles, nextAcceptedReservations, nextReservation] =
          await Promise.all([
            listVehicles({ adminView: true }),
            listAdminReservations({ scope: "accepted" }),
            mode === "edit" && reservationId
              ? getAdminReservationById(reservationId)
              : Promise.resolve(null)
          ]);

        if (!isActive) {
          return;
        }

        setVehicles(nextVehicles);
        setAcceptedReservations(nextAcceptedReservations);
        setCurrentReservation(nextReservation);
        setDrivingLicensePhotos([]);

        if (nextReservation) {
          setFormValues(mapReservationToFormValues(nextReservation));
          setLicensePreviewUrls(nextReservation.drivingLicensePhotoUrls || (nextReservation.drivingLicensePhotoUrl ? [nextReservation.drivingLicensePhotoUrl] : []));
          setIsManualPriceEdited(Boolean(nextReservation.priceManualOverride));
        } else {
          setFormValues(buildInitialFormValues(initialVehicleId));
          setLicensePreviewUrls([]);
          setIsManualPriceEdited(false);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.formLoadErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadFormData();

    return () => {
      isActive = false;
    };
  }, [content.formLoadErrorMessage, initialVehicleId, mode, reservationId]);

  const handleChange = (event) => {
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
      .slice(0, 2);

    if (selectedFiles.length > 0 && validFiles.length === 0) {
      setErrorMessage(content.formDrivingLicenseInvalidMessage);
      return;
    }

    setErrorMessage("");
    setDrivingLicensePhotos(validFiles);
    setLicensePreviewUrls((currentUrls) => {
      currentUrls.forEach((previewUrl) => {
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      if (validFiles.length === 0) {
        return currentReservation?.drivingLicensePhotoUrls || (currentReservation?.drivingLicensePhotoUrl ? [currentReservation.drivingLicensePhotoUrl] : []);
      }

      return validFiles.map((file) => URL.createObjectURL(file));
    });
  };

  const handleDrivingLicensePhotoChange = (event) => {
    applyDrivingLicensePhotos(event.target.files);
    event.target.value = "";
  };

  const openDrivingLicensePicker = () => {
    drivingLicenseInputRef.current?.click();
  };

  const openNativePicker = (inputRef) => {
    const input = inputRef.current;

    if (!input || input.disabled) {
      return;
    }

    input.focus({ preventScroll: true });

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch (error) {
        // Ignore browsers that block showPicker outside a trusted click path.
      }
    }

    input.click();
  };

  const handlePickerFieldClick = (inputRef, event) => {
    const target = event.target;

    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "OPTION")
    ) {
      return;
    }

    openNativePicker(inputRef);
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

  const selectedDurationLabel = useMemo(
    () =>
      formatDurationLabel(
        formValues.pickupDatetime,
        formValues.returnDatetime
      ),
    [formValues.pickupDatetime, formValues.returnDatetime]
  );

  const isVehicleAvailableForSelection = (vehicle) => {
    if (!vehicle) {
      return false;
    }

    if (
      vehicle.availabilityStatus === "maintenance" &&
      String(vehicle.id) !== String(formValues.vehicleId)
    ) {
      return false;
    }

    if (!formValues.pickupDatetime || !formValues.returnDatetime) {
      return vehicle.availabilityStatus !== "maintenance";
    }

    const pickupDatetime = new Date(formValues.pickupDatetime);
    const returnDatetime = new Date(formValues.returnDatetime);

    if (
      Number.isNaN(pickupDatetime.getTime()) ||
      Number.isNaN(returnDatetime.getTime()) ||
      returnDatetime.getTime() <= pickupDatetime.getTime()
    ) {
      return vehicle.availabilityStatus !== "maintenance";
    }

    const hasOverlap = acceptedReservations.some((reservation) => {
      if (reservation.id === currentReservation?.id) {
        return false;
      }

      if (reservation.vehicleId !== vehicle.id) {
        return false;
      }

      return reservationsOverlap(
        pickupDatetime,
        returnDatetime,
        toDate(reservation.pickupDatetime),
        toDate(reservation.returnDatetime)
      );
    });

    return !hasOverlap;
  };

  const selectableVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.availabilityStatus !== "maintenance" ||
          String(vehicle.id) === String(formValues.vehicleId)
      ),
    [formValues.vehicleId, vehicles]
  );

  const selectedVehicle = useMemo(
    () =>
      vehicles.find((vehicle) => String(vehicle.id) === String(formValues.vehicleId)) ||
      null,
    [formValues.vehicleId, vehicles]
  );
  const calculatedPricing = useMemo(
    () =>
      calculateReservationPricing(
        selectedVehicle,
        formValues.pickupDatetime,
        formValues.returnDatetime
      ),
    [formValues.pickupDatetime, formValues.returnDatetime, selectedVehicle]
  );

  const hasVehicleConflict =
    Boolean(selectedVehicle) &&
    !isVehicleAvailableForSelection(selectedVehicle);
  const pageTitle = mode === "edit" ? content.editTitle : content.createTitle;
  const pageDescription =
    mode === "edit" ? content.editDescription : content.createDescription;
  const selectedVehicleName = selectedVehicle
    ? formatVehicleName(selectedVehicle)
    : "-";
  const statusSummaryLabel =
    mode === "edit" && currentReservation?.status === "pending"
      ? content.statusPendingLabel
      : content.statusAcceptedLabel;
  const drivingLicenseInputId = useMemo(
    () => `admin-reservation-driving-license-${reservationId || "new"}`,
    [reservationId]
  );
  const licenseSelectedLabel =
    drivingLicensePhotos.length > 0
      ? drivingLicensePhotos.map((file) => file.name).join(" • ")
      : licensePreviewUrls.length > 0
        ? `${licensePreviewUrls.length} image${licensePreviewUrls.length > 1 ? "s" : ""}`
        : vehicleContent.reservationDrivingLicenseEmptyLabel;
  const licenseSummaryLabel =
    licensePreviewUrls.length > 0
      ? `${content.licenseLabel} (${licensePreviewUrls.length})`
      : content.formDrivingLicenseOptionalLabel;
  const pickupDateValue = getDatePart(formValues.pickupDatetime);
  const returnDateValue = getDatePart(formValues.returnDatetime);
  const selectedVehicleReservations = useMemo(
    () =>
      acceptedReservations
        .filter(
          (reservation) =>
            String(reservation.vehicleId) === String(formValues.vehicleId) &&
            reservation.id !== currentReservation?.id
        )
        .sort(
          (left, right) => {
            const leftTime = toDate(left.pickupDatetime)?.getTime() || 0;
            const rightTime = toDate(right.pickupDatetime)?.getTime() || 0;
            return leftTime - rightTime;
          }
        ),
    [acceptedReservations, currentReservation?.id, formValues.vehicleId]
  );
  const reservationRanges = useMemo(
    () =>
      selectedVehicleReservations
        .map((reservation) => {
          const start = toDate(reservation.pickupDatetime);
          const end = toDate(reservation.returnDatetime);
          if (!start || !end) return null;
          return { start, end };
        })
        .filter(Boolean),
    [selectedVehicleReservations]
  );
  const todayStartDate = useMemo(() => {
    const nextDate = new Date();
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }, []);
  const pickupDateTime = useMemo(
    () => (pickupDateValue ? createDayStartDate(pickupDateValue) : null),
    [pickupDateValue]
  );
  const returnDateTime = useMemo(
    () => (returnDateValue ? createDayEndDate(returnDateValue) : null),
    [returnDateValue]
  );
  const pickupSummaryLabel = formValues.pickupDatetime
    ? formatReservationDateTime(formValues.pickupDatetime)
    : vehicleContent.reservationPickupDatetimeLabel;
  const returnSummaryLabel = formValues.returnDatetime
    ? formatReservationDateTime(formValues.returnDatetime)
    : vehicleContent.reservationReturnDatetimeLabel;
  const selectedVehicleAvailabilityMessage = selectedVehicle
    ? vehicleContent.reservationAvailabilityDescription
    : vehicleContent.reservationAvailabilitySelectVehicleLabel;

  const isDateRangeAvailable = (startDateValue, endDateValue) => {
    if (!selectedVehicle || !startDateValue || !endDateValue) {
      return false;
    }

    const rangeStart = createDayStartDate(startDateValue);
    const rangeEnd = createDayEndDate(endDateValue);

    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      return false;
    }

    if (rangeStart.getTime() < todayStartDate.getTime()) {
      return false;
    }

    return !reservationRanges.some(
      (range) => range.start.getTime() <= rangeEnd.getTime() && range.end.getTime() >= rangeStart.getTime()
    );
  };

  const isPickupDayAvailable = (day) => {
    if (!selectedVehicle) {
      return false;
    }

    const dateValue = formatDateValue(day);
    const dayStart = createDayStartDate(dateValue);

    if (dayStart.getTime() < todayStartDate.getTime()) {
      return false;
    }

    return isDateRangeAvailable(dateValue, dateValue);
  };

  const isCalendarDayAvailable = (day) => {
    if (!selectedVehicle) {
      return false;
    }

    const dateValue = formatDateValue(day);

    if (!pickupDateValue || returnDateValue) {
      return isPickupDayAvailable(day);
    }

    if (dateValue < pickupDateValue) {
      return isPickupDayAvailable(day);
    }

    return isDateRangeAvailable(pickupDateValue, dateValue);
  };

  const isReservedDay = (day) => dayTouchesReservation(day, reservationRanges);
  const isRangeDay = (day) => {
    if (!pickupDateValue || !returnDateValue) {
      return false;
    }

    const dateValue = formatDateValue(day);
    return dateValue >= pickupDateValue && dateValue <= returnDateValue;
  };

  const handleCalendarDateSelect = (dateValue) => {
    if (!selectedVehicle) {
      return;
    }

    if (!pickupDateValue || returnDateValue) {
      setFormValues((currentValues) => ({
        ...currentValues,
        pickupDatetime: buildReservationStartDateTime(dateValue),
        returnDatetime: ""
      }));
      return;
    }

    if (dateValue < pickupDateValue) {
      setFormValues((currentValues) => ({
        ...currentValues,
        pickupDatetime: buildReservationStartDateTime(dateValue),
        returnDatetime: ""
      }));
      return;
    }

    if (!isDateRangeAvailable(pickupDateValue, dateValue)) {
      if (isDateRangeAvailable(dateValue, dateValue)) {
        setFormValues((currentValues) => ({
          ...currentValues,
          pickupDatetime: buildReservationStartDateTime(dateValue),
          returnDatetime: ""
        }));
      }
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      returnDatetime: buildReservationEndDateTime(dateValue)
    }));
  };
  const appliedRateLabel = calculatedPricing.billingDays
    ? getReservationRateLabel(calculatedPricing.rateType, vehicleContent)
    : "-";
  const appliedRateValue = calculatedPricing.billingDays
    ? `${formatVehiclePrice(calculatedPricing.ratePerDay)}${vehicleContent.pricePerDaySuffix}`
    : vehicleContent.reservationPricePendingLabel;
  const effectiveTotalPrice =
    formValues.totalPrice !== ""
      ? formValues.totalPrice
      : calculatedPricing.billingDays
        ? calculatedPricing.totalPrice
        : null;
  const displayedTotalPrice =
    effectiveTotalPrice === null ? "-" : formatVehiclePrice(effectiveTotalPrice);
  const priceModeLabel = isManualPriceEdited && formValues.totalPrice !== ""
    ? vehicleContent.reservationPriceModeManualLabel
    : vehicleContent.reservationPriceModeAutomaticLabel;
  const hasPricingInputsChangedFromCurrent = currentReservation
    ? String(currentReservation.vehicleId || "") !== String(formValues.vehicleId || "") ||
      toDateTimeLocalValue(currentReservation.pickupDatetime) !== toDateTimeLocalValue(formValues.pickupDatetime) ||
      toDateTimeLocalValue(currentReservation.returnDatetime) !== toDateTimeLocalValue(formValues.returnDatetime)
    : true;

  const isCommentRequired =
    formValues.pickupLocationType === "commentaire" ||
    formValues.returnLocationType === "commentaire";

  useEffect(() => {
    if (pickupDateValue) {
      setCalendarMonthDate(createMonthReference(new Date(`${pickupDateValue}T00:00:00`)));
    }
  }, [pickupDateValue]);

  useEffect(() => {
    if (!pickupDateValue) {
      if (returnDateValue) {
        setFormValues((currentValues) => ({
          ...currentValues,
          returnDatetime: ""
        }));
      }
      return;
    }

    if (!isPickupDayAvailable(new Date(`${pickupDateValue}T00:00:00`))) {
      setFormValues((currentValues) => ({
        ...currentValues,
        pickupDatetime: "",
        returnDatetime: ""
      }));
      return;
    }

    if (returnDateValue && !isDateRangeAvailable(pickupDateValue, returnDateValue)) {
      setFormValues((currentValues) => ({
        ...currentValues,
        returnDatetime: ""
      }));
    }
  }, [pickupDateValue, reservationRanges, returnDateValue, selectedVehicle]);

  useEffect(() => {
    if (!calculatedPricing.billingDays) {
      if (!isManualPriceEdited) {
        setFormValues((currentValues) =>
          currentValues.totalPrice === ""
            ? currentValues
            : {
                ...currentValues,
                totalPrice: ""
              }
        );
      }

      return;
    }

    if (isManualPriceEdited) {
      return;
    }

    if (mode === "edit" && !hasPricingInputsChangedFromCurrent) {
      return;
    }

    const nextAutoPrice = calculatedPricing.totalPrice.toFixed(2);
    setFormValues((currentValues) =>
      currentValues.totalPrice === nextAutoPrice
        ? currentValues
        : {
            ...currentValues,
            totalPrice: nextAutoPrice
          }
    );
  }, [
    calculatedPricing,
    hasPricingInputsChangedFromCurrent,
    isManualPriceEdited,
    mode
  ]);

  const handleTotalPriceChange = (event) => {
    setIsManualPriceEdited(true);
    setFormValues((currentValues) => ({
      ...currentValues,
      totalPrice: event.target.value
    }));
  };

  const resetTotalPriceToAutomatic = () => {
    setIsManualPriceEdited(false);

    if (!calculatedPricing.billingDays) {
      setFormValues((currentValues) => ({
        ...currentValues,
        totalPrice: ""
      }));
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      totalPrice: calculatedPricing.totalPrice.toFixed(2)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (!formValues.vehicleId) {
        throw new Error("Selectionnez un vehicule.");
      }

      const payload = {
        ...formValues,
        drivingLicensePhotos
      };

      const reservation =
        mode === "edit"
          ? await updateAdminReservation(reservationId, payload)
          : await createAdminReservation(payload);

      onSaved(reservation);
    } catch (error) {
      setErrorMessage(error.message || content.formSaveErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="vehicle-form-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du formulaire...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="vehicle-form-page reservation-admin-page">
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
            <h1>{pageTitle}</h1>
            <p className="hero-card__text">{pageDescription}</p>
          </div>
        </div>
      </section>

      <section className="vehicle-form-page__body">
        <div className="vehicle-form-page__container">
          <form
            className="vehicle-form reservation-admin-form vehica-contact-form"
            onSubmit={handleSubmit}
          >
            <div className="vehicle-form-page__layout">
              <div className="vehicle-form-page__main">
                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{content.formVehicleLabel}</h2>
                  </div>

                  <div className="reservation-admin-form__meta-grid">
                    <label className="login-form__field">
                      <span>{content.formVehicleLabel}</span>
                      <select
                        name="vehicleId"
                        value={formValues.vehicleId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">{content.formVehiclePlaceholder}</option>
                        {selectableVehicles.map((vehicle) => {
                          const isAvailable = isVehicleAvailableForSelection(vehicle);

                          return (
                            <option
                              key={vehicle.id}
                              value={vehicle.id}
                              disabled={
                                !isAvailable &&
                                String(vehicle.id) !== String(formValues.vehicleId)
                              }
                            >
                              {formatVehicleName(vehicle)}
                              {!isAvailable
                                ? ` (${content.formVehicleUnavailableSuffix})`
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <div className="reservation-admin-form__helper">
                      <span>{content.formDurationLiveLabel}</span>
                      <strong>{selectedDurationLabel || "-"}</strong>
                    </div>
                  </div>

                  {hasVehicleConflict ? (
                    <p className="login-form__message login-form__message--error">
                      {content.formVehicleConflictMessage}
                    </p>
                  ) : null}
                </section>

                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{content.pickupLabel} / {content.returnLabel}</h2>
                  </div>

                  <div className="reservation-admin-form__availability-header">
                    <div>
                      <h3>{vehicleContent.reservationAvailabilityTitle}</h3>
                      <p>{selectedVehicleAvailabilityMessage}</p>
                    </div>

                    <div className="reservation-availability__legend">
                      <span className="reservation-availability__legend-item">
                        <span className="reservation-availability__dot reservation-availability__dot--available" />
                        {vehicleContent.reservationAvailableLegendLabel}
                      </span>
                      <span className="reservation-availability__legend-item">
                        <span className="reservation-availability__dot reservation-availability__dot--reserved" />
                        {vehicleContent.reservationReservedLegendLabel}
                      </span>
                      <span className="reservation-availability__legend-item">
                        <span className="reservation-availability__dot reservation-availability__dot--selected" />
                        {vehicleContent.reservationSelectedLegendLabel}
                      </span>
                      <span className="reservation-availability__legend-item">
                        <span className="reservation-availability__dot reservation-availability__dot--unavailable" />
                        {vehicleContent.reservationUnavailableLegendLabel}
                      </span>
                    </div>
                  </div>

                  <div className="reservation-admin-form__calendar-summary">
                    <div className="reservation-admin-form__calendar-summary-card">
                      <span>{vehicleContent.reservationPickupGroupLabel}</span>
                      <strong>{pickupSummaryLabel}</strong>
                    </div>

                    <div className="reservation-admin-form__calendar-summary-card">
                      <span>{vehicleContent.reservationReturnGroupLabel}</span>
                      <strong>
                        {pickupDateTime
                          ? returnSummaryLabel
                          : vehicleContent.reservationSelectPickupFirstLabel}
                      </strong>
                    </div>
                  </div>

                  <div className="reservation-admin-form__datetime-layout reservation-admin-form__datetime-layout--single">
                    <div className="reservation-admin-form__datetime-card reservation-admin-form__datetime-card--full">
                      <div className="reservation-admin-form__datetime-head reservation-admin-form__datetime-head--stack">
                        <div>
                          <p className="reservation-admin-form__datetime-title">
                            {content.pickupLabel} / {content.returnLabel}
                          </p>
                          <p className="reservation-admin-form__calendar-current">
                            {pickupDateTime
                              ? returnDateValue
                                ? `${pickupSummaryLabel} - ${returnSummaryLabel}`
                                : `${pickupSummaryLabel} - ${vehicleContent.reservationReturnDatetimeLabel}`
                              : vehicleContent.reservationSelectPickupFirstLabel}
                          </p>
                        </div>
                      </div>

                      <AdminAvailabilityCalendar
                        content={vehicleContent}
                        monthDate={calendarMonthDate}
                        onMonthChange={setCalendarMonthDate}
                        selectedStartDateValue={pickupDateValue}
                        selectedEndDateValue={returnDateValue}
                        onDateSelect={handleCalendarDateSelect}
                        isDayAvailable={isCalendarDayAvailable}
                        isDayReserved={isReservedDay}
                        isDayInRange={isRangeDay}
                        isDisabled={!selectedVehicle}
                      />
                    </div>
                  </div>

                  <div className="reservation-admin-form__datetime-grid reservation-admin-form__datetime-grid--locations">
                    <label className="login-form__field">
                      <span>{content.pickupLabel}</span>
                      <select
                        name="pickupLocationType"
                        value={formValues.pickupLocationType}
                        onChange={handleChange}
                      >
                        {vehicleContent.reservationPickupLocationOptions.map((option) => (
                          <option key={`pickup-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="login-form__field">
                      <span>{content.returnLabel}</span>
                      <select
                        name="returnLocationType"
                        value={formValues.returnLocationType}
                        onChange={handleChange}
                      >
                        {vehicleContent.reservationPickupLocationOptions.map((option) => (
                          <option key={`return-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{vehicleContent.reservationPricingTitle}</h2>
                  </div>

                  <div className="reservation-admin-form__pricing-shell">
                    <div className="reservation-admin-form__pricing-hero">
                      <span className="reservation-admin-form__pricing-hero-label">
                        {vehicleContent.reservationAdminTotalPriceLabel}
                      </span>
                      <strong className="reservation-admin-form__pricing-hero-value">
                        {displayedTotalPrice}
                      </strong>
                      <p className="reservation-admin-form__pricing-hero-meta">
                        {calculatedPricing.billingDays
                          ? `${calculatedPricing.billingDays} jour${calculatedPricing.billingDays > 1 ? "s" : ""} · ${appliedRateLabel} · ${appliedRateValue}`
                          : vehicleContent.reservationPricePendingLabel}
                      </p>
                    </div>

                    <div className="reservation-admin-form__pricing-grid">
                      <div className="reservation-admin-form__pricing-card">
                        <span>{vehicleContent.reservationAppliedRateLabel}</span>
                        <strong>{appliedRateLabel}</strong>
                        <small>{appliedRateValue}</small>
                      </div>

                      <div className="reservation-admin-form__pricing-card reservation-admin-form__pricing-card--secondary">
                        <span>{vehicleContent.reservationBilledDaysLabel}</span>
                        <strong>
                          {calculatedPricing.billingDays
                            ? `${calculatedPricing.billingDays} jour${calculatedPricing.billingDays > 1 ? "s" : ""}`
                            : "-"}
                        </strong>
                        <small>{priceModeLabel}</small>
                      </div>
                    </div>

                    <div className="reservation-admin-form__pricing-actions">
                      <label className="login-form__field reservation-admin-form__price-field">
                        <span>{vehicleContent.reservationAdminTotalPriceLabel}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={formValues.totalPrice}
                          onChange={handleTotalPriceChange}
                          placeholder="0.00"
                        />
                      </label>

                      <div className="reservation-admin-form__pricing-side">
                        <div className="reservation-admin-form__helper reservation-admin-form__helper--pricing">
                          <span>{vehicleContent.reservationAdminPriceHelpLabel}</span>
                          <strong>{priceModeLabel}</strong>
                        </div>

                        <button
                          type="button"
                          className="reservation-admin-form__recalculate"
                          onClick={resetTotalPriceToAutomatic}
                        >
                          {vehicleContent.reservationAdminRecalculatePriceLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{vehicleContent.reservationCustomerGroupLabel}</h2>
                  </div>

                  <div className="reservation-form__grid vehicle-form__grid">
                    <label className="login-form__field">
                      <span>{vehicleContent.reservationLastNameLabel}</span>
                      <input
                        type="text"
                        name="lastName"
                        value={formValues.lastName}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{vehicleContent.reservationFirstNameLabel}</span>
                      <input
                        type="text"
                        name="firstName"
                        value={formValues.firstName}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.emailOptionalLabel}</span>
                      <input
                        type="email"
                        name="email"
                        value={formValues.email}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.phoneLabel}</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formValues.phone}
                        onChange={handleChange}
                        required
                      />
                    </label>
                  </div>
                </section>

                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{vehicleContent.reservationCommentGroupLabel}</h2>
                  </div>

                  <label className="login-form__field">
                    <span>{content.commentLabel}</span>
                    <textarea
                      name="comment"
                      value={formValues.comment}
                      onChange={handleChange}
                      rows="4"
                      required={isCommentRequired}
                    />
                  </label>

                  <div
                    className="reservation-admin-form__license-upload"
                    onDragOver={handleDrivingLicenseDragOver}
                    onDragLeave={handleDrivingLicenseDragLeave}
                    onDrop={handleDrivingLicenseDrop}
                  >
                    <p className="reservation-admin-form__license-selected">
                      {licenseSelectedLabel}
                    </p>

                    <input
                      id={drivingLicenseInputId}
                      ref={drivingLicenseInputRef}
                      className="reservation-admin-form__license-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDrivingLicensePhotoChange}
                    />

                    <button
                      type="button"
                      className={
                        "reservation-admin-form__license-trigger" +
                        (isLicenseDragActive
                          ? " reservation-admin-form__license-trigger--active"
                          : "")
                      }
                      onClick={openDrivingLicensePicker}
                    >
                      <span>
                        {mode === "edit"
                          ? content.formDrivingLicenseReplaceLabel
                          : content.formDrivingLicenseOptionalLabel}
                      </span>
                      <strong>{vehicleContent.mediaSelectLabel}</strong>
                    </button>
                  </div>

                  {licensePreviewUrls.length > 0 ? (
                    <div className="reservation-admin-form__license-card">
                      <strong>
                        {mode === "edit"
                          ? content.formCurrentLicenseLabel
                          : content.licenseLabel}
                      </strong>
                      <div className="reservation-admin-form__license-grid">
                        {licensePreviewUrls.map((licensePreviewUrl, index) => (
                          <img
                            key={licensePreviewUrl + "-" + index}
                            src={licensePreviewUrl}
                            alt={`${content.licenseLabel} ${index + 1}`}
                            onError={handleImageFallback}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="reservation-form__checkbox reservation-admin-form__checkbox">
                    <input
                      type="checkbox"
                      name="privacyPolicyAccepted"
                      checked={formValues.privacyPolicyAccepted}
                      onChange={handleChange}
                      required
                    />
                    <span>{vehicleContent.reservationPrivacyLabel}</span>
                  </label>

                  {currentReservation ? (
                    <div className="reservation-admin-form__helper reservation-admin-form__helper--secondary">
                      <span>{content.createdAtLabel}</span>
                      <strong>{formatReservationDateTime(currentReservation.createdAt)}</strong>
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <p className="login-form__message login-form__message--error">
                      {errorMessage}
                    </p>
                  ) : null}

                  <div className="vehicle-form-page__submit-row reservation-admin-form__submit-row">
                    <button
                      type="submit"
                      className="login-form__submit vehicle-form-page__submit reservation-admin-form__submit"
                      disabled={isSubmitting || hasVehicleConflict}
                    >
                      {mode === "edit" ? content.saveEditLabel : content.saveCreateLabel}
                    </button>
                  </div>
                </section>
              </div>

              <aside className="vehicle-form-page__sidebar">
                <div className="vehicle-form-page__summary-card reservation-admin-form__summary-card">
                  <h2>{pageTitle}</h2>
                  <p className="hero-card__text">{pageDescription}</p>

                  <div className="vehicle-form-page__summary-grid">
                    <div className="vehicle-form-page__summary-item">
                      <span>{content.formVehicleLabel}</span>
                      <strong>{selectedVehicleName}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.formDurationLiveLabel}</span>
                      <strong>{selectedDurationLabel || "-"}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.statusLabel}</span>
                      <strong>{statusSummaryLabel}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item reservation-admin-form__summary-item--price">
                      <span>{vehicleContent.reservationEstimatedTotalLabel}</span>
                      <strong>{displayedTotalPrice}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.licenseLabel}</span>
                      <strong>{licenseSummaryLabel}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AdminReservationFormPage;
