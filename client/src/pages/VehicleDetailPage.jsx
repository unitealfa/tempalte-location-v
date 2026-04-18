import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import VehicleReservationForm from "../components/VehicleReservationForm";
import VehicleVideo from "../components/VehicleVideo";
import {
  deleteVehicle,
  getVehicleById,
  listVehicles,
  readCachedVehicleById,
  readCachedVehicleList,
  markVehicleAsAvailable,
  markVehicleAsMaintenance
} from "../services/vehicleService";
import {
  formatVehiclePrice,
  getVehicleCardImageUrl
} from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";
import { openWhatsappOrCall } from "../utils/contactLinks";

function getVehicleTitle(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function getRelatedSlidesPerView(width) {
  if (width >= 1200) {
    return 4;
  }

  if (width >= 900) {
    return 3;
  }

  if (width >= 600) {
    return 2;
  }

  return 1;
}

function getGallerySlidesPerView(width) {
  return width < 768 ? 1 : 2;
}

function formatVehicleRanges(vehicle) {
  if (!Array.isArray(vehicle.vehicleRanges) || vehicle.vehicleRanges.length === 0) {
    return "-";
  }

  return vehicle.vehicleRanges.join(", ");
}

function getAvailabilityLabel(vehicle, content) {
  if (vehicle.availabilityStatus === "maintenance") {
    return content.availabilityMaintenanceLabel;
  }

  if (vehicle.availabilityStatus === "reserved") {
    return content.availabilityReservedLabel;
  }

  return content.availabilityAvailableLabel;
}

function buildDetailAttributes(vehicle, content) {
  return [
    { label: content.brandLabel, value: vehicle.brand || "-" },
    { label: content.modelLabel, value: vehicle.model || "-" },
    { label: content.versionLabel, value: vehicle.version || "-" },
    { label: content.horsepowerLabel, value: vehicle.horsepower || "-" },
    {
      label: content.transmissionDetailLabel || content.transmissionLabel,
      value: vehicle.transmission || "-"
    },
    { label: content.fuelTypeLabel, value: vehicle.fuelType || "-" },
    {
      label: content.seatsDetailLabel || content.seatsLabel,
      value: vehicle.seats ? String(vehicle.seats) + " " + content.seatsSuffix : "-"
    },
    {
      label: content.convertibleLabel,
      value: vehicle.isConvertible ? content.yesLabel : content.noLabel
    }
  ];
}

function buildRelatedVehicles(currentVehicle, vehicles) {
  if (!currentVehicle) {
    return [];
  }

  const currentRanges = Array.isArray(currentVehicle.vehicleRanges)
    ? currentVehicle.vehicleRanges
    : [];

  return vehicles
    .filter((vehicle) => vehicle.id !== currentVehicle.id)
    .map((vehicle) => {
      const nextRanges = Array.isArray(vehicle.vehicleRanges) ? vehicle.vehicleRanges : [];
      let score = 0;

      if (vehicle.brand === currentVehicle.brand) {
        score += 5;
      }

      if (vehicle.model === currentVehicle.model) {
        score += 3;
      }

      if (vehicle.fuelType === currentVehicle.fuelType) {
        score += 1;
      }

      if (vehicle.transmission === currentVehicle.transmission) {
        score += 1;
      }

      if (vehicle.isConvertible === currentVehicle.isConvertible) {
        score += 1;
      }

      currentRanges.forEach((range) => {
        if (nextRanges.includes(range)) {
          score += 2;
        }
      });

      return {
        vehicle,
        score
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return getVehicleTitle(left.vehicle).localeCompare(getVehicleTitle(right.vehicle), "fr", {
        sensitivity: "base"
      });
    })
    .slice(0, 8)
    .map((entry) => entry.vehicle);
}

function DetailFeatureIcon({ icon }) {
  return (
    <div className="vehica-features__icon" aria-hidden="true">
      <i className={icon === "handshake" ? "far fa-handshake" : "far fa-edit"}></i>
    </div>
  );
}

function RelatedVehicleCard({ content, vehicle, onOpen }) {
  const vehicleTitle = getVehicleTitle(vehicle);
  const primaryImage = getVehicleCardImageUrl(
    Array.isArray(vehicle.photoUrls) && vehicle.photoUrls[0]
      ? vehicle.photoUrls[0]
      : "/home/rentzo-catalog-hero.jpg"
  );
  const photoCount = Array.isArray(vehicle.photoUrls) ? vehicle.photoUrls.length : 0;

  return (
    <div data-id={vehicle.id} id={"vehica-car-" + vehicle.id} className="vehica-car-card vehica-car-card-v1">
      <div className="vehica-car-card__inner">
        <button
          type="button"
          className="vehica-car-card-link"
          onClick={onOpen}
          aria-label={vehicleTitle}
        />

        <div className="vehica-car-card__image-bg">
          <div className="vehica-car-card__image" style={{ paddingTop: "84.52380952381%" }}>
            <img
              src={primaryImage || "/home/rentzo-catalog-hero.jpg"}
              alt={vehicleTitle}
              loading="lazy"
              decoding="async"
              onError={handleImageFallback}
            />

            <div className="vehica-car-card__image-info">
              <span className="vehica-car-card__image-info__photos">
                <i className="far fa-images" aria-hidden="true"></i>
                <span>{photoCount}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="vehica-car-card__content">
          <div className="vehica-car-card__name" title={vehicleTitle}>
            {vehicleTitle}
          </div>

          <div className="vehica-car-card__price">
            {content.cardDailyPriceLabel} {formatVehiclePrice(vehicle.dailyPrice)}
            {content.pricePerDaySuffix}
          </div>

          <div className="vehica-car-card__separator"></div>

          <div className="vehica-car-card__info">
            <div className="vehica-car-card__info__single">
              {vehicle.seats ? vehicle.seats + " " + content.seatsSuffix : "-"}
            </div>
            <div className="vehica-car-card__info__single">{vehicle.transmission || "-"}</div>
            <div className="vehica-car-card__info__single">{vehicle.fuelType || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HEADLINE_ANIMATION_DURATION_MS = 1200;
const HEADLINE_ITERATION_DELAY_MS = 8000;
const HEADLINE_HIDE_DURATION_MS = 400;
const HEADLINE_MARKER_PATHS = [
  "M36,85 C25,51 50,24 109,17 C176,10 260,12 337,17 C402,21 453,31 479,49 C493,59 498,75 492,92 C484,117 456,130 410,138 C345,147 260,146 184,143 C118,140 68,130 44,112 C27,99 26,80 36,65 C45,53 59,48 69,51"
];

function AnimatedReservationHeadline({ accentText, startText }) {
  const [cycleKey, setCycleKey] = useState(0);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    let hideTimerId = 0;
    let loopTimerId = 0;
    let isCancelled = false;

    const startCycle = () => {
      if (isCancelled) {
        return;
      }

      setIsHiding(false);
      setCycleKey((currentKey) => currentKey + 1);

      hideTimerId = window.setTimeout(() => {
        if (!isCancelled) {
          setIsHiding(true);
        }
      }, HEADLINE_ITERATION_DELAY_MS - HEADLINE_HIDE_DURATION_MS);

      loopTimerId = window.setTimeout(startCycle, HEADLINE_ITERATION_DELAY_MS);
    };

    startCycle();

    return () => {
      isCancelled = true;
      window.clearTimeout(hideTimerId);
      window.clearTimeout(loopTimerId);
    };
  }, []);

  return (
    <div
      className="detail-highlight-headline"
      style={{ "--detail-highlight-duration": `${HEADLINE_ANIMATION_DURATION_MS}ms` }}
    >
      <h3
        className={`detail-highlight-headline__title${
          isHiding ? " is-hiding" : " is-drawing"
        }`}
      >
        <span className="detail-highlight-headline__plain">{startText}</span>{" "}

        <span className="detail-highlight-headline__accent-wrap">
          <span className="detail-highlight-headline__accent">{accentText}</span>

          <svg
            key={cycleKey}
            className="detail-highlight-headline__marker"
            viewBox="0 0 500 150"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {HEADLINE_MARKER_PATHS.map((markerPath, markerIndex) => (
              <path key={markerIndex} d={markerPath}></path>
            ))}
          </svg>
        </span>
      </h3>
    </div>
  );
}

function VehicleDetailPage({
  content,
  footerContent,
  currentAdmin,
  vehicleId,
  onBackClick,
  onDeleted,
  onEditClick,
  onReserveClick,
  onVehicleClick
}) {
  const [vehicle, setVehicle] = useState(() => readCachedVehicleById(vehicleId, { adminView: Boolean(currentAdmin) }));
  const [relatedVehicles, setRelatedVehicles] = useState(() => {
    const cachedVehicle = readCachedVehicleById(vehicleId, { adminView: Boolean(currentAdmin) });
    const cachedVehicles = readCachedVehicleList({ adminView: Boolean(currentAdmin) });
    return cachedVehicle ? buildRelatedVehicles(cachedVehicle, cachedVehicles) : [];
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !readCachedVehicleById(vehicleId, { adminView: Boolean(currentAdmin) }));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [gallerySlidesPerView, setGallerySlidesPerView] = useState(() => {
    if (typeof window === "undefined") {
      return 2;
    }

    return getGallerySlidesPerView(window.innerWidth);
  });
  const [galleryTrackWidth, setGalleryTrackWidth] = useState(0);
  const [galleryDragOffset, setGalleryDragOffset] = useState(0);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);
  const [isGalleryTransitionEnabled, setIsGalleryTransitionEnabled] = useState(true);
  const [relatedSlidesPerView, setRelatedSlidesPerView] = useState(() => {
    if (typeof window === "undefined") {
      return 4;
    }

    return getRelatedSlidesPerView(window.innerWidth);
  });
  const [relatedTrackWidth, setRelatedTrackWidth] = useState(0);
  const [relatedActiveIndex, setRelatedActiveIndex] = useState(0);
  const [relatedDragOffset, setRelatedDragOffset] = useState(0);
  const [isRelatedDragging, setIsRelatedDragging] = useState(false);
  const galleryGestureRef = useRef({
    dragging: false,
    pointerId: null,
    startX: 0,
    deltaX: 0
  });
  const galleryImagePreloadRef = useRef(new Set());
  const galleryTrackRef = useRef(null);
  const relatedTrackRef = useRef(null);
  const relatedGestureRef = useRef({ dragging: false, pointerId: null, startX: 0, deltaX: 0 });

  useEffect(() => {
    let isActive = true;

    const loadVehicle = async () => {
      setIsLoading(() => !vehicle);
      setErrorMessage("");

      try {
        const [nextVehicle, allVehicles] = await Promise.all([
          getVehicleById(vehicleId, {
            adminView: Boolean(currentAdmin)
          }),
          listVehicles({
            adminView: Boolean(currentAdmin)
          })
        ]);

        if (!isActive) {
          return;
        }

        setVehicle(nextVehicle);
        setRelatedVehicles(buildRelatedVehicles(nextVehicle, allVehicles));
        setActivePhotoIndex(0);
        setRelatedActiveIndex(0);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicle(null);
        setRelatedVehicles([]);
        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadVehicle();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, currentAdmin, vehicleId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setGallerySlidesPerView(getGallerySlidesPerView(window.innerWidth));
      setRelatedSlidesPerView(getRelatedSlidesPerView(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !galleryTrackRef.current) {
      return undefined;
    }

    const updateWidth = () => {
      if (!galleryTrackRef.current) {
        return;
      }

      setGalleryTrackWidth(galleryTrackRef.current.clientWidth || 0);
    };

    updateWidth();

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(galleryTrackRef.current);

    return () => {
      observer.disconnect();
    };
  }, [vehicleId, gallerySlidesPerView, vehicle?.photoUrls?.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !relatedTrackRef.current) {
      return undefined;
    }

    const updateWidth = () => {
      if (!relatedTrackRef.current) {
        return;
      }

      setRelatedTrackWidth(relatedTrackRef.current.clientWidth || 0);
    };

    updateWidth();

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(relatedTrackRef.current);

    return () => {
      observer.disconnect();
    };
  }, [relatedVehicles.length]);

  const handleDelete = async () => {
    if (!window.confirm(content.deleteConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);

    try {
      await deleteVehicle(vehicleId);
      onDeleted();
    } catch (error) {
      setErrorMessage(error.message || content.deleteErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleMaintenance = async () => {
    const isMaintenance = vehicle && vehicle.availabilityStatus === "maintenance";

    if (!isMaintenance && !window.confirm(content.maintenanceConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = isMaintenance
        ? await markVehicleAsAvailable(vehicleId)
        : await markVehicleAsMaintenance(vehicleId);

      setVehicle(response.vehicle);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error.message ||
          (isMaintenance
            ? content.availableErrorMessage
            : content.maintenanceErrorMessage)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const photoUrls = useMemo(() => {
    if (!vehicle || !Array.isArray(vehicle.photoUrls) || vehicle.photoUrls.length === 0) {
      return ["/home/rentzo-hero.jpg"];
    }

    return vehicle.photoUrls;
  }, [vehicle]);
  const galleryPreloadUrls = useMemo(() => [...new Set(photoUrls)], [photoUrls]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    galleryPreloadUrls.forEach((photoUrl) => {
      if (!photoUrl || galleryImagePreloadRef.current.has(photoUrl)) {
        return;
      }

      const image = new window.Image();
      image.decoding = "async";
      image.src = photoUrl;
      galleryImagePreloadRef.current.add(photoUrl);

      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined);
      }
    });

    return undefined;
  }, [galleryPreloadUrls]);

  const isGalleryInteractive = photoUrls.length > gallerySlidesPerView;
  const gallerySlides = useMemo(() => {
    if (!isGalleryInteractive) {
      return photoUrls;
    }

    const prefixSlides = photoUrls.slice(-gallerySlidesPerView);
    const suffixSlides = photoUrls.slice(0, gallerySlidesPerView);
    return [...prefixSlides, ...photoUrls, ...suffixSlides];
  }, [gallerySlidesPerView, isGalleryInteractive, photoUrls]);
  const galleryStepWidth =
    galleryTrackWidth > 0 ? galleryTrackWidth / gallerySlidesPerView : 0;
  const galleryClassName =
    "vehica-gallery-v3 rentzo-single-car__gallery" +
    (photoUrls.length === 1
      ? " vehica-gallery-v3--count-1"
      : photoUrls.length === 2
        ? " vehica-gallery-v3--count-2"
        : "") +
    (isGalleryInteractive ? " vehica-gallery-v3--interactive" : "") +
    (isGalleryDragging ? " is-dragging" : "");
  const galleryBaseTranslate =
    galleryStepWidth > 0
      ? activePhotoIndex * galleryStepWidth
      : activePhotoIndex * (100 / gallerySlidesPerView);
  const galleryTrackStyle =
    galleryStepWidth > 0
      ? {
          transform:
            "translate3d(" + (-galleryBaseTranslate + galleryDragOffset) + "px, 0, 0)",
          transition:
            isGalleryTransitionEnabled && !isGalleryDragging ? undefined : "none"
        }
      : {
          transform:
            "translate3d(-" + activePhotoIndex * (100 / gallerySlidesPerView) + "%, 0, 0)",
          transition:
            isGalleryTransitionEnabled && !isGalleryDragging ? undefined : "none"
        };
  const detailAttributes = useMemo(
    () => (vehicle ? buildDetailAttributes(vehicle, content) : []),
    [vehicle, content]
  );
  const vehicleTitle = vehicle ? getVehicleTitle(vehicle) : "";
  const monthlyPriceText = vehicle
    ? content.monthlyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.monthlyPrice) +
      content.pricePerDaySuffix
    : "";
  const weeklyPriceText = vehicle
    ? content.weeklyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.weeklyPrice) +
      content.pricePerDaySuffix
    : "";
  const dailyPriceText = vehicle
    ? content.dailyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.dailyPrice) +
      content.pricePerDaySuffix
    : "";
  const whatsappNumber =
    footerContent?.whatsappNumber ||
    content.whatsappInternationalNumber ||
    content.whatsappNumber ||
    footerContent?.phoneValue ||
    "";
  const securityDepositText = vehicle?.securityDeposit
    ? content.detailSecurityDepositPrefix + " " + formatVehiclePrice(vehicle.securityDeposit)
    : "-";
  const includedMileageText = vehicle?.includedKmPerDay
    ? content.detailAllowedMileagePerDayPrefix + " " + vehicle.includedKmPerDay + " km"
    : content.detailAllowedMileagePerDayPrefix + " -";
  const extraMileageText = vehicle?.extraKmPrice
    ? content.detailAllowedMileageExtraPrefix + " " + formatVehiclePrice(vehicle.extraKmPrice) + content.detailAllowedMileageExtraSuffix
    : content.detailAllowedMileageExtraPrefix + " -";
  const relatedMaxIndex = Math.max(0, relatedVehicles.length - relatedSlidesPerView);
  const relatedSlideWidth =
    relatedTrackWidth > 0
      ? (relatedTrackWidth - (relatedSlidesPerView - 1) * 22) / relatedSlidesPerView
      : 0;
  const relatedTrackStyle =
    relatedSlideWidth > 0
      ? {
          transform:
            "translate3d(" + (-relatedActiveIndex * (relatedSlideWidth + 22) + relatedDragOffset) + "px, 0, 0)",
          transition: isRelatedDragging ? "none" : undefined
        }
      : undefined;
  const relatedSlideStyle =
    relatedSlideWidth > 0
      ? {
          width: relatedSlideWidth + "px",
          minWidth: relatedSlideWidth + "px"
        }
      : undefined;

  function resetGallerySwipe() {
    galleryGestureRef.current = {
      dragging: false,
      pointerId: null,
      startX: 0,
      deltaX: 0
    };
    setGalleryDragOffset(0);
    setIsGalleryDragging(false);
  }

  useLayoutEffect(() => {
    resetGallerySwipe();
    setIsGalleryTransitionEnabled(true);
    setActivePhotoIndex(isGalleryInteractive ? gallerySlidesPerView : 0);
  }, [gallerySlidesPerView, isGalleryInteractive, photoUrls.length, vehicleId]);

  useEffect(() => {
    if (isGalleryTransitionEnabled || typeof window === "undefined") {
      return undefined;
    }

    let animationFrameId = 0;
    let nestedAnimationFrameId = 0;

    animationFrameId = window.requestAnimationFrame(() => {
      nestedAnimationFrameId = window.requestAnimationFrame(() => {
        setIsGalleryTransitionEnabled(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.cancelAnimationFrame(nestedAnimationFrameId);
    };
  }, [isGalleryTransitionEnabled]);

  useEffect(() => {
    setRelatedActiveIndex((currentIndex) => Math.min(currentIndex, relatedMaxIndex));
  }, [relatedMaxIndex]);

  const goToPreviousPhoto = () => {
    if (!isGalleryInteractive) {
      return;
    }

    setIsGalleryTransitionEnabled(true);
    setActivePhotoIndex((currentIndex) => currentIndex - 1);
  };

  const goToNextPhoto = () => {
    if (!isGalleryInteractive) {
      return;
    }

    setIsGalleryTransitionEnabled(true);
    setActivePhotoIndex((currentIndex) => currentIndex + 1);
  };

  const handleGalleryTransitionEnd = () => {
    if (!isGalleryInteractive) {
      return;
    }

    if (activePhotoIndex < gallerySlidesPerView) {
      setIsGalleryTransitionEnabled(false);
      setActivePhotoIndex((currentIndex) => currentIndex + photoUrls.length);
      return;
    }

    if (activePhotoIndex >= photoUrls.length + gallerySlidesPerView) {
      setIsGalleryTransitionEnabled(false);
      setActivePhotoIndex((currentIndex) => currentIndex - photoUrls.length);
    }
  };

  const handleGalleryPointerDown = (event) => {
    if (!isGalleryInteractive) {
      return;
    }

    galleryGestureRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0
    };
    setGalleryDragOffset(0);
    setIsGalleryTransitionEnabled(false);
    setIsGalleryDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleGalleryPointerMove = (event) => {
    if (
      !galleryGestureRef.current.dragging ||
      galleryGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    galleryGestureRef.current.deltaX = event.clientX - galleryGestureRef.current.startX;
    setGalleryDragOffset(galleryGestureRef.current.deltaX);
  };

  const handleGalleryPointerEnd = (event) => {
    if (
      !galleryGestureRef.current.dragging ||
      galleryGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = galleryGestureRef.current.deltaX;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resetGallerySwipe();

    if (Math.abs(deltaX) < 48) {
      setIsGalleryTransitionEnabled(true);
      return;
    }

    setIsGalleryTransitionEnabled(true);

    if (deltaX < 0) {
      goToNextPhoto();
      return;
    }

    goToPreviousPhoto();
  };

  const goToPreviousRelated = () => {
    setRelatedActiveIndex((currentIndex) => {
      const nextIndex = currentIndex - 1;
      return nextIndex < 0 ? relatedMaxIndex : nextIndex;
    });
  };

  const goToNextRelated = () => {
    setRelatedActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex > relatedMaxIndex ? 0 : nextIndex;
    });
  };

  const handleRelatedPointerDown = (event) => {
    if (relatedMaxIndex <= 0) {
      return;
    }

    relatedGestureRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0
    };
    setRelatedDragOffset(0);
    setIsRelatedDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleRelatedPointerMove = (event) => {
    if (
      !relatedGestureRef.current.dragging ||
      relatedGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    relatedGestureRef.current.deltaX = event.clientX - relatedGestureRef.current.startX;
    setRelatedDragOffset(relatedGestureRef.current.deltaX);
  };

  const handleRelatedPointerEnd = (event) => {
    if (
      !relatedGestureRef.current.dragging ||
      relatedGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = relatedGestureRef.current.deltaX;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    relatedGestureRef.current = { dragging: false, pointerId: null, startX: 0, deltaX: 0 };
    setIsRelatedDragging(false);

    if (Math.abs(deltaX) < 45) {
      setRelatedDragOffset(0);
      return;
    }

    setRelatedDragOffset(0);

    if (deltaX < 0) {
      goToNextRelated();
      return;
    }

    goToPreviousRelated();
  };

  const scrollToReservationForm = () => {
    if (typeof window === "undefined") {
      return;
    }

    const target =
      document.getElementById("vehicle-reservation-heading") ||
      document.getElementById("contact");

    if (!target) {
      return;
    }

    const stickyHeader = document.querySelector(".vehica-menu__wrapper");
    const headerOffset = Math.ceil(
      stickyHeader?.getBoundingClientRect().height || 100
    );
    const targetTop = Math.max(
      window.scrollY + target.getBoundingClientRect().top - headerOffset - 12,
      0
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  };

  if (isLoading) {
    return (
      <main className="rentzo-single-car-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du vehicule...</p>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="rentzo-single-car-page">
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h1>{content.notFoundMessage}</h1>
            <p>{errorMessage || content.detailErrorMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rentzo-single-car-page">
      <section className="rentzo-single-car__gallery-section">
        <div className={galleryClassName}>
          <div
            ref={galleryTrackRef}
            className="vehica-swiper-container"
            onPointerDown={handleGalleryPointerDown}
            onPointerMove={handleGalleryPointerMove}
            onPointerUp={handleGalleryPointerEnd}
            onPointerCancel={handleGalleryPointerEnd}
          >
            <div
              className="vehica-swiper-wrapper"
              style={galleryTrackStyle}
              onTransitionEnd={handleGalleryTransitionEnd}
            >
              {gallerySlides.map((photoUrl, index) => {
                const visualIndex =
                  !isGalleryInteractive
                    ? index + 1
                    : index < gallerySlidesPerView
                      ? photoUrls.length - gallerySlidesPerView + index + 1
                      : index >= photoUrls.length + gallerySlidesPerView
                        ? index - (photoUrls.length + gallerySlidesPerView) + 1
                        : index - gallerySlidesPerView + 1;

                return (
                  <div key={photoUrl + "-" + index} className="vehica-gallery-v3__slide">
                    <div className="vehica-gallery-v3__image-wrapper">
                      <img
                        className="vehica-gallery-v3__image"
                        src={photoUrl}
                        alt={vehicleTitle + " " + visualIndex}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        onError={handleImageFallback}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isGalleryInteractive ? (
            <div className="vehica-gallery-v3__arrows">
              <button
                type="button"
                className="vehica-gallery-v3__arrow vehica-gallery-v3__arrow--left"
                onClick={goToPreviousPhoto}
                aria-label="Photo precedente"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <button
                type="button"
                className="vehica-gallery-v3__arrow vehica-gallery-v3__arrow--right"
                onClick={goToNextPhoto}
                aria-label="Photo suivante"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rentzo-single-car__divider-section">
        <div className="rentzo-single-car__container">
          <div className="elementor-divider">
            <span className="elementor-divider-separator"></span>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="vehicle-detail-page__banner">
          <div className="rentzo-single-car__container">
            <p className="login-form__message login-form__message--error">{errorMessage}</p>
          </div>
        </section>
      ) : null}

      <section className="rentzo-single-car__overview-section">
        <div className="rentzo-single-car__container">
          <div className="rentzo-single-car__columns">
            <div className="rentzo-single-car__main-column">
              <div className="rentzo-single-car__title-box">
                <h1 className="vehica-car-name">{vehicleTitle}</h1>
              </div>

              {currentAdmin && vehicle.availabilityStatus === "maintenance" ? (
                <div className="rentzo-single-car__status rentzo-single-car__status--maintenance">
                  <span className="vehicle-card__badge">{content.maintenanceBadge}</span>
                  <p>{content.maintenanceDescription}</p>
                </div>
              ) : null}

              {currentAdmin && vehicle.availabilityStatus === "reserved" ? (
                <div className="rentzo-single-car__status rentzo-single-car__status--reserved">
                  <span className="vehicle-card__badge">{content.availabilityReservedLabel}</span>
                  <p>
                    Ce vehicule est deja reserve sur certaines dates. Les creneaux indisponibles
                    restent bloques dans le calendrier de reservation.
                  </p>
                </div>
              ) : null}

              <section className="rentzo-single-car__section rentzo-single-car__section--mobile-prices">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailPriceTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__price-stack">
                  <div className="rentzo-single-car__price-card rentzo-single-car__price-card--dark">
                    <div className="vehica-car-price">{monthlyPriceText}</div>
                  </div>

                  <div className="rentzo-single-car__price-secondary">
                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{weeklyPriceText}</div>
                    </div>

                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{dailyPriceText}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rentzo-single-car__section">
                <h2 className="elementor-heading-title elementor-size-default">
                  {content.detailVehicleDataTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__attributes-panel">
                  <div className="rentzo-single-car__attributes-inner vehica-app vehica-car-attributes">
                    <div className="vehica-car-attributes-grid vehica-grid rentzo-single-car__attributes-grid">
                      {detailAttributes.map((attribute) => (
                        <div
                          key={attribute.label}
                          className="vehica-grid__element vehica-grid__element--1of2 vehica-grid__element--tablet-1of2 vehica-grid__element--mobile-1of1 rentzo-single-car__attribute"
                        >
                          <div className="vehica-grid rentzo-single-car__attribute-inner">
                            <div className="vehica-car-attributes__name vehica-grid__element--1of2">
                              {attribute.label}:
                            </div>
                            <div className="vehica-car-attributes__values vehica-grid__element--1of2">
                              {attribute.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rentzo-single-car__section rentzo-single-car__section--video">
                <h2 className="elementor-heading-title elementor-size-default">
                  {content.detailVideoTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                {vehicle.videoUrl ? (
                  <div className="rentzo-single-car__video-box">
                    <div className="vehica-car-embed-wrapper">
                      <div className="vehica-car-embed">
                        <div className="vehica-car-embed__inner">
                          <VehicleVideo
                            src={vehicle.videoUrl}
                            title={content.detailVideoTitle + " " + vehicleTitle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rentzo-single-car__video-spacer" aria-hidden="true"></div>
                )}
              </section>

              <section className="rentzo-single-car__section rentzo-single-car__section--mobile-conditions">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailConditionsTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="vehica-car-description rentzo-single-car__conditions-copy">
                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailSecurityDepositHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{securityDepositText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailAllowedMileageHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{includedMileageText}</li>
                    <li>{extraMileageText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-note">{content.globalPricingDescription}</p>
                </div>
              </section>

              <section className="rentzo-single-car__section rentzo-single-car__section--quality">
                <div className="vehica-heading">
                  <h3 className="vehica-heading__title">{content.detailQualityTitle}</h3>
                  <div className="vehica-heading__text">
                    {content.detailQualityTextLine1}
                    <br />
                    <span>{content.detailQualityTextHighlight}</span>
                  </div>
                </div>

                <div className="vehica-features rentzo-single-car__features-list">
                  {content.detailFeatureItems.map((item) => (
                    <div key={item.title} className="vehica-features__feature">
                      <DetailFeatureIcon icon={item.icon} />

                      <div className="vehica-features__content">
                        <div className="vehica-features__label">{item.title}</div>
                        <div className="vehica-features__text">{item.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="elementor-button-wrapper rentzo-single-car__faq-button-wrapper">
                  <a
                    className="elementor-button elementor-button-link elementor-size-sm"
                    href="/foire-aux-questions"
                  >
                    <span className="elementor-button-content-wrapper">
                      <span className="elementor-button-icon">
                        <i className="fas fa-step-forward"></i>
                      </span>
                      <span className="elementor-button-text">{content.detailFaqButtonLabel}</span>
                    </span>
                  </a>
                </div>
              </section>
            </div>

            <aside className="rentzo-single-car__sidebar-column">
              <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--price">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailPriceTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__sidebar-prices">
                  <div className="rentzo-single-car__price-card rentzo-single-car__price-card--dark">
                    <div className="vehica-car-price">{monthlyPriceText}</div>
                  </div>

                  <div className="rentzo-single-car__price-secondary">
                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{weeklyPriceText}</div>
                    </div>

                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{dailyPriceText}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--conditions">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailConditionsTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="vehica-car-description rentzo-single-car__conditions-copy">
                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailSecurityDepositHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{securityDepositText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailAllowedMileageHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{includedMileageText}</li>
                    <li>{extraMileageText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-note">{content.globalPricingDescription}</p>
                </div>
              </div>

              {!currentAdmin ? (
                <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--actions">
                  <div className="elementor-button-wrapper rentzo-single-car__reserve-button-wrapper">
                    <button
                      type="button"
                      className="elementor-button elementor-size-sm"
                      onClick={scrollToReservationForm}
                    >
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-icon">
                          <i className="fas fa-comments"></i>
                        </span>
                        <span className="elementor-button-text">{content.reserveFormLabel}</span>
                      </span>
                    </button>
                  </div>

                  <div className="vehica-whats-app-button">
                    <a
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        openWhatsappOrCall({
                          phoneNumber: whatsappNumber,
                          message: `Bonjour, je souhaite reserver ${vehicleTitle}.`
                        });
                      }}
                    >
                      <i className="fab fa-whatsapp"></i>
                      {content.reserveWhatsappLabel}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--actions">
                  <div className="rentzo-single-car__admin-actions">
                    <button
                      type="button"
                      className="login-form__submit"
                      disabled={isActionLoading || vehicle.availabilityStatus === "maintenance"}
                      onClick={onReserveClick}
                    >
                      {content.adminReserveLabel}
                    </button>
                    <button type="button" className="vehicle-detail__secondary-action" onClick={onEditClick}>
                      {content.adminEditLabel}
                    </button>
                    <button
                      type="button"
                      className="vehicle-detail__secondary-action"
                      disabled={isActionLoading}
                      onClick={handleMaintenance}
                    >
                      {vehicle.availabilityStatus === "maintenance"
                        ? content.adminMaintenanceDoneLabel
                        : content.adminMaintenanceLabel}
                    </button>
                    <button
                      type="button"
                      className="vehicle-detail__danger-action"
                      disabled={isActionLoading}
                      onClick={handleDelete}
                    >
                      {content.adminDeleteLabel}
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {!currentAdmin ? (
        <section className="rentzo-single-car__contact-section">
          <div className="rentzo-single-car__container">
            <div className="rentzo-single-car__columns rentzo-single-car__columns--contact">
              <div className="rentzo-single-car__contact-form-column">
                <h3
                  id="vehicle-reservation-heading"
                  className="elementor-heading-title elementor-size-default"
                >
                  {content.detailReservationFormTitle}
                </h3>
                <VehicleReservationForm
                  content={content}
                  footerContent={footerContent}
                  vehicle={vehicle}
                  hideActionButtons={true}
                  hideIntro={true}
                />
              </div>

              <div className="rentzo-single-car__contact-copy-column">
                <AnimatedReservationHeadline
                  startText={content.detailAnimatedHeadlineStart}
                  accentText={content.detailAnimatedHeadlineAccent}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {relatedVehicles.length > 0 ? (
        <section className="rentzo-single-car__related-section">
          <div className="rentzo-single-car__container">
            <div className="vehica-app">
              <h3 className="vehica-section-label">{content.detailRelatedTitle}</h3>

              <div className={"vehica-car-tabs-carousel rentzo-single-car__related-carousel vehica-carousel-v1--cars-" + relatedVehicles.length}>
                <div className="vehica-carousel-v1">
                  <div className="vehica-carousel__swiper" ref={relatedTrackRef}>
                    <div className="vehica-swiper-container" onPointerDown={handleRelatedPointerDown} onPointerMove={handleRelatedPointerMove} onPointerUp={handleRelatedPointerEnd} onPointerCancel={handleRelatedPointerEnd}>
                      <div className="vehica-swiper-wrapper" style={relatedTrackStyle}>
                        {relatedVehicles.map((relatedVehicle) => (
                          <div
                            key={relatedVehicle.id}
                            className="vehica-swiper-slide vehica-carousel-v1__slide"
                            style={relatedSlideStyle}
                          >
                            <RelatedVehicleCard
                              content={content}
                              vehicle={relatedVehicle}
                              onOpen={() => onVehicleClick(relatedVehicle.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {relatedMaxIndex > 0 ? (
                    <div className="vehica-carousel-v1__arrows">
                      <button
                        type="button"
                        className="vehica-carousel__arrow vehica-carousel__arrow--left"
                        onClick={goToPreviousRelated}
                        aria-label="Vehicule precedent"
                      ></button>
                      <button
                        type="button"
                        className="vehica-carousel__arrow vehica-carousel__arrow--right"
                        onClick={goToNextRelated}
                        aria-label="Vehicule suivant"
                      ></button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default VehicleDetailPage;
