import { useEffect, useState } from "react";
import {
  getAdminVisualSettings,
  getCachedVisualSettings,
  saveAdminVisualSettings,
  uploadAdminVisualImage
} from "../services/contentService";
import { listVehicles, readCachedVehicleList } from "../services/vehicleService";
import { useRef } from "react";
import FaqPage from "./FaqPage";
import ContactPage from "./ContactPage";
import {
  formatVehicleName,
  formatVehiclePrice,
  getVehicleCardImageUrl
} from "../utils/vehicleFormatters";
import { extractAcceptedFilesFromDrop } from "../utils/dropFiles";
import { handleImageFallback, IMAGE_FALLBACK_SRC } from "../utils/imageFallback";

const ADMIN_VISUAL_IMAGE_ACCEPT =
  "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,.heic,.heif,.jfif,.tif,.tiff,.ico,.cur,.apng,.pjpeg,.pjp,.dib,.jxl";

const DEFAULT_FORM = {
  browserTitle: "",
  faviconImagePath: "",
  headerLogoImagePath: "",
  footerLogoImagePath: "",
  homeHeroImagePath: "",
  homeEyebrow: "",
  homeTitle: "",
  homeFeatureRentalLabel: "",
  homeFeatureRentalText: "",
  homeFeatureContactLabel: "",
  homeFeatureContactText: "",
  homeFleetTitle: "",
  homeCarHotelImagePath: "",
  homeCarHotelTitle: "",
  homeCarHotelDescription: "",
  homeCarHotelServicesTitle: "",
  homeCarHotelService1: "",
  homeCarHotelService2: "",
  homeCarHotelService3: "",
  homeCarHotelService4: "",
  homeTestimonialsTitle: "",
  homeTestimonialsHighlight: "",
  homeTestimonialsTextLine1: "",
  homeTestimonialsTextLine2: "",
  homeTestimonial1Text: "",
  homeTestimonial1Name: "",
  homeTestimonial1Role: "",
  homeTestimonial2Text: "",
  homeTestimonial2Name: "",
  homeTestimonial2Role: "",
  homeTestimonial3Text: "",
  homeTestimonial3Name: "",
  homeTestimonial3Role: "",
  homeTestimonial4Text: "",
  homeTestimonial4Name: "",
  homeTestimonial4Role: "",
  homeTestimonial5Text: "",
  homeTestimonial5Name: "",
  homeTestimonial5Role: "",
  homeConvertiblesTitle: "",
  homeConvertibleVehicleIds: [],
  faqHeroImagePath: "",
  faqHeroTitleStart: "",
  faqHeroTitleAccent: "",
  faqHeroSubtitle: "",
  faqPageTitle: "",
  faqContactButtonLabel: "",
  faqLeftQuestion1: "",
  faqLeftAnswer1: "",
  faqLeftQuestion2: "",
  faqLeftAnswer2: "",
  faqLeftQuestion3: "",
  faqLeftAnswer3: "",
  faqLeftQuestion4: "",
  faqLeftAnswer4: "",
  faqLeftQuestion5: "",
  faqLeftAnswer5: "",
  faqLeftQuestion6: "",
  faqLeftAnswer6: "",
  faqRightQuestion1: "",
  faqRightAnswer1: "",
  faqRightQuestion2: "",
  faqRightAnswer2: "",
  faqRightQuestion3: "",
  faqRightAnswer3: "",
  faqRightQuestion4: "",
  faqRightAnswer4: "",
  faqRightQuestion5: "",
  faqRightAnswer5: "",
  faqRightQuestion6: "",
  faqRightAnswer6: "",
  contactHoursTitle: "",
  contactHoursSubtitle: "",
  contactHoursDay1: "",
  contactHoursValue1: "",
  contactHoursDay2: "",
  contactHoursValue2: "",
  contactHoursDay3: "",
  contactHoursValue3: "",
  contactHoursDay4: "",
  contactHoursValue4: "",
  contactHoursDay5: "",
  contactHoursValue5: "",
  contactHoursDay6: "",
  contactHoursValue6: "",
  contactHoursDay7: "",
  contactHoursValue7: "",
  contactMapQuery: "",
  contactMapLinkUrl: "",
  contactMapLatitude: "",
  contactMapLongitude: "",
  contactHeroImagePath: "",
  contactHeroTitleStart: "",
  contactHeroTitleAccent: "",
  contactHeroSubtitle: "",
  footerShortInfo: "",
  footerPhoneValue: "",
  footerWhatsappNumber: "",
  footerEmailValue: "",
  footerLocationValue: "",
  footerAddressValue: "",
  footerFacebookUrl: "#",
  footerInstagramUrl: "#"
};

function buildInitialForm(settings, content) {
  const aceulle = content?.aceulle || {};
  const brand = content?.brand || {};
  const footer = content?.footer || {};
  const faqPage = content?.faqPage || {};
  const contactPage = content?.contactPage || {};

  return {
    ...DEFAULT_FORM,
    browserTitle: brand.browserTitle || brand.name || "",
    faviconImagePath: brand.faviconImagePath || brand.logoImagePath || "",
    headerLogoImagePath: brand.logoImagePath || "",
    footerLogoImagePath: footer.logoImagePath || brand.logoImagePath || "",
    homeHeroImagePath: aceulle.heroImagePath || "",
    homeEyebrow: aceulle.eyebrow || "",
    homeTitle: aceulle.title || "",
    homeFeatureRentalLabel: aceulle.featureRentalLabel || "",
    homeFeatureRentalText: aceulle.featureRentalText || "",
    homeFeatureContactLabel: aceulle.featureContactLabel || "",
    homeFeatureContactText: aceulle.featureContactText || "",
    homeFleetTitle: aceulle.fleetTitle || "",
    homeCarHotelImagePath: aceulle.carHotelImagePath || "",
    homeCarHotelTitle: aceulle.carHotelTitle || "",
    homeCarHotelDescription: aceulle.carHotelDescription || "",
    homeCarHotelServicesTitle: aceulle.carHotelServicesTitle || "",
    homeCarHotelService1: aceulle.carHotelServices?.[0] || "",
    homeCarHotelService2: aceulle.carHotelServices?.[1] || "",
    homeCarHotelService3: aceulle.carHotelServices?.[2] || "",
    homeCarHotelService4: aceulle.carHotelServices?.[3] || "",
    homeTestimonialsTitle: aceulle.testimonialsTitle || "",
    homeTestimonialsHighlight: aceulle.testimonialsHighlight || "",
    homeTestimonialsTextLine1: aceulle.testimonialsTextLine1 || "",
    homeTestimonialsTextLine2: aceulle.testimonialsTextLine2 || "",
    homeTestimonial1Text: aceulle.testimonialsItems?.[0]?.text || "",
    homeTestimonial1Name: aceulle.testimonialsItems?.[0]?.name || "",
    homeTestimonial1Role: aceulle.testimonialsItems?.[0]?.title || "",
    homeTestimonial2Text: aceulle.testimonialsItems?.[1]?.text || "",
    homeTestimonial2Name: aceulle.testimonialsItems?.[1]?.name || "",
    homeTestimonial2Role: aceulle.testimonialsItems?.[1]?.title || "",
    homeTestimonial3Text: aceulle.testimonialsItems?.[2]?.text || "",
    homeTestimonial3Name: aceulle.testimonialsItems?.[2]?.name || "",
    homeTestimonial3Role: aceulle.testimonialsItems?.[2]?.title || "",
    homeTestimonial4Text: aceulle.testimonialsItems?.[3]?.text || "",
    homeTestimonial4Name: aceulle.testimonialsItems?.[3]?.name || "",
    homeTestimonial4Role: aceulle.testimonialsItems?.[3]?.title || "",
    homeTestimonial5Text: aceulle.testimonialsItems?.[4]?.text || "",
    homeTestimonial5Name: aceulle.testimonialsItems?.[4]?.name || "",
    homeTestimonial5Role: aceulle.testimonialsItems?.[4]?.title || "",
    homeConvertiblesTitle: aceulle.convertiblesTitle || "",
    homeConvertibleVehicleIds: Array.isArray(aceulle.convertibleVehicleIds)
      ? aceulle.convertibleVehicleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [],
    faqHeroImagePath: faqPage.heroImagePath || "",
    faqHeroTitleStart: faqPage.heroTitleStart || "",
    faqHeroTitleAccent: faqPage.heroTitleAccent || "",
    faqHeroSubtitle: faqPage.heroSubtitle || "",
    faqPageTitle: faqPage.pageTitle || "",
    faqContactButtonLabel: faqPage.contactButtonLabel || "",
    faqLeftQuestion1: faqPage.leftItems?.[0]?.question || "",
    faqLeftAnswer1: faqPage.leftItems?.[0]?.answer || "",
    faqLeftQuestion2: faqPage.leftItems?.[1]?.question || "",
    faqLeftAnswer2: faqPage.leftItems?.[1]?.answer || "",
    faqLeftQuestion3: faqPage.leftItems?.[2]?.question || "",
    faqLeftAnswer3: faqPage.leftItems?.[2]?.answer || "",
    faqLeftQuestion4: faqPage.leftItems?.[3]?.question || "",
    faqLeftAnswer4: faqPage.leftItems?.[3]?.answer || "",
    faqLeftQuestion5: faqPage.leftItems?.[4]?.question || "",
    faqLeftAnswer5: faqPage.leftItems?.[4]?.answer || "",
    faqLeftQuestion6: faqPage.leftItems?.[5]?.question || "",
    faqLeftAnswer6: faqPage.leftItems?.[5]?.answer || "",
    faqRightQuestion1: faqPage.rightItems?.[0]?.question || "",
    faqRightAnswer1: faqPage.rightItems?.[0]?.answer || "",
    faqRightQuestion2: faqPage.rightItems?.[1]?.question || "",
    faqRightAnswer2: faqPage.rightItems?.[1]?.answer || "",
    faqRightQuestion3: faqPage.rightItems?.[2]?.question || "",
    faqRightAnswer3: faqPage.rightItems?.[2]?.answer || "",
    faqRightQuestion4: faqPage.rightItems?.[3]?.question || "",
    faqRightAnswer4: faqPage.rightItems?.[3]?.answer || "",
    faqRightQuestion5: faqPage.rightItems?.[4]?.question || "",
    faqRightAnswer5: faqPage.rightItems?.[4]?.answer || "",
    faqRightQuestion6: faqPage.rightItems?.[5]?.question || "",
    faqRightAnswer6: faqPage.rightItems?.[5]?.answer || "",
    contactHoursTitle: contactPage.hoursTitle || "",
    contactHoursSubtitle: contactPage.hoursSubtitle || "",
    contactHoursDay1: contactPage.hoursItems?.[0]?.day || "",
    contactHoursValue1: contactPage.hoursItems?.[0]?.value || "",
    contactHoursDay2: contactPage.hoursItems?.[1]?.day || "",
    contactHoursValue2: contactPage.hoursItems?.[1]?.value || "",
    contactHoursDay3: contactPage.hoursItems?.[2]?.day || "",
    contactHoursValue3: contactPage.hoursItems?.[2]?.value || "",
    contactHoursDay4: contactPage.hoursItems?.[3]?.day || "",
    contactHoursValue4: contactPage.hoursItems?.[3]?.value || "",
    contactHoursDay5: contactPage.hoursItems?.[4]?.day || "",
    contactHoursValue5: contactPage.hoursItems?.[4]?.value || "",
    contactHoursDay6: contactPage.hoursItems?.[5]?.day || "",
    contactHoursValue6: contactPage.hoursItems?.[5]?.value || "",
    contactHoursDay7: contactPage.hoursItems?.[6]?.day || "",
    contactHoursValue7: contactPage.hoursItems?.[6]?.value || "",
    contactMapQuery: contactPage.mapQuery || "",
    contactMapLinkUrl: contactPage.mapLinkUrl || "",
    contactMapLatitude: String(contactPage.mapLatitude || ""),
    contactMapLongitude: String(contactPage.mapLongitude || ""),
    contactHeroImagePath: contactPage.heroImagePath || "",
    contactHeroTitleStart: contactPage.heroTitleStart || "",
    contactHeroTitleAccent: contactPage.heroTitleAccent || "",
    contactHeroSubtitle: contactPage.heroSubtitle || "",
    footerShortInfo: footer.shortInfo || "",
    footerPhoneValue: footer.phoneValue || "",
    footerWhatsappNumber: footer.whatsappNumber || "",
    footerEmailValue: footer.emailValue || "",
    footerLocationValue: footer.locationValue || "",
    footerAddressValue: footer.addressValue || "",
    footerFacebookUrl: footer.facebookUrl || "#",
    footerInstagramUrl: footer.instagramUrl || "#",
    ...(settings || {})
  };
}

function normalizeFormValues(formValues, content) {
  const baseValues = buildInitialForm({}, content);
  const nextValues = {
    ...baseValues,
    ...(formValues || {})
  };

  if (typeof nextValues.homeConvertibleVehicleIds === "string") {
    try {
      const parsedValue = JSON.parse(nextValues.homeConvertibleVehicleIds);
      nextValues.homeConvertibleVehicleIds = Array.isArray(parsedValue)
        ? parsedValue.map((id) => Number(id)).filter((id) => Number.isInteger(id))
        : [];
    } catch (error) {
      nextValues.homeConvertibleVehicleIds = [];
    }
  }

  if (!Array.isArray(nextValues.homeConvertibleVehicleIds)) {
    nextValues.homeConvertibleVehicleIds = [];
  }

  return nextValues;
}

function PreviewCard({ title, children }) {
  return (
    <section className="admin-visual-page__preview-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function FieldSection({ title, description, children }) {
  return (
    <section className="admin-visual-page__field-section">
      <div className="admin-visual-page__field-section-head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="admin-visual-page__field-section-body">{children}</div>
    </section>
  );
}

function VisualEditorSection({ title, preview, children }) {
  return (
    <section className="admin-visual-page__editor-section">
      <div className="admin-visual-page__editor-preview">
        <PreviewCard title={title}>{preview}</PreviewCard>
      </div>
      <div className="admin-visual-page__editor-fields">{children}</div>
    </section>
  );
}

function isMobileVisualViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= 767;
}

function MiniCanvas({ children, className = "", isMobilePreview = false }) {
  return (
    <div
      className={
        "admin-visual-page__mini-canvas-shell " +
        className +
        (isMobilePreview ? " admin-visual-page__mini-canvas-shell--mobile-preview" : "")
      }
    >
      <div className="admin-visual-page__mini-canvas-scale">{children}</div>
    </div>
  );
}

function BrowserTabPreview({ icon, title, isMobilePreview }) {
  return (
    <MiniCanvas
      className="admin-visual-page__mini-canvas-shell--tab"
      isMobilePreview={isMobilePreview}
    >
      <div className="admin-visual-preview__browser-window">
        <div className="admin-visual-preview__browser-toolbar">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="admin-visual-preview__browser-tab-wrap">
          <div className="admin-visual-preview__browser-tab">
            <img src={icon || IMAGE_FALLBACK_SRC} alt="Favicon" onError={handleImageFallback} />
            <span>{title}</span>
          </div>
        </div>
      </div>
    </MiniCanvas>
  );
}

function MiniVehicleCardPreview({ vehicle, className = "" }) {
  if (!vehicle) {
    return null;
  }

  return (
    <div className={className}>
      <div className="vehica-car-card vehica-car-card-v1">
        <div className="vehica-car-card__inner">
          <span className="vehica-car-card-link" aria-hidden="true"></span>

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

function HeaderPreview({ brand, header, isMobilePreview }) {
  const previewItems = [
    { path: "/admin", label: header.dashboardLabel || "Dashboard" },
    { path: "/", label: "ACCUEIL" }
  ];

  return (
    <div
      className={
        "admin-visual-page__flat-preview-shell admin-visual-page__flat-preview-shell--header" +
        (isMobilePreview ? " admin-visual-page__flat-preview-shell--mobile-preview" : "")
      }
    >
      <div className="admin-visual-preview__header-frame">
        <div className="admin-visual-preview__header-row">
          <div className="admin-visual-preview__header-brand">
            <img src={brand.logoImagePath || IMAGE_FALLBACK_SRC} alt={brand.name} onError={handleImageFallback} />
          </div>

          <div className="admin-visual-preview__header-links">
            {previewItems.map((item, index) => (
              <span
                key={item.path}
                className={index === 0 ? "admin-visual-preview__header-link admin-visual-preview__header-link--active" : "admin-visual-preview__header-link"}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeHeroPreview({
  image,
  eyebrow,
  title,
  rentalLabel,
  rentalText,
  contactLabel,
  contactText,
  fleetTitle,
  vehicles,
  isMobilePreview
}) {
  return (
    <MiniCanvas
      className="admin-visual-page__mini-canvas-shell--home"
      isMobilePreview={isMobilePreview}
    >
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <main className="rentzo-home">
          <section className="rentzo-home__hero">
            <div className="vehica-app">
              <div className="vehica-slider vehica-swiper-container">
                <div className="vehica-swiper-wrapper">
                  <div className="vehica-slider__slide" style={{ backgroundImage: "url('" + image + "')" }}>
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
                <div className="vehica-heading__title">{eyebrow}</div>
                <h1 className="vehica-heading__text">
                  <span>{title}</span>
                </h1>
              </div>

              <div className="vehica-features">
                <div className="vehica-features__feature">
                  <div className="vehica-features__icon">
                    <i className="far fa-calendar-alt" aria-hidden="true"></i>
                  </div>
                  <div className="vehica-features__content">
                    <div className="vehica-features__label">{rentalLabel}</div>
                    <div className="vehica-features__text">{rentalText}</div>
                  </div>
                </div>

                <div className="vehica-features__feature">
                  <div className="vehica-features__icon">
                    <i className="fas fa-hotel" aria-hidden="true"></i>
                  </div>
                  <div className="vehica-features__content">
                    <div className="vehica-features__label">{contactLabel}</div>
                    <div className="vehica-features__text">{contactText}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rentzo-home__catalog">
            <div className="rentzo-home__container">
              <div className="vehica-hero-v2-title">
                <h2 className="elementor-heading-title elementor-size-default">{fleetTitle}</h2>
              </div>

              <div className="rentzo-home__grid-wrap">
                <div className="vehica-grid">
                  {vehicles.slice(0, 4).map((vehicle) => (
                    <MiniVehicleCardPreview
                      key={vehicle.id}
                      vehicle={vehicle}
                      className="vehica-grid__element vehica-grid__element--1of4 vehica-grid__element--tablet-1of2 vehica-grid__element--mobile-1of1"
                    />
                  ))}
                </div>
              </div>

              <div className="rentzo-home__cta">
                <div className="elementor-button-wrapper">
                  <span className="elementor-button elementor-size-sm">
                    <span className="elementor-button-content-wrapper">
                      <span className="elementor-button-text">VOIR LES VÉHICULES DISPONIBLES</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </MiniCanvas>
  );
}

function CarHotelPreview({
  image,
  title,
  description,
  servicesTitle,
  services,
  isMobilePreview
}) {
  return (
    <MiniCanvas
      className="admin-visual-page__mini-canvas-shell--hotel"
      isMobilePreview={isMobilePreview}
    >
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <section className="rentzo-home__car-hotel is-visible">
          <div className="rentzo-home__car-hotel-grid">
            <div
              className="rentzo-home__car-hotel-image"
              aria-hidden="true"
              style={{ backgroundImage: "url('" + image + "')" }}
            ></div>

            <div className="rentzo-home__car-hotel-content">
              <h2 className="rentzo-home__car-hotel-title">{title}</h2>

              <div className="rentzo-home__car-hotel-description">
                <p>{description}</p>
              </div>

              <div className="rentzo-home__car-hotel-services-title">
                <p>
                  <strong>{servicesTitle}</strong>
                </p>
              </div>

              <div className="rentzo-home__car-hotel-divider">
                <span></span>
              </div>

              <ul className="rentzo-home__car-hotel-list">
                {services.map((service) => (
                  <li key={service} className="rentzo-home__car-hotel-item">
                    <span className="rentzo-home__car-hotel-item-icon">
                      <svg viewBox="0 0 512 512" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M256 512A256 256 0 1 1 256 0a256 256 0 1 1 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47 111-111c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
                        />
                      </svg>
                    </span>
                    <span className="rentzo-home__car-hotel-item-text">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </MiniCanvas>
  );
}

function TestimonialsPreview({
  title,
  highlight,
  line1,
  line2,
  items,
  isMobilePreview
}) {
  return (
    <MiniCanvas isMobilePreview={isMobilePreview}>
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <section className="rentzo-home__testimonials is-visible">
          <div className="rentzo-home__container">
            <div className="vehica-heading rentzo-home__testimonials-heading">
              <div className="vehica-heading__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="34.011" height="29.76" viewBox="0 0 34.011 29.76" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M11.691-27.634h-7.44a4.086 4.086 0 0 0-2.989 1.262A4.086 4.086 0 0 0 0-23.383v8.5a4.086 4.086 0 0 0 1.262 2.989 4.086 4.086 0 0 0 2.989 1.262H8.5v1.594a3.58 3.58 0 0 1-1.1 2.624 3.58 3.58 0 0 1-2.624 1.1H3.72a2.571 2.571 0 0 0-1.893.764 2.571 2.571 0 0 0-.764 1.893v2.126a2.571 2.571 0 0 0 .764 1.893 2.571 2.571 0 0 0 1.893.764h1.063A10.925 10.925 0 0 0 10.4.631a11.112 11.112 0 0 0 4.052-4.052 10.925 10.925 0 0 0 1.495-5.613v-14.349a4.086 4.086 0 0 0-1.262-2.989 4.086 4.086 0 0 0-2.994-1.262zm2.126 18.6a8.652 8.652 0 0 1-1.229 4.517A9.354 9.354 0 0 1 9.3-1.229 8.652 8.652 0 0 1 4.783 0H3.72a.508.508 0 0 1-.365-.166.508.508 0 0 1-.166-.365v-2.126a.508.508 0 0 1 .166-.365.508.508 0 0 1 .365-.166h1.063A5.623 5.623 0 0 0 8.9-4.916a5.623 5.623 0 0 0 1.727-4.119v-3.72H4.251a2.043 2.043 0 0 1-1.495-.631 2.043 2.043 0 0 1-.631-1.495v-8.5a2.043 2.043 0 0 1 .631-1.495 2.043 2.043 0 0 1 1.495-.631h7.44a2.043 2.043 0 0 1 1.495.631 2.043 2.043 0 0 1 .631 1.495zm15.943-18.6h-7.44a4.086 4.086 0 0 0-2.989 1.262 4.086 4.086 0 0 0-1.262 2.989v8.5a4.086 4.086 0 0 0 1.262 2.989 4.086 4.086 0 0 0 2.989 1.262h4.251v1.594a3.58 3.58 0 0 1-1.1 2.624 3.58 3.58 0 0 1-2.624 1.1h-1.058a2.571 2.571 0 0 0-1.889.764 2.571 2.571 0 0 0-.764 1.893v2.126a2.571 2.571 0 0 0 .764 1.893 2.571 2.571 0 0 0 1.893.764h1.063A10.925 10.925 0 0 0 28.465.631a11.112 11.112 0 0 0 4.052-4.052 10.925 10.925 0 0 0 1.495-5.613v-14.349a4.086 4.086 0 0 0-1.262-2.989 4.086 4.086 0 0 0-2.99-1.262zm2.126 18.6a8.652 8.652 0 0 1-1.229 4.517 9.354 9.354 0 0 1-3.288 3.288A8.652 8.652 0 0 1 22.851 0h-1.062a.508.508 0 0 1-.365-.166.508.508 0 0 1-.166-.365v-2.126a.508.508 0 0 1 .166-.365.508.508 0 0 1 .365-.166h1.063a5.623 5.623 0 0 0 4.118-1.728 5.623 5.623 0 0 0 1.73-4.118v-3.72h-6.38a2.043 2.043 0 0 1-1.495-.631 2.043 2.043 0 0 1-.631-1.495v-8.5a2.043 2.043 0 0 1 .631-1.495 2.043 2.043 0 0 1 1.495-.631h7.44a2.043 2.043 0 0 1 1.495.631 2.043 2.043 0 0 1 .631 1.495z"
                    transform="translate(0 27.634)"
                  />
                </svg>
              </div>

              <h3 className="vehica-heading__title">{title}</h3>

              <div className="vehica-heading__text">
                <span>{highlight}</span> {line1}
                <br />
                {line2}
              </div>
            </div>

            <div className="vehica-app">
              <div className="vehica-testimonial-carousel">
                <div className="vehica-swiper-container">
                  <div className="vehica-swiper-wrapper">
                    {items.slice(0, 3).map((testimonial, index) => (
                      <div
                        key={testimonial.name + "-" + index}
                        className={"vehica-swiper-slide" + (index === 0 ? " vehica-swiper-slide-active" : "")}
                      >
                        <div className="vehica-testimonial-carousel__testimonial">
                          <div className="vehica-testimonial-carousel__content">
                            <div className="vehica-testimonial-carousel__stars" aria-hidden="true">
                              {Array.from({ length: 5 }).map((_, starIndex) => (
                                <span key={testimonial.name + "-star-" + starIndex}>
                                  <svg viewBox="0 0 576 512" aria-hidden="true">
                                    <path
                                      fill="currentColor"
                                      d="M316.9 18.3c-5.5-11.7-22.3-11.7-27.8 0l-64 136.5-149.9 22.5c-12.9 1.9-18 17.8-8.6 27.2l108.6 105.7-25.7 149.1c-2.1 12.5 11 22 22.4 15.8L288 439.6l116.1 64.5c11.5 6.2 24.6-3.4 22.4-15.8l-25.7-149.1 108.6-105.7c9.4-9.4 4.3-25.3-8.6-27.2l-149.9-22.5-64-136.5z"
                                    />
                                  </svg>
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

                  <div className="vehica-testimonial-carousel__pagination">
                    {items.slice(0, 3).map((_, index) => (
                      <span
                        key={"testimonial-page-" + index}
                        className={"vehica-testimonial-carousel__bullet" + (index === 0 ? " is-active" : "")}
                      ></span>
                    ))}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
    </MiniCanvas>
  );
}

function VehiclePillPreview({ title, vehicles, isMobilePreview }) {
  return (
    <MiniCanvas isMobilePreview={isMobilePreview}>
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <section className="rentzo-home__convertibles">
          <div className="rentzo-home__container">
            <div className="vehica-car-tabs-carousel vehica-car-tabs-carousel__arrows-outside">
              <div className="vehica-tabs-top-v2">
                <h3 className="vehica-tabs-top-v2__heading">{title}</h3>
              </div>

              <div className="vehica-carousel-v1 vehica-carousel-v1--cars-4">
                <div className="vehica-carousel__swiper">
                  <div className="vehica-swiper-wrapper" style={{ transform: "translate3d(0,0,0)" }}>
                    {vehicles.slice(0, 4).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="vehica-swiper-slide vehica-carousel-v1__slide"
                        style={{ width: "25%" }}
                      >
                        <div className="rentzo-home__convertibles-slide-inner">
                          <MiniVehicleCardPreview
                            vehicle={vehicle}
                            className="admin-visual-page__mini-slide-card"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="rentzo-home__convertibles-nav rentzo-home__convertibles-nav--prev"
                  aria-label="Voir les vehicules precedents"
                >
                  <svg viewBox="0 0 320 512" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  className="rentzo-home__convertibles-nav rentzo-home__convertibles-nav--next"
                  aria-label="Voir les vehicules suivants"
                >
                  <svg viewBox="0 0 320 512" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
                    />
                  </svg>
                </button>
              </div>

              <div className="rentzo-home__convertibles-cta">
                <div className="elementor-button-wrapper">
                  <span className="elementor-button elementor-size-sm">
                    <span className="elementor-button-content-wrapper">
                      <span className="elementor-button-text">VOIR TOUT</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MiniCanvas>
  );
}

function FaqPreview({ image, title, subtitle, pageTitle, items, isMobilePreview }) {
  return (
    <MiniCanvas
      className="admin-visual-page__mini-canvas-shell--faq"
      isMobilePreview={isMobilePreview}
    >
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <FaqPage
          content={{
            heroImagePath: image,
            heroTitleStart: title,
            heroTitleAccent: "",
            heroSubtitle: subtitle,
            pageTitle,
            contactButtonLabel: "Contact",
            leftItems: items.slice(0, 6),
            rightItems: items.slice(6, 12)
          }}
          onContactClick={() => {}}
        />
      </div>
    </MiniCanvas>
  );
}

function ContactPreview({
  image,
  titleStart,
  titleAccent,
  subtitle,
  hoursTitle,
  hoursSubtitle,
  hoursItems,
  mapText,
  isMobilePreview
}) {
  return (
    <MiniCanvas
      className="admin-visual-page__mini-canvas-shell--contact"
      isMobilePreview={isMobilePreview}
    >
      <div
        className={
          "admin-visual-page__live-preview" +
          (isMobilePreview ? " admin-visual-page__live-preview--mobile-preview" : "")
        }
      >
        <ContactPage
          content={{
            heroImagePath: image,
            heroTitleStart: titleStart,
            heroTitleAccent: titleAccent,
            heroSubtitle: subtitle,
            pageTitle: "Contact",
            shortInfo: "✔︎ Lea Location. Location de voitures de luxe à ALGER.",
            socialTitle: "Suivez-nous",
            hoursTitle,
            hoursSubtitle,
            hoursItems,
            mapQuery: mapText
          }}
          footerContent={{
            phoneValue: "0779 10 74 46",
            emailValue: "lea@gmail.com",
            locationValue: "Alger",
            addressValue: "Alger\nLea Location",
            facebookUrl: "#",
            instagramUrl: "#"
          }}
          brand={{ name: "Lea Location" }}
        />
      </div>
    </MiniCanvas>
  );
}

function FooterPreview({ brand, content, header, isMobilePreview }) {
  const locationValue = content.locationValue || "Alger";
  const shortInfo =
    content.shortInfo ||
    "✔︎ " + brand.name + ". Location de voitures de luxe à " + locationValue + ".";
  const addressValue =
    content.addressValue || [locationValue, content.brandValue || brand.name].filter(Boolean).join("\n");
  const navigationItems = (header?.navigationItems || []).slice(0, 4);
  const footerLogoPath = content.logoImagePath || brand.logoImagePath || IMAGE_FALLBACK_SRC;

  return (
    <div
      className={
        "admin-visual-page__flat-preview-shell admin-visual-page__flat-preview-shell--footer" +
        (isMobilePreview ? " admin-visual-page__flat-preview-shell--mobile-preview" : "")
      }
    >
      <div className="admin-visual-preview__footer-frame">
        <div className="admin-visual-preview__footer">
          <div className="admin-visual-preview__footer-top">
            <div className="admin-visual-preview__footer-brand">
              <img
                src={footerLogoPath}
                alt={brand.name}
                onError={handleImageFallback}
              />

              <p>{shortInfo}</p>
            </div>

            <div className="admin-visual-preview__footer-nav">
              {navigationItems.map((item) => (
                <span key={item.path} className="admin-visual-preview__footer-link">
                  {item.label}
                </span>
              ))}
            </div>

            <div className="admin-visual-preview__footer-meta">
              {content.phoneValue ? <span>{content.phoneValue}</span> : null}
              {content.emailValue ? <span>{content.emailValue}</span> : null}
              {addressValue ? <span>{addressValue}</span> : null}
            </div>
          </div>

          <div className="admin-visual-preview__footer-divider"></div>

          <div className="admin-visual-preview__footer-bottom">
            <span>{content.copyrightText || content.legalText || brand.name}</span>

            <div className="admin-visual-preview__footer-social">
              <span>Facebook</span>
              <span>Instagram</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageDropField({
  label,
  value,
  previewSrc,
  slot,
  isUploading,
  onUpload
}) {
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    await onUpload(file, slot, value);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="admin-visual-page__media-field">
      <div className="admin-visual-page__media-label">{label}</div>

      <div
        className={"admin-visual-page__upload-dropzone" + (isUploading ? " admin-visual-page__upload-dropzone--busy" : "")}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          extractAcceptedFilesFromDrop(event, {
            acceptPrefix: "image",
            maxFiles: 1
          }).then(handleFiles);
        }}
      >
        <div className="admin-visual-page__upload-preview">
          <img src={previewSrc || IMAGE_FALLBACK_SRC} alt={label} onError={handleImageFallback} />
        </div>

        <div className="admin-visual-page__upload-content">
          <strong>{isUploading ? "Envoi en cours..." : "Selectionner ou glisser une image"}</strong>
          <span>JPG, PNG, WEBP, GIF, SVG, HEIC, AVIF, TIFF, ICO et autres formats image.</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ADMIN_VISUAL_IMAGE_ACCEPT}
          className="admin-visual-page__upload-input"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          className="admin-visual-page__upload-button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          Selectionner
        </button>
      </div>
    </div>
  );
}

function buildNextContent(currentContent, formValues) {
  const nextContent = JSON.parse(JSON.stringify(currentContent || {}));
  const nextBrandLogo = formValues.headerLogoImagePath || nextContent.brand?.logoImagePath || "";
  const nextFooterLogo = formValues.footerLogoImagePath || nextContent.footer?.logoImagePath || nextBrandLogo;

  nextContent.brand = {
    ...(nextContent.brand || {}),
    browserTitle: formValues.browserTitle,
    logoImagePath: nextBrandLogo,
    faviconImagePath: formValues.faviconImagePath || nextBrandLogo
  };

  nextContent.aceulle = {
    ...(nextContent.aceulle || {}),
    heroImagePath: formValues.homeHeroImagePath || nextContent.aceulle?.heroImagePath || "",
    eyebrow: formValues.homeEyebrow,
    title: formValues.homeTitle,
    featureRentalLabel: formValues.homeFeatureRentalLabel,
    featureRentalText: formValues.homeFeatureRentalText,
    featureContactLabel: formValues.homeFeatureContactLabel,
    featureContactText: formValues.homeFeatureContactText,
    fleetTitle: formValues.homeFleetTitle,
    carHotelImagePath: formValues.homeCarHotelImagePath || nextContent.aceulle?.carHotelImagePath || "",
    carHotelTitle: formValues.homeCarHotelTitle,
    carHotelDescription: formValues.homeCarHotelDescription,
    carHotelServicesTitle: formValues.homeCarHotelServicesTitle,
    carHotelServices: [
      formValues.homeCarHotelService1,
      formValues.homeCarHotelService2,
      formValues.homeCarHotelService3,
      formValues.homeCarHotelService4
    ].filter(Boolean),
    testimonialsTitle: formValues.homeTestimonialsTitle,
    testimonialsHighlight: formValues.homeTestimonialsHighlight,
    testimonialsTextLine1: formValues.homeTestimonialsTextLine1,
    testimonialsTextLine2: formValues.homeTestimonialsTextLine2,
    testimonialsItems: [
      {
        text: formValues.homeTestimonial1Text,
        name: formValues.homeTestimonial1Name,
        title: formValues.homeTestimonial1Role
      },
      {
        text: formValues.homeTestimonial2Text,
        name: formValues.homeTestimonial2Name,
        title: formValues.homeTestimonial2Role
      },
      {
        text: formValues.homeTestimonial3Text,
        name: formValues.homeTestimonial3Name,
        title: formValues.homeTestimonial3Role
      },
      {
        text: formValues.homeTestimonial4Text,
        name: formValues.homeTestimonial4Name,
        title: formValues.homeTestimonial4Role
      },
      {
        text: formValues.homeTestimonial5Text,
        name: formValues.homeTestimonial5Name,
        title: formValues.homeTestimonial5Role
      }
    ].filter((item) => item.text || item.name || item.title),
    convertiblesTitle: formValues.homeConvertiblesTitle,
    convertibleVehicleIds: Array.isArray(formValues.homeConvertibleVehicleIds)
      ? formValues.homeConvertibleVehicleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : []
  };

  nextContent.footer = {
    ...(nextContent.footer || {}),
    logoImagePath: nextFooterLogo,
    shortInfo: formValues.footerShortInfo,
    phoneValue: formValues.footerPhoneValue,
    whatsappNumber: formValues.footerWhatsappNumber,
    emailValue: formValues.footerEmailValue,
    locationValue: formValues.footerLocationValue,
    addressValue: formValues.footerAddressValue,
    facebookUrl: formValues.footerFacebookUrl,
    instagramUrl: formValues.footerInstagramUrl
  };

  nextContent.faqPage = {
    ...(nextContent.faqPage || {}),
    heroImagePath: formValues.faqHeroImagePath || nextContent.faqPage?.heroImagePath || "",
    heroTitleStart: formValues.faqHeroTitleStart,
    heroTitleAccent: formValues.faqHeroTitleAccent,
    heroSubtitle: formValues.faqHeroSubtitle,
    pageTitle: formValues.faqPageTitle,
    contactButtonLabel: formValues.faqContactButtonLabel,
    leftItems: [
      { question: formValues.faqLeftQuestion1, answer: formValues.faqLeftAnswer1 },
      { question: formValues.faqLeftQuestion2, answer: formValues.faqLeftAnswer2 },
      { question: formValues.faqLeftQuestion3, answer: formValues.faqLeftAnswer3 },
      { question: formValues.faqLeftQuestion4, answer: formValues.faqLeftAnswer4 },
      { question: formValues.faqLeftQuestion5, answer: formValues.faqLeftAnswer5 },
      { question: formValues.faqLeftQuestion6, answer: formValues.faqLeftAnswer6 }
    ],
    rightItems: [
      { question: formValues.faqRightQuestion1, answer: formValues.faqRightAnswer1 },
      { question: formValues.faqRightQuestion2, answer: formValues.faqRightAnswer2 },
      { question: formValues.faqRightQuestion3, answer: formValues.faqRightAnswer3 },
      { question: formValues.faqRightQuestion4, answer: formValues.faqRightAnswer4 },
      { question: formValues.faqRightQuestion5, answer: formValues.faqRightAnswer5 },
      { question: formValues.faqRightQuestion6, answer: formValues.faqRightAnswer6 }
    ]
  };

  nextContent.contactPage = {
    ...(nextContent.contactPage || {}),
    heroImagePath: formValues.contactHeroImagePath || nextContent.contactPage?.heroImagePath || "",
    heroTitleStart: formValues.contactHeroTitleStart,
    heroTitleAccent: formValues.contactHeroTitleAccent,
    heroSubtitle: formValues.contactHeroSubtitle,
    hoursTitle: formValues.contactHoursTitle,
    hoursSubtitle: formValues.contactHoursSubtitle,
    hoursItems: [
      { day: formValues.contactHoursDay1, value: formValues.contactHoursValue1 },
      { day: formValues.contactHoursDay2, value: formValues.contactHoursValue2 },
      { day: formValues.contactHoursDay3, value: formValues.contactHoursValue3 },
      { day: formValues.contactHoursDay4, value: formValues.contactHoursValue4 },
      { day: formValues.contactHoursDay5, value: formValues.contactHoursValue5 },
      { day: formValues.contactHoursDay6, value: formValues.contactHoursValue6 },
      { day: formValues.contactHoursDay7, value: formValues.contactHoursValue7 }
    ],
    mapQuery: formValues.contactMapQuery,
    mapLinkUrl: formValues.contactMapLinkUrl,
    mapLatitude: formValues.contactMapLatitude,
    mapLongitude: formValues.contactMapLongitude
  };

  return nextContent;
}

function AdminVisualPage({ content, brand, header, footer, onContentSaved }) {
  const [formValues, setFormValues] = useState(() => normalizeFormValues(getCachedVisualSettings(), content));
  const [contentSnapshot, setContentSnapshot] = useState(() =>
    JSON.parse(JSON.stringify(content || {}))
  );
  const [isLoading, setIsLoading] = useState(() => !getCachedVisualSettings() && !content);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [vehicles, setVehicles] = useState(() => readCachedVehicleList({ adminView: true }));
  const [isMobilePreview, setIsMobilePreview] = useState(() => isMobileVisualViewport());
  const latestContentRef = useRef(content);
  const latestContentSnapshotRef = useRef(
    JSON.parse(JSON.stringify(content || {}))
  );

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestContentSnapshotRef.current = contentSnapshot;
  }, [contentSnapshot]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePreview(isMobileVisualViewport());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setContentSnapshot(JSON.parse(JSON.stringify(content || {})));
  }, [content]);

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      setIsLoading((currentValue) => (getCachedVisualSettings() ? false : currentValue));
      setErrorMessage("");

      try {
        const settings = await getAdminVisualSettings();

        if (!isActive) {
          return;
        }

        setFormValues(normalizeFormValues(settings, latestContentRef.current));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || "Impossible de charger les reglages visuels.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      try {
        const nextVehicles = await listVehicles({ adminView: true });

        if (!isActive) {
          return;
        }

        setVehicles(Array.isArray(nextVehicles) ? nextVehicles : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicles(readCachedVehicleList({ adminView: true }));
      }
    };

    loadVehicles();

    return () => {
      isActive = false;
    };
  }, []);

  const syncRealtimeContent = (nextFormValues) => {
    const nextContent = buildNextContent(
      latestContentSnapshotRef.current || latestContentRef.current,
      nextFormValues
    );
    setContentSnapshot(JSON.parse(JSON.stringify(nextContent)));
    onContentSaved?.(nextContent);
  };

  const handleChange = (key, value) => {
    setFormValues((current) => {
      const nextFormValues = {
        ...current,
        [key]: value
      };

      syncRealtimeContent(nextFormValues);
      return nextFormValues;
    });
  };

  const handleConvertibleVehicleToggle = (vehicleId) => {
    setFormValues((current) => {
      const currentIds = Array.isArray(current.homeConvertibleVehicleIds)
        ? current.homeConvertibleVehicleIds
        : [];
      const numericId = Number(vehicleId);
      const isSelected = currentIds.includes(numericId);
      const nextIds = isSelected
        ? currentIds.filter((id) => id !== numericId)
        : [...currentIds, numericId];
      const nextFormValues = {
        ...current,
        homeConvertibleVehicleIds: nextIds
      };

      syncRealtimeContent(nextFormValues);
      return nextFormValues;
    });
  };

  const handleUpload = async (file, slot, previousUrl) => {
    setUploadingSlot(slot);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await uploadAdminVisualImage({
        file,
        slot,
        previousUrl
      });

      const nextUrl = response.url || "";

      if (slot === "favicon") {
        handleChange("faviconImagePath", nextUrl);
      }

      if (slot === "header-logo") {
        handleChange("headerLogoImagePath", nextUrl);
      }

      if (slot === "footer-logo") {
        handleChange("footerLogoImagePath", nextUrl);
      }

      if (slot === "home-hero") {
        handleChange("homeHeroImagePath", nextUrl);
      }

      if (slot === "home-car-hotel") {
        handleChange("homeCarHotelImagePath", nextUrl);
      }

      if (slot === "faq-hero") {
        handleChange("faqHeroImagePath", nextUrl);
      }

      if (slot === "contact-hero") {
        handleChange("contactHeroImagePath", nextUrl);
      }
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'envoyer l'image.");
    } finally {
      setUploadingSlot("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveAdminVisualSettings(formValues);
      const nextContent =
        response.content || buildNextContent(contentSnapshot || content, formValues);
      setContentSnapshot(JSON.parse(JSON.stringify(nextContent)));
      setFormValues(normalizeFormValues(response.settings, nextContent));
      onContentSaved?.(nextContent, response.revision);
      setSuccessMessage("Modifications enregistrees et appliquees directement sur le site.");
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'enregistrer les reglages visuels.");
    } finally {
      setIsSaving(false);
    }
  };

  const liveBrand = contentSnapshot?.brand || brand;
  const liveFooter = contentSnapshot?.footer || footer;
  const liveAceulle = contentSnapshot?.aceulle || content.aceulle || {};
  const liveFaqPage = contentSnapshot?.faqPage || content.faqPage || {};
  const liveContactPage = contentSnapshot?.contactPage || content.contactPage || {};
  const previewHeaderLogo = formValues.headerLogoImagePath || liveBrand.logoImagePath;
  const previewFooterLogo = formValues.footerLogoImagePath || liveFooter.logoImagePath || previewHeaderLogo;
  const previewFavicon = formValues.faviconImagePath || previewHeaderLogo;
  const previewHomeHero = formValues.homeHeroImagePath || liveAceulle.heroImagePath || "/home/rentzo-hero.jpg";
  const previewCarHotelImage = formValues.homeCarHotelImagePath || liveAceulle.carHotelImagePath || "/home/rentzo-car-hotel.jpg";
  const previewFaqHero = formValues.faqHeroImagePath || liveFaqPage.heroImagePath || "/home/rentzo-contact-hero.jpg";
  const previewContactHero = formValues.contactHeroImagePath || liveContactPage.heroImagePath || "/home/rentzo-contact-hero.jpg";
  const contactHoursPreview = [
    { day: formValues.contactHoursDay1, value: formValues.contactHoursValue1 },
    { day: formValues.contactHoursDay2, value: formValues.contactHoursValue2 },
    { day: formValues.contactHoursDay3, value: formValues.contactHoursValue3 },
    { day: formValues.contactHoursDay4, value: formValues.contactHoursValue4 },
    { day: formValues.contactHoursDay5, value: formValues.contactHoursValue5 },
    { day: formValues.contactHoursDay6, value: formValues.contactHoursValue6 },
    { day: formValues.contactHoursDay7, value: formValues.contactHoursValue7 }
  ].filter((item) => item.day || item.value);
  const previewFooterBrand = liveFooter.brandValue || liveBrand.name;
  const previewFooterAddress =
    formValues.footerAddressValue || [formValues.footerLocationValue || liveFooter.locationValue, previewFooterBrand].filter(Boolean).join("\n");
  const previewFooterText =
    formValues.footerShortInfo ||
    liveFooter.shortInfo ||
    `✔︎ ${previewFooterBrand}. Location de voitures de luxe à ${formValues.footerLocationValue || liveFooter.locationValue}.`;
  const selectedConvertibleVehicles = (Array.isArray(formValues.homeConvertibleVehicleIds)
    ? formValues.homeConvertibleVehicleIds
    : []
  )
    .map((selectedId) => vehicles.find((vehicle) => Number(vehicle.id) === Number(selectedId)))
    .filter(Boolean);
  const testimonialPreviewItems = [
    {
      text: formValues.homeTestimonial1Text,
      name: formValues.homeTestimonial1Name,
      title: formValues.homeTestimonial1Role
    },
    {
      text: formValues.homeTestimonial2Text,
      name: formValues.homeTestimonial2Name,
      title: formValues.homeTestimonial2Role
    },
    {
      text: formValues.homeTestimonial3Text,
      name: formValues.homeTestimonial3Name,
      title: formValues.homeTestimonial3Role
    },
    {
      text: formValues.homeTestimonial4Text,
      name: formValues.homeTestimonial4Name,
      title: formValues.homeTestimonial4Role
    },
    {
      text: formValues.homeTestimonial5Text,
      name: formValues.homeTestimonial5Name,
      title: formValues.homeTestimonial5Role
    }
    ].filter((item) => item.text || item.name || item.title);
  const previewFooterContent = {
    ...liveFooter,
    logoImagePath: previewFooterLogo,
    shortInfo: previewFooterText,
    phoneValue: formValues.footerPhoneValue || liveFooter.phoneValue,
    whatsappNumber: formValues.footerWhatsappNumber || liveFooter.whatsappNumber,
    emailValue: formValues.footerEmailValue || liveFooter.emailValue,
    locationValue: formValues.footerLocationValue || liveFooter.locationValue,
    addressValue: previewFooterAddress,
    facebookUrl: formValues.footerFacebookUrl || liveFooter.facebookUrl,
    instagramUrl: formValues.footerInstagramUrl || liveFooter.instagramUrl
  };

  if (isLoading) {
    return (
      <main className="admin-visual-page admin-visual-page--centered">
        <p className="status-message">Chargement de la page visuelle...</p>
      </main>
    );
  }

  return (
    <main className="admin-visual-page">
      <section className="admin-visual-page__hero">
        <p className="hero-card__eyebrow">Visuelle</p>
        <h1>Modifier le text</h1>
        <p className="hero-card__text">
          Modifiez ici le favicon, le logo du header, le logo du footer, les coordonnees et les liens sociaux, puis enregistrez pour les afficher sur le site.
        </p>
      </section>

      <form className="admin-visual-page__layout" onSubmit={handleSubmit}>
        <VisualEditorSection
          title="Onglet navigateur"
          preview={
            <BrowserTabPreview
              icon={previewFavicon}
              title={formValues.browserTitle || brand.browserTitle || brand.name}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Onglet navigateur"
            description="Favicon et texte de l'onglet du navigateur."
          >
            <ImageDropField
              label="Logo de l'onglet navigateur"
              value={formValues.faviconImagePath}
              previewSrc={previewFavicon}
              slot="favicon"
              isUploading={uploadingSlot === "favicon"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Texte de l'onglet navigateur</span>
              <input
                type="text"
                value={formValues.browserTitle}
                onChange={(event) => handleChange("browserTitle", event.target.value)}
              />
            </label>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Header"
          preview={
            <HeaderPreview
              brand={{ ...brand, logoImagePath: previewHeaderLogo }}
              header={header}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Header"
            description="Logo et rendu miniature du vrai header."
          >
            <ImageDropField
              label="Logo du header"
              value={formValues.headerLogoImagePath}
              previewSrc={previewHeaderLogo}
              slot="header-logo"
              isUploading={uploadingSlot === "header-logo"}
              onUpload={handleUpload}
            />
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Accueil"
          preview={
            <HomeHeroPreview
              image={previewHomeHero}
              eyebrow={formValues.homeEyebrow || content.aceulle?.eyebrow}
              title={formValues.homeTitle || content.aceulle?.title}
              rentalLabel={formValues.homeFeatureRentalLabel || content.aceulle?.featureRentalLabel}
              rentalText={formValues.homeFeatureRentalText || content.aceulle?.featureRentalText}
              contactLabel={formValues.homeFeatureContactLabel || content.aceulle?.featureContactLabel}
              contactText={formValues.homeFeatureContactText || content.aceulle?.featureContactText}
              fleetTitle={formValues.homeFleetTitle || content.aceulle?.fleetTitle}
              vehicles={vehicles}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Accueil"
            description="Hero principal et blocs de presentation."
          >
            <ImageDropField
              label="Image d'accueil"
              value={formValues.homeHeroImagePath}
              previewSrc={previewHomeHero}
              slot="home-hero"
              isUploading={uploadingSlot === "home-hero"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Texte haut d'accueil</span>
              <input
                type="text"
                value={formValues.homeEyebrow}
                onChange={(event) => handleChange("homeEyebrow", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre d'accueil</span>
              <textarea
                rows="3"
                value={formValues.homeTitle}
                onChange={(event) => handleChange("homeTitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre bloc location</span>
              <textarea
                rows="2"
                value={formValues.homeFeatureRentalLabel}
                onChange={(event) => handleChange("homeFeatureRentalLabel", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Texte bloc location</span>
              <textarea
                rows="3"
                value={formValues.homeFeatureRentalText}
                onChange={(event) => handleChange("homeFeatureRentalText", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre bloc contact</span>
              <textarea
                rows="2"
                value={formValues.homeFeatureContactLabel}
                onChange={(event) => handleChange("homeFeatureContactLabel", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Texte bloc contact</span>
              <textarea
                rows="3"
                value={formValues.homeFeatureContactText}
                onChange={(event) => handleChange("homeFeatureContactText", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre flotte accueil</span>
              <textarea
                rows="2"
                value={formValues.homeFleetTitle}
                onChange={(event) => handleChange("homeFleetTitle", event.target.value)}
              />
            </label>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Avis clients"
          preview={
            <TestimonialsPreview
              title={formValues.homeTestimonialsTitle || content.aceulle?.testimonialsTitle}
              highlight={formValues.homeTestimonialsHighlight || content.aceulle?.testimonialsHighlight}
              line1={formValues.homeTestimonialsTextLine1 || content.aceulle?.testimonialsTextLine1}
              line2={formValues.homeTestimonialsTextLine2 || content.aceulle?.testimonialsTextLine2}
              items={testimonialPreviewItems}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Avis clients"
            description="Texte d'introduction et cartes d'avis."
          >
            <label className="login-form__field">
              <span>Titre avis clients</span>
              <input
                type="text"
                value={formValues.homeTestimonialsTitle}
                onChange={(event) => handleChange("homeTestimonialsTitle", event.target.value)}
              />
            </label>

          <label className="login-form__field">
            <span>Texte mis en avant avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsHighlight}
              onChange={(event) => handleChange("homeTestimonialsHighlight", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Ligne 1 avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsTextLine1}
              onChange={(event) => handleChange("homeTestimonialsTextLine1", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Ligne 2 avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsTextLine2}
              onChange={(event) => handleChange("homeTestimonialsTextLine2", event.target.value)}
            />
          </label>

            {[1, 2, 3, 4, 5].map((index) => (
              <div key={"testimonial-editor-" + index} className="admin-visual-page__subsection">
                <h3>Avis client {index}</h3>

              <label className="login-form__field">
                <span>Texte avis {index}</span>
                <textarea
                  rows="4"
                  value={formValues["homeTestimonial" + index + "Text"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Text", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Nom client {index}</span>
                <input
                  type="text"
                  value={formValues["homeTestimonial" + index + "Name"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Name", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Role client {index}</span>
                <input
                  type="text"
                  value={formValues["homeTestimonial" + index + "Role"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Role", event.target.value)}
                />
              </label>
              </div>
            ))}
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="SECTION LISTE DE VEHICULE"
          preview={
            <VehiclePillPreview
              title={formValues.homeConvertiblesTitle || content.aceulle?.convertiblesTitle}
              vehicles={selectedConvertibleVehicles}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Liste"
            description="Titre de section et vehicules affiches."
          >
            <label className="login-form__field">
              <span>Titre section </span>
              <input
                type="text"
                value={formValues.homeConvertiblesTitle}
                onChange={(event) => handleChange("homeConvertiblesTitle", event.target.value)}
              />
            </label>

            <div className="admin-visual-page__subsection">
              <h3>Vehicules affiches</h3>
              <div className="admin-visual-page__vehicle-selector">
                {vehicles.map((vehicle) => {
                  const isSelected = formValues.homeConvertibleVehicleIds.includes(Number(vehicle.id));

                  return (
                    <label
                      key={vehicle.id}
                      className={
                        "admin-visual-page__vehicle-option" +
                        (isSelected ? " admin-visual-page__vehicle-option--selected" : "")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleConvertibleVehicleToggle(vehicle.id)}
                      />
                      <span>{vehicle.brand} {vehicle.model} {vehicle.version}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Hotel de voitures"
          preview={
            <CarHotelPreview
              image={previewCarHotelImage}
              title={formValues.homeCarHotelTitle || content.aceulle?.carHotelTitle}
              description={formValues.homeCarHotelDescription || content.aceulle?.carHotelDescription}
              servicesTitle={formValues.homeCarHotelServicesTitle || content.aceulle?.carHotelServicesTitle}
              services={[
                formValues.homeCarHotelService1 || content.aceulle?.carHotelServices?.[0],
                formValues.homeCarHotelService2 || content.aceulle?.carHotelServices?.[1],
                formValues.homeCarHotelService3 || content.aceulle?.carHotelServices?.[2],
                formValues.homeCarHotelService4 || content.aceulle?.carHotelServices?.[3]
              ].filter(Boolean)}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Hotel de voitures"
            description="Image, contenu et liste des services."
          >
            <ImageDropField
              label="Image hotel de voitures"
              value={formValues.homeCarHotelImagePath}
              previewSrc={previewCarHotelImage}
              slot="home-car-hotel"
              isUploading={uploadingSlot === "home-car-hotel"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Titre hotel de voitures</span>
              <textarea
                rows="2"
                value={formValues.homeCarHotelTitle}
                onChange={(event) => handleChange("homeCarHotelTitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Description hotel de voitures</span>
              <textarea
                rows="4"
                value={formValues.homeCarHotelDescription}
                onChange={(event) => handleChange("homeCarHotelDescription", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre services hotel</span>
              <input
                type="text"
                value={formValues.homeCarHotelServicesTitle}
                onChange={(event) => handleChange("homeCarHotelServicesTitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Service hotel 1</span>
              <input
                type="text"
                value={formValues.homeCarHotelService1}
                onChange={(event) => handleChange("homeCarHotelService1", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Service hotel 2</span>
              <input
                type="text"
                value={formValues.homeCarHotelService2}
                onChange={(event) => handleChange("homeCarHotelService2", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Service hotel 3</span>
              <input
                type="text"
                value={formValues.homeCarHotelService3}
                onChange={(event) => handleChange("homeCarHotelService3", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Service hotel 4</span>
              <input
                type="text"
                value={formValues.homeCarHotelService4}
                onChange={(event) => handleChange("homeCarHotelService4", event.target.value)}
              />
            </label>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Foire aux questions"
          preview={
            <FaqPreview
              image={previewFaqHero}
              title={
                (formValues.faqHeroTitleStart || content.faqPage?.heroTitleStart) +
                ((formValues.faqHeroTitleAccent || content.faqPage?.heroTitleAccent)
                  ? " " + (formValues.faqHeroTitleAccent || content.faqPage?.heroTitleAccent)
                  : "")
              }
              subtitle={formValues.faqHeroSubtitle || content.faqPage?.heroSubtitle}
              pageTitle={formValues.faqPageTitle || content.faqPage?.pageTitle}
              items={[
                { question: formValues.faqLeftQuestion1 || content.faqPage?.leftItems?.[0]?.question, answer: formValues.faqLeftAnswer1 || content.faqPage?.leftItems?.[0]?.answer },
                { question: formValues.faqLeftQuestion2 || content.faqPage?.leftItems?.[1]?.question, answer: formValues.faqLeftAnswer2 || content.faqPage?.leftItems?.[1]?.answer },
                { question: formValues.faqLeftQuestion3 || content.faqPage?.leftItems?.[2]?.question, answer: formValues.faqLeftAnswer3 || content.faqPage?.leftItems?.[2]?.answer }
              ]}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Foire aux questions"
            description="Hero FAQ, bouton et toutes les questions."
          >
            <ImageDropField
              label="Image hero FAQ"
              value={formValues.faqHeroImagePath}
              previewSrc={previewFaqHero}
              slot="faq-hero"
              isUploading={uploadingSlot === "faq-hero"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Titre hero FAQ</span>
              <input
                type="text"
                value={formValues.faqHeroTitleStart}
                onChange={(event) => handleChange("faqHeroTitleStart", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Accent titre hero FAQ</span>
              <input
                type="text"
                value={formValues.faqHeroTitleAccent}
                onChange={(event) => handleChange("faqHeroTitleAccent", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Sous-titre hero FAQ</span>
              <textarea
                rows="2"
                value={formValues.faqHeroSubtitle}
                onChange={(event) => handleChange("faqHeroSubtitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre page FAQ</span>
              <input
                type="text"
                value={formValues.faqPageTitle}
                onChange={(event) => handleChange("faqPageTitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Texte bouton contact FAQ</span>
              <input
                type="text"
                value={formValues.faqContactButtonLabel}
                onChange={(event) => handleChange("faqContactButtonLabel", event.target.value)}
              />
            </label>

            <div className="admin-visual-page__subsection">
              <h3>Questions gauche FAQ</h3>
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={"faq-left-" + index} className="admin-visual-page__faq-editor">
                  <label className="login-form__field">
                    <span>Question gauche {index}</span>
                    <textarea
                      rows="2"
                      value={formValues["faqLeftQuestion" + index]}
                      onChange={(event) => handleChange("faqLeftQuestion" + index, event.target.value)}
                    />
                  </label>

                  <label className="login-form__field">
                    <span>Reponse gauche {index}</span>
                    <textarea
                      rows="3"
                      value={formValues["faqLeftAnswer" + index]}
                      onChange={(event) => handleChange("faqLeftAnswer" + index, event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="admin-visual-page__subsection">
              <h3>Questions droite FAQ</h3>
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={"faq-right-" + index} className="admin-visual-page__faq-editor">
                  <label className="login-form__field">
                    <span>Question droite {index}</span>
                    <textarea
                      rows="2"
                      value={formValues["faqRightQuestion" + index]}
                      onChange={(event) => handleChange("faqRightQuestion" + index, event.target.value)}
                    />
                  </label>

                  <label className="login-form__field">
                    <span>Reponse droite {index}</span>
                    <textarea
                      rows="3"
                      value={formValues["faqRightAnswer" + index]}
                      onChange={(event) => handleChange("faqRightAnswer" + index, event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Contact"
          preview={
            <ContactPreview
              image={previewContactHero}
              titleStart={formValues.contactHeroTitleStart || content.contactPage?.heroTitleStart}
              titleAccent={formValues.contactHeroTitleAccent || content.contactPage?.heroTitleAccent}
              subtitle={formValues.contactHeroSubtitle || content.contactPage?.heroSubtitle}
              hoursTitle={formValues.contactHoursTitle || content.contactPage?.hoursTitle}
              hoursSubtitle={formValues.contactHoursSubtitle || content.contactPage?.hoursSubtitle}
              hoursItems={contactHoursPreview}
              mapText={formValues.contactMapLinkUrl || formValues.contactMapQuery || content.contactPage?.mapQuery}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Contact"
            description="Hero contact, horaires et map."
          >
            <div className="admin-visual-page__subsection">
              <h3>Contact - horaires et map</h3>

              <ImageDropField
                label="Image hero contact"
                value={formValues.contactHeroImagePath}
                previewSrc={previewContactHero}
                slot="contact-hero"
                isUploading={uploadingSlot === "contact-hero"}
                onUpload={handleUpload}
              />

              <label className="login-form__field">
                <span>Titre hero contact</span>
                <input
                  type="text"
                  value={formValues.contactHeroTitleStart}
                  onChange={(event) => handleChange("contactHeroTitleStart", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Accent titre hero contact</span>
                <input
                  type="text"
                  value={formValues.contactHeroTitleAccent}
                  onChange={(event) => handleChange("contactHeroTitleAccent", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Sous-titre hero contact</span>
                <textarea
                  rows="2"
                  value={formValues.contactHeroSubtitle}
                  onChange={(event) => handleChange("contactHeroSubtitle", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Titre horaires</span>
                <input
                  type="text"
                  value={formValues.contactHoursTitle}
                  onChange={(event) => handleChange("contactHoursTitle", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Sous-titre horaires</span>
                <textarea
                  rows="2"
                  value={formValues.contactHoursSubtitle}
                  onChange={(event) => handleChange("contactHoursSubtitle", event.target.value)}
                />
              </label>

              {[1, 2, 3, 4, 5, 6, 7].map((index) => (
                <div key={"contact-hours-" + index} className="admin-visual-page__faq-editor">
                  <label className="login-form__field">
                    <span>Jour {index}</span>
                    <input
                      type="text"
                      value={formValues["contactHoursDay" + index]}
                      onChange={(event) => handleChange("contactHoursDay" + index, event.target.value)}
                    />
                  </label>

                  <label className="login-form__field">
                    <span>Horaire {index}</span>
                    <input
                      type="text"
                      value={formValues["contactHoursValue" + index]}
                      onChange={(event) => handleChange("contactHoursValue" + index, event.target.value)}
                    />
                  </label>
                </div>
              ))}

              <label className="login-form__field">
                <span>Lien Google Maps exact</span>
                <input
                  type="text"
                  value={formValues.contactMapLinkUrl}
                  onChange={(event) => handleChange("contactMapLinkUrl", event.target.value)}
                  placeholder="https://share.google/..."
                />
              </label>
            </div>
          </FieldSection>
        </VisualEditorSection>

        <VisualEditorSection
          title="Footer"
          preview={
            <FooterPreview
              brand={{ ...brand, logoImagePath: previewHeaderLogo }}
              content={previewFooterContent}
              header={header}
              isMobilePreview={isMobilePreview}
            />
          }
        >
          <FieldSection
            title="Footer"
            description="Texte, coordonnees et liens sociaux."
          >
            <ImageDropField
              label="Logo du footer"
              value={formValues.footerLogoImagePath}
              previewSrc={previewFooterLogo}
              slot="footer-logo"
              isUploading={uploadingSlot === "footer-logo"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Texte footer</span>
              <textarea
                rows="4"
                value={formValues.footerShortInfo}
                onChange={(event) => handleChange("footerShortInfo", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Telephone</span>
              <input
                type="text"
                value={formValues.footerPhoneValue}
                onChange={(event) => handleChange("footerPhoneValue", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Numero WhatsApp</span>
              <input
                type="text"
                value={formValues.footerWhatsappNumber}
                onChange={(event) => handleChange("footerWhatsappNumber", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Email</span>
              <input
                type="text"
                value={formValues.footerEmailValue}
                onChange={(event) => handleChange("footerEmailValue", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Adresse / bloc bas</span>
              <textarea
                rows="3"
                value={formValues.footerAddressValue}
                onChange={(event) => handleChange("footerAddressValue", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>URL Facebook</span>
              <input
                type="text"
                value={formValues.footerFacebookUrl}
                onChange={(event) => handleChange("footerFacebookUrl", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>URL Instagram</span>
              <input
                type="text"
                value={formValues.footerInstagramUrl}
                onChange={(event) => handleChange("footerInstagramUrl", event.target.value)}
              />
            </label>
          </FieldSection>
        </VisualEditorSection>

        {errorMessage ? <p className="login-form__message login-form__message--error">{errorMessage}</p> : null}
        {successMessage ? <p className="login-form__message login-form__message--success">{successMessage}</p> : null}

        <button type="submit" className="login-form__submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}

export default AdminVisualPage;
