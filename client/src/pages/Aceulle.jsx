import { useEffect, useRef, useState } from "react";
import {
  hasCachedVehicleList,
  listVehicles,
  readCachedVehicleList
} from "../services/vehicleService";
import {
  formatVehicleName,
  formatVehiclePrice,
  getVehicleCardImageUrl
} from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke="currentColor" />
      <line x1="8" y1="3.5" x2="8" y2="7.5" stroke="currentColor" />
      <line x1="16" y1="3.5" x2="16" y2="7.5" stroke="currentColor" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6.5h14a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5h-8l-4.5 3v-3H5A2.5 2.5 0 0 1 2.5 15V9A2.5 2.5 0 0 1 5 6.5Z"
        fill="none"
        stroke="currentColor"
      />
      <circle cx="8.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="34.011" height="29.76" viewBox="0 0 34.011 29.76" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.691-27.634h-7.44a4.086 4.086 0 0 0-2.989 1.262A4.086 4.086 0 0 0 0-23.383v8.5a4.086 4.086 0 0 0 1.262 2.989 4.086 4.086 0 0 0 2.989 1.262H8.5v1.594a3.58 3.58 0 0 1-1.1 2.624 3.58 3.58 0 0 1-2.624 1.1H3.72a2.571 2.571 0 0 0-1.893.764 2.571 2.571 0 0 0-.764 1.893v2.126a2.571 2.571 0 0 0 .764 1.893 2.571 2.571 0 0 0 1.893.764h1.063A10.925 10.925 0 0 0 10.4.631a11.112 11.112 0 0 0 4.052-4.052 10.925 10.925 0 0 0 1.495-5.613v-14.349a4.086 4.086 0 0 0-1.262-2.989 4.086 4.086 0 0 0-2.994-1.262zm2.126 18.6a8.652 8.652 0 0 1-1.229 4.517A9.354 9.354 0 0 1 9.3-1.229 8.652 8.652 0 0 1 4.783 0H3.72a.508.508 0 0 1-.365-.166.508.508 0 0 1-.166-.365v-2.126a.508.508 0 0 1 .166-.365.508.508 0 0 1 .365-.166h1.063A5.623 5.623 0 0 0 8.9-4.916a5.623 5.623 0 0 0 1.727-4.119v-3.72H4.251a2.043 2.043 0 0 1-1.495-.631 2.043 2.043 0 0 1-.631-1.495v-8.5a2.043 2.043 0 0 1 .631-1.495 2.043 2.043 0 0 1 1.495-.631h7.44a2.043 2.043 0 0 1 1.495.631 2.043 2.043 0 0 1 .631 1.495zm15.943-18.6h-7.44a4.086 4.086 0 0 0-2.989 1.262 4.086 4.086 0 0 0-1.262 2.989v8.5a4.086 4.086 0 0 0 1.262 2.989 4.086 4.086 0 0 0 2.989 1.262h4.251v1.594a3.58 3.58 0 0 1-1.1 2.624 3.58 3.58 0 0 1-2.624 1.1h-1.058a2.571 2.571 0 0 0-1.889.764 2.571 2.571 0 0 0-.764 1.893v2.126a2.571 2.571 0 0 0 .764 1.893 2.571 2.571 0 0 0 1.893.764h1.063A10.925 10.925 0 0 0 28.465.631a11.112 11.112 0 0 0 4.052-4.052 10.925 10.925 0 0 0 1.495-5.613v-14.349a4.086 4.086 0 0 0-1.262-2.989 4.086 4.086 0 0 0-2.99-1.262zm2.126 18.6a8.652 8.652 0 0 1-1.229 4.517 9.354 9.354 0 0 1-3.288 3.288A8.652 8.652 0 0 1 22.851 0h-1.062a.508.508 0 0 1-.365-.166.508.508 0 0 1-.166-.365v-2.126a.508.508 0 0 1 .166-.365.508.508 0 0 1 .365-.166h1.063a5.623 5.623 0 0 0 4.118-1.728 5.623 5.623 0 0 0 1.73-4.118v-3.72h-6.38a2.043 2.043 0 0 1-1.495-.631 2.043 2.043 0 0 1-.631-1.495v-8.5a2.043 2.043 0 0 1 .631-1.495 2.043 2.043 0 0 1 1.495-.631h7.44a2.043 2.043 0 0 1 1.495.631 2.043 2.043 0 0 1 .631 1.495z"
        transform="translate(0 27.634)"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M256 512A256 256 0 1 1 256 0a256 256 0 1 1 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47 111-111c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 576 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M316.9 18.3c-5.5-11.7-22.3-11.7-27.8 0l-64 136.5-149.9 22.5c-12.9 1.9-18 17.8-8.6 27.2l108.6 105.7-25.7 149.1c-2.1 12.5 11 22 22.4 15.8L288 439.6l116.1 64.5c11.5 6.2 24.6-3.4 22.4-15.8l-25.7-149.1 108.6-105.7c9.4-9.4 4.3-25.3-8.6-27.2l-149.9-22.5-64-136.5z"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 320 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 320 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
      />
    </svg>
  );
}

function useRevealOnce() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry || !entry.isIntersecting) {
          return;
        }

        setIsVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.18
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isVisible];
}

function getSlidesPerView(width) {
  if (width >= 1200) {
    return 3;
  }

  if (width >= 900) {
    return 2;
  }

  return 1;
}

function useSlidesPerView() {
  const [slidesPerView, setSlidesPerView] = useState(() => {
    if (typeof window === "undefined") {
      return 3;
    }

    return getSlidesPerView(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getSlidesPerView(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return slidesPerView;
}

function getConvertibleSlidesPerView(width) {
  if (width >= 1408) {
    return 4;
  }

  if (width >= 900) {
    return 2;
  }

  return 1;
}

function useConvertibleSlidesPerView() {
  const [slidesPerView, setSlidesPerView] = useState(() => {
    if (typeof window === "undefined") {
      return 4;
    }

    return getConvertibleSlidesPerView(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getConvertibleSlidesPerView(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return slidesPerView;
}

function VehicleCard({ vehicle, onNavigate, wrapperClassName }) {
  return (
    <div className={wrapperClassName}>
      <div className="vehica-car-card vehica-car-card-v1">
        <div className="vehica-car-card__inner">
          <button
            type="button"
            className="vehica-car-card-link"
            aria-label={formatVehicleName(vehicle)}
            onClick={() => onNavigate("/location-de-voitures/" + vehicle.id)}
          ></button>

          <div className="vehica-car-card__image-bg">
            <div className="vehica-car-card__image" style={{ paddingTop: "84.52380952381%" }}>
              <img
                src={
                  vehicle.photoUrls && vehicle.photoUrls[0]
                    ? getVehicleCardImageUrl(vehicle.photoUrls[0])
                    : "/home/rentzo-hero.jpg"
                }
                alt={formatVehicleName(vehicle)}
                loading="lazy"
                decoding="async"
                onError={handleImageFallback}
              />

              <div className="vehica-car-card__image-info">
                <span className="vehica-car-card__image-info__photos">
                  {vehicle.photoUrls ? vehicle.photoUrls.length : 0} photos
                </span>
              </div>
            </div>
          </div>

          <div className="vehica-car-card__content">
            <div className="vehica-car-card__name" title={formatVehicleName(vehicle)}>
              {formatVehicleName(vehicle)}
            </div>

            <div className="vehica-car-card__price">
              Prix journalier: {formatVehiclePrice(vehicle.dailyPrice)} / jour
            </div>

            <div className="vehica-car-card__separator"></div>

            <div className="vehica-car-card__info">
              <div className="vehica-car-card__info__single">{vehicle.seats} places</div>
              <div className="vehica-car-card__info__single">{vehicle.transmission}</div>
              <div className="vehica-car-card__info__single">{vehicle.fuelType}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RentzoFeature({ icon, label, text }) {
  return (
    <div className="vehica-features__feature">
      <div className="vehica-features__icon">{icon}</div>

      <div className="vehica-features__content">
        <div className="vehica-features__label">{label}</div>
        <div className="vehica-features__text">{text}</div>
      </div>
    </div>
  );
}

function CarHotelSection({ content }) {
  const [sectionRef, isVisible] = useRevealOnce();
  const carHotelImagePath = content.carHotelImagePath || "/home/rentzo-car-hotel.jpg";

  return (
    <section
      ref={sectionRef}
      className={"rentzo-home__car-hotel" + (isVisible ? " is-visible" : "")}
    >
      <div className="rentzo-home__car-hotel-grid">
        <div
          className="rentzo-home__car-hotel-image"
          aria-hidden="true"
          style={{ backgroundImage: "url('" + carHotelImagePath + "')" }}
        ></div>

        <div className="rentzo-home__car-hotel-content">
          <h2 className="rentzo-home__car-hotel-title">{content.carHotelTitle}</h2>

          <div className="rentzo-home__car-hotel-description">
            <p>{content.carHotelDescription}</p>
          </div>

          <div className="rentzo-home__car-hotel-services-title">
            <p>
              <strong>{content.carHotelServicesTitle}</strong>
            </p>
          </div>

          <div className="rentzo-home__car-hotel-divider">
            <span></span>
          </div>

          <ul className="rentzo-home__car-hotel-list">
            {content.carHotelServices.map((service) => (
              <li key={service} className="rentzo-home__car-hotel-item">
                <span className="rentzo-home__car-hotel-item-icon">
                  <CheckCircleIcon />
                </span>
                <span className="rentzo-home__car-hotel-item-text">{service}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ content }) {
  const testimonials = content.testimonialsItems || [];
  const slidesPerView = useSlidesPerView();
  const pageCount = Math.max(1, testimonials.length - slidesPerView + 1);
  const [sectionRef, isVisible] = useRevealOnce();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gestureRef = useRef({ dragging: false, pointerId: null, startX: 0, deltaX: 0 });

  useEffect(() => {
    setActiveIndex((currentIndex) => Math.min(currentIndex, pageCount - 1));
  }, [pageCount]);

  const goToSlide = (index) => {
    setActiveIndex(Math.max(0, Math.min(index, pageCount - 1)));
  };

  const handlePrevious = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex <= 0) {
        return pageCount - 1;
      }

      return currentIndex - 1;
    });
  };

  const handleNext = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex >= pageCount - 1) {
        return 0;
      }

      return currentIndex + 1;
    });
  };

  const handlePointerDown = (event) => {
    if (pageCount <= 1) {
      return;
    }

    gestureRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0
    };
    setDragOffset(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!gestureRef.current.dragging || gestureRef.current.pointerId !== event.pointerId) {
      return;
    }

    gestureRef.current.deltaX = event.clientX - gestureRef.current.startX;
    setDragOffset(gestureRef.current.deltaX);
  };

  const handlePointerEnd = (event) => {
    if (!gestureRef.current.dragging || gestureRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = gestureRef.current.deltaX;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    gestureRef.current = { dragging: false, pointerId: null, startX: 0, deltaX: 0 };
    setIsDragging(false);

    if (Math.abs(deltaX) < 45) {
      setDragOffset(0);
      return;
    }

    setDragOffset(0);

    if (deltaX < 0) {
      handleNext();
      return;
    }

    handlePrevious();
  };

  return (
    <section
      ref={sectionRef}
      className={"rentzo-home__testimonials" + (isVisible ? " is-visible" : "")}
    >
      <div className="rentzo-home__container">
        <div className="vehica-heading rentzo-home__testimonials-heading">
          <div className="vehica-heading__icon">
            <QuoteIcon />
          </div>

          <h3 className="vehica-heading__title">{content.testimonialsTitle}</h3>

          <div className="vehica-heading__text">
            <span>{content.testimonialsHighlight}</span> {content.testimonialsTextLine1}
            <br />
            {content.testimonialsTextLine2}
          </div>
        </div>

        <div className="vehica-app">
          <div className="vehica-testimonial-carousel">
            <div className="vehica-swiper-container" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}>
              <div
                className="vehica-swiper-wrapper"
                style={{
                  transform:
                    "translate3d(calc(-" + activeIndex * (100 / slidesPerView) + "% + " + dragOffset + "px), 0, 0)",
                  transition: isDragging ? "none" : undefined
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.name + "-" + index}
                    className={
                      "vehica-swiper-slide" +
                      (index === activeIndex ? " vehica-swiper-slide-active" : "")
                    }
                  >
                    <div className="vehica-testimonial-carousel__testimonial">
                      <div className="vehica-testimonial-carousel__content">
                        <div className="vehica-testimonial-carousel__stars" aria-hidden="true">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <span key={testimonial.name + "-star-" + starIndex}>
                              <StarIcon />
                            </span>
                          ))}
                        </div>

                        <div className="vehica-testimonial-carousel__text">{testimonial.text}</div>
                      </div>

                      <div className="vehica-testimonial-carousel__footer">
                        <div className="vehica-testimonial-carousel__name">{testimonial.name}</div>
                        <div className="vehica-testimonial-carousel__title">{testimonial.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pageCount > 1 ? (
                <div className="vehica-testimonial-carousel__pagination">
                  {Array.from({ length: pageCount }).map((_, index) => (
                    <button
                      key={"testimonial-page-" + index}
                      type="button"
                      className={
                        "vehica-testimonial-carousel__bullet" +
                        (index === activeIndex ? " is-active" : "")
                      }
                      aria-label={"Afficher le temoignage " + (index + 1)}
                      onClick={() => goToSlide(index)}
                    ></button>
                  ))}
                </div>
              ) : null}
            </div>

            {pageCount > 1 ? (
              <>
                <button
                  type="button"
                  className="vehica-testimonial-carousel__nav vehica-testimonial-carousel__nav--prev"
                  aria-label="Temoignage precedent"
                  onClick={handlePrevious}
                >
                  <ChevronLeftIcon />
                </button>

                <button
                  type="button"
                  className="vehica-testimonial-carousel__nav vehica-testimonial-carousel__nav--next"
                  aria-label="Temoignage suivant"
                  onClick={handleNext}
                >
                  <ChevronRightIcon />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Aceulle({ content, onNavigate }) {
  const [vehicles, setVehicles] = useState(() => readCachedVehicleList());
  const [isLoading, setIsLoading] = useState(() => !hasCachedVehicleList());

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      setIsLoading(() => !hasCachedVehicleList());

      try {
        const nextVehicles = await listVehicles();

        if (!isActive) {
          return;
        }

        setVehicles(nextVehicles);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicles([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadVehicles();

    return () => {
      isActive = false;
    };
  }, []);

  const featuredVehicles = vehicles.slice(0, 4);
  const selectedConvertibleIds = Array.isArray(content.convertibleVehicleIds)
    ? content.convertibleVehicleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
    : [];
  const selectedConvertibles = selectedConvertibleIds
    .map((selectedId) => vehicles.find((vehicle) => Number(vehicle.id) === selectedId))
    .filter(Boolean);
  const convertibleVehicles = vehicles.filter((vehicle) => vehicle.isConvertible);
  const featuredConvertibles = (
    selectedConvertibles.length ? selectedConvertibles : convertibleVehicles.length ? convertibleVehicles : vehicles
  ).slice(0, 8);
  const convertibleSlidesPerView = useConvertibleSlidesPerView();
  const convertiblePageCount = Math.max(1, featuredConvertibles.length - convertibleSlidesPerView + 1);
  const [activeConvertibleIndex, setActiveConvertibleIndex] = useState(0);
  const [convertibleDragOffset, setConvertibleDragOffset] = useState(0);
  const [isConvertibleDragging, setIsConvertibleDragging] = useState(false);
  const convertibleGestureRef = useRef({ dragging: false, pointerId: null, startX: 0, deltaX: 0 });
  const convertiblesClassName =
    "vehica-carousel-v1 vehica-carousel-v1--cars-" + Math.max(1, Math.min(featuredConvertibles.length, 4));

  useEffect(() => {
    setActiveConvertibleIndex((currentIndex) => Math.min(currentIndex, convertiblePageCount - 1));
  }, [convertiblePageCount]);

  const goToPreviousConvertible = () => {
    setActiveConvertibleIndex((currentIndex) => {
      const nextIndex = currentIndex - 1;
      return nextIndex < 0 ? convertiblePageCount - 1 : nextIndex;
    });
  };

  const goToNextConvertible = () => {
    setActiveConvertibleIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex >= convertiblePageCount ? 0 : nextIndex;
    });
  };

  const handleConvertiblePointerDown = (event) => {
    if (convertiblePageCount <= 1) {
      return;
    }

    convertibleGestureRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0
    };
    setConvertibleDragOffset(0);
    setIsConvertibleDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleConvertiblePointerMove = (event) => {
    if (
      !convertibleGestureRef.current.dragging ||
      convertibleGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    convertibleGestureRef.current.deltaX = event.clientX - convertibleGestureRef.current.startX;
    setConvertibleDragOffset(convertibleGestureRef.current.deltaX);
  };

  const handleConvertiblePointerEnd = (event) => {
    if (
      !convertibleGestureRef.current.dragging ||
      convertibleGestureRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = convertibleGestureRef.current.deltaX;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    convertibleGestureRef.current = { dragging: false, pointerId: null, startX: 0, deltaX: 0 };
    setIsConvertibleDragging(false);

    if (Math.abs(deltaX) < 45) {
      setConvertibleDragOffset(0);
      return;
    }

    setConvertibleDragOffset(0);

    if (deltaX < 0) {
      goToNextConvertible();
      return;
    }

    goToPreviousConvertible();
  };

  const convertibleTrackStyle = {
    transform:
      "translate3d(calc(-" + activeConvertibleIndex * (100 / convertibleSlidesPerView) + "% + " + convertibleDragOffset + "px), 0, 0)",
    transition: isConvertibleDragging ? "none" : undefined
  };

  return (
    <main className="rentzo-home">
      <section className="rentzo-home__hero">
        <div className="vehica-app">
          <div className="vehica-slider vehica-swiper-container">
            <div className="vehica-swiper-wrapper">
              <div
                className="vehica-slider__slide"
                style={{ backgroundImage: "url('" + (content.heroImagePath || "/home/rentzo-hero.jpg") + "')" }}
              >
                <div className="vehica-slider__mask-additional"></div>

                <div className="vehica-slider__content">
                  <div className="vehica-slider__content-inner">
                    <div className="vehica-slider__title"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rentzo-home__intro">
        <div className="rentzo-home__container">
          <div className="vehica-heading">
            <div className="vehica-heading__title">{content.eyebrow}</div>
            <h1 className="vehica-heading__text">
              <span>{content.title}</span>
            </h1>
          </div>

          <div className="vehica-features">
            <RentzoFeature
              icon={<i className="far fa-calendar-alt" aria-hidden="true"></i>}
              label={content.featureRentalLabel}
              text={content.featureRentalText}
            />
            <RentzoFeature
              icon={<i className="fas fa-hotel" aria-hidden="true"></i>}
              label={content.featureContactLabel}
              text={content.featureContactText}
            />
          </div>
        </div>
      </section>

      <section className="rentzo-home__catalog">
        <div className="rentzo-home__container">
          <div className="vehica-hero-v2-title">
            <h2 className="elementor-heading-title elementor-size-default">
              {content.fleetTitle}
            </h2>
          </div>

          {isLoading ? (
            <div className="rentzo-home__empty">
              <p>{content.fleetLoadingLabel}</p>
            </div>
          ) : featuredVehicles.length ? (
            <div className="rentzo-home__grid-wrap">
              <div className="vehica-grid">
                {featuredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onNavigate={onNavigate}
                    wrapperClassName="vehica-grid__element vehica-grid__element--1of4 vehica-grid__element--tablet-1of2 vehica-grid__element--mobile-1of1"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rentzo-home__empty">
              <h3>{content.fleetEmptyTitle}</h3>
              <p>{content.fleetEmptyDescription}</p>
            </div>
          )}

          <div className="rentzo-home__cta">
            <div className="elementor-button-wrapper">
              <button
                type="button"
                className="elementor-button elementor-size-sm"
                onClick={() => onNavigate("/location-de-voitures")}
              >
                <span className="elementor-button-content-wrapper">
                  <span className="elementor-button-text">VOIR LES VÉHICULES DISPONIBLES</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <CarHotelSection content={content} />
      <TestimonialsSection content={content} />

      <section className="rentzo-home__convertibles">
        <div className="rentzo-home__container">
          <div className="vehica-car-tabs-carousel vehica-car-tabs-carousel__arrows-outside">
            <div className="vehica-tabs-top-v2">
              <h3 className="vehica-tabs-top-v2__heading">{content.convertiblesTitle}</h3>
            </div>

            {isLoading ? (
              <div className="rentzo-home__empty rentzo-home__empty--light">
                <p>{content.fleetLoadingLabel}</p>
              </div>
            ) : featuredConvertibles.length ? (
              <div className={convertiblesClassName}>
                <div className="vehica-carousel__swiper" onPointerDown={handleConvertiblePointerDown} onPointerMove={handleConvertiblePointerMove} onPointerUp={handleConvertiblePointerEnd} onPointerCancel={handleConvertiblePointerEnd}>
                  <div className="vehica-swiper-wrapper" style={convertibleTrackStyle}>
                    {featuredConvertibles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="vehica-swiper-slide vehica-carousel-v1__slide"
                        style={{ width: 100 / convertibleSlidesPerView + "%" }}
                      >
                        <VehicleCard
                          vehicle={vehicle}
                          onNavigate={onNavigate}
                          wrapperClassName="rentzo-home__convertibles-slide-inner"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {convertiblePageCount > 1 ? (
                  <>
                    <button
                      type="button"
                      className="rentzo-home__convertibles-nav rentzo-home__convertibles-nav--prev"
                      aria-label="Voir les vehicules precedents"
                      onClick={goToPreviousConvertible}
                    >
                      <ChevronLeftIcon />
                    </button>

                    <button
                      type="button"
                      className="rentzo-home__convertibles-nav rentzo-home__convertibles-nav--next"
                      aria-label="Voir les vehicules suivants"
                      onClick={goToNextConvertible}
                    >
                      <ChevronRightIcon />
                    </button>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="rentzo-home__empty rentzo-home__empty--light">
                <h3>{content.convertiblesEmptyTitle}</h3>
                <p>{content.convertiblesEmptyDescription}</p>
              </div>
            )}

            <div className="rentzo-home__convertibles-cta">
              <div className="elementor-button-wrapper">
                <button
                  type="button"
                  className="elementor-button elementor-size-sm"
                  onClick={() => onNavigate("/location-de-voitures")}
                >
                  <span className="elementor-button-content-wrapper">
                    <span className="elementor-button-text">VOIR TOUT</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Aceulle;
