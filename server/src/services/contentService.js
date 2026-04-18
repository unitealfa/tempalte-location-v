const fs = require("fs");
const path = require("path");
const defaultContent = require("../config/defaultContent");
const {
  getSiteSetting,
  listSiteSettings,
  upsertSiteSettings
} = require("../repositories/siteSettingsRepository");
const { sanitizeBrandingImageUrl } = require("./mediaUrlService");

const LEGACY_CONTENT_STORAGE_PATH = path.resolve(__dirname, "../data/site-content.json");
const CONTENT_REVISION_SETTING_KEY = "__system.content_revision__";

const VISUAL_DEFAULT_FALLBACKS = {
  brand: {
    browserTitle: "Lea Location",
    faviconImagePath: "/home/rentzo-logo.jpg",
    logoImagePath: "/home/rentzo-logo.jpg"
  },
  aceulle: {
    heroImagePath: "/home/rentzo-hero.jpg",
    carHotelImagePath: "/home/rentzo-car-hotel.jpg"
  },
  faqPage: {
    heroImagePath: "/home/rentzo-contact-hero.jpg"
  },
  contactPage: {
    heroImagePath: "/home/rentzo-contact-hero.jpg",
    mapQuery: "Alger Centre, Alger, Algeria",
    mapLinkUrl: "https://maps.google.com/?q=Alger%20Centre%2C%20Alger%2C%20Algeria"
  },
  footer: {
    logoImagePath: "/home/rentzo-logo.jpg",
    shortInfo: "✔︎ Lea Location. Location de voitures de luxe à ALGER.",
    phoneValue: "0779 10 74 46",
    whatsappNumber: "213779107446",
    emailValue: "lea@gmail.com",
    locationValue: "Alger",
    addressValue: "Alger\nLea Location",
    facebookUrl: "#",
    instagramUrl: "#"
  }
};

const VISUAL_SETTING_KEYS = {
  browserTitle: "brand.browserTitle",
  faviconImagePath: "brand.faviconImagePath",
  headerLogoImagePath: "brand.logoImagePath",
  footerLogoImagePath: "footer.logoImagePath",
  homeHeroImagePath: "aceulle.heroImagePath",
  homeEyebrow: "aceulle.eyebrow",
  homeTitle: "aceulle.title",
  homeFeatureRentalLabel: "aceulle.featureRentalLabel",
  homeFeatureRentalText: "aceulle.featureRentalText",
  homeFeatureContactLabel: "aceulle.featureContactLabel",
  homeFeatureContactText: "aceulle.featureContactText",
  homeFleetTitle: "aceulle.fleetTitle",
  homeCarHotelImagePath: "aceulle.carHotelImagePath",
  homeCarHotelTitle: "aceulle.carHotelTitle",
  homeCarHotelDescription: "aceulle.carHotelDescription",
  homeCarHotelServicesTitle: "aceulle.carHotelServicesTitle",
  homeCarHotelService1: "aceulle.carHotelServices.0",
  homeCarHotelService2: "aceulle.carHotelServices.1",
  homeCarHotelService3: "aceulle.carHotelServices.2",
  homeCarHotelService4: "aceulle.carHotelServices.3",
  homeTestimonialsTitle: "aceulle.testimonialsTitle",
  homeTestimonialsHighlight: "aceulle.testimonialsHighlight",
  homeTestimonialsTextLine1: "aceulle.testimonialsTextLine1",
  homeTestimonialsTextLine2: "aceulle.testimonialsTextLine2",
  homeTestimonial1Text: "aceulle.testimonialsItems.0.text",
  homeTestimonial1Name: "aceulle.testimonialsItems.0.name",
  homeTestimonial1Role: "aceulle.testimonialsItems.0.title",
  homeTestimonial2Text: "aceulle.testimonialsItems.1.text",
  homeTestimonial2Name: "aceulle.testimonialsItems.1.name",
  homeTestimonial2Role: "aceulle.testimonialsItems.1.title",
  homeTestimonial3Text: "aceulle.testimonialsItems.2.text",
  homeTestimonial3Name: "aceulle.testimonialsItems.2.name",
  homeTestimonial3Role: "aceulle.testimonialsItems.2.title",
  homeTestimonial4Text: "aceulle.testimonialsItems.3.text",
  homeTestimonial4Name: "aceulle.testimonialsItems.3.name",
  homeTestimonial4Role: "aceulle.testimonialsItems.3.title",
  homeTestimonial5Text: "aceulle.testimonialsItems.4.text",
  homeTestimonial5Name: "aceulle.testimonialsItems.4.name",
  homeTestimonial5Role: "aceulle.testimonialsItems.4.title",
  homeConvertiblesTitle: "aceulle.convertiblesTitle",
  homeConvertibleVehicleIds: "aceulle.convertibleVehicleIds",
  faqHeroImagePath: "faqPage.heroImagePath",
  faqHeroTitleStart: "faqPage.heroTitleStart",
  faqHeroTitleAccent: "faqPage.heroTitleAccent",
  faqHeroSubtitle: "faqPage.heroSubtitle",
  faqPageTitle: "faqPage.pageTitle",
  faqContactButtonLabel: "faqPage.contactButtonLabel",
  faqLeftQuestion1: "faqPage.leftItems.0.question",
  faqLeftAnswer1: "faqPage.leftItems.0.answer",
  faqLeftQuestion2: "faqPage.leftItems.1.question",
  faqLeftAnswer2: "faqPage.leftItems.1.answer",
  faqLeftQuestion3: "faqPage.leftItems.2.question",
  faqLeftAnswer3: "faqPage.leftItems.2.answer",
  faqLeftQuestion4: "faqPage.leftItems.3.question",
  faqLeftAnswer4: "faqPage.leftItems.3.answer",
  faqLeftQuestion5: "faqPage.leftItems.4.question",
  faqLeftAnswer5: "faqPage.leftItems.4.answer",
  faqLeftQuestion6: "faqPage.leftItems.5.question",
  faqLeftAnswer6: "faqPage.leftItems.5.answer",
  faqRightQuestion1: "faqPage.rightItems.0.question",
  faqRightAnswer1: "faqPage.rightItems.0.answer",
  faqRightQuestion2: "faqPage.rightItems.1.question",
  faqRightAnswer2: "faqPage.rightItems.1.answer",
  faqRightQuestion3: "faqPage.rightItems.2.question",
  faqRightAnswer3: "faqPage.rightItems.2.answer",
  faqRightQuestion4: "faqPage.rightItems.3.question",
  faqRightAnswer4: "faqPage.rightItems.3.answer",
  faqRightQuestion5: "faqPage.rightItems.4.question",
  faqRightAnswer5: "faqPage.rightItems.4.answer",
  faqRightQuestion6: "faqPage.rightItems.5.question",
  faqRightAnswer6: "faqPage.rightItems.5.answer",
  contactHoursTitle: "contactPage.hoursTitle",
  contactHoursSubtitle: "contactPage.hoursSubtitle",
  contactHoursDay1: "contactPage.hoursItems.0.day",
  contactHoursValue1: "contactPage.hoursItems.0.value",
  contactHoursDay2: "contactPage.hoursItems.1.day",
  contactHoursValue2: "contactPage.hoursItems.1.value",
  contactHoursDay3: "contactPage.hoursItems.2.day",
  contactHoursValue3: "contactPage.hoursItems.2.value",
  contactHoursDay4: "contactPage.hoursItems.3.day",
  contactHoursValue4: "contactPage.hoursItems.3.value",
  contactHoursDay5: "contactPage.hoursItems.4.day",
  contactHoursValue5: "contactPage.hoursItems.4.value",
  contactHoursDay6: "contactPage.hoursItems.5.day",
  contactHoursValue6: "contactPage.hoursItems.5.value",
  contactHoursDay7: "contactPage.hoursItems.6.day",
  contactHoursValue7: "contactPage.hoursItems.6.value",
  contactMapQuery: "contactPage.mapQuery",
  contactMapLinkUrl: "contactPage.mapLinkUrl",
  contactMapLatitude: "contactPage.mapLatitude",
  contactMapLongitude: "contactPage.mapLongitude",
  contactHeroImagePath: "contactPage.heroImagePath",
  contactHeroTitleStart: "contactPage.heroTitleStart",
  contactHeroTitleAccent: "contactPage.heroTitleAccent",
  contactHeroSubtitle: "contactPage.heroSubtitle",
  footerShortInfo: "footer.shortInfo",
  footerPhoneValue: "footer.phoneValue",
  footerWhatsappNumber: "footer.whatsappNumber",
  footerEmailValue: "footer.emailValue",
  footerLocationValue: "footer.locationValue",
  footerAddressValue: "footer.addressValue",
  footerFacebookUrl: "footer.facebookUrl",
  footerInstagramUrl: "footer.instagramUrl"
};

let siteContentCache = null;
let hasLoadedFromDatabase = false;
let siteContentRevisionCache = "0";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function setPathValue(target, pathKey, value) {
  const pathParts = pathKey.split(".");
  const lastKey = pathParts.pop();
  let currentTarget = target;

  for (const part of pathParts) {
    if (!currentTarget[part] || typeof currentTarget[part] !== "object") {
      currentTarget[part] = {};
    }

    currentTarget = currentTarget[part];
  }

  currentTarget[lastKey] = value;
}

function getPathValue(target, pathKey) {
  return pathKey.split(".").reduce((currentValue, key) => currentValue?.[key], target);
}

function getBaseContent() {
  const baseContent = cloneValue(defaultContent);

  return {
    ...baseContent,
    brand: {
      ...VISUAL_DEFAULT_FALLBACKS.brand,
      ...(baseContent.brand || {})
    },
    aceulle: {
      ...VISUAL_DEFAULT_FALLBACKS.aceulle,
      ...(baseContent.aceulle || {})
    },
    faqPage: {
      ...VISUAL_DEFAULT_FALLBACKS.faqPage,
      ...(baseContent.faqPage || {})
    },
    contactPage: {
      ...VISUAL_DEFAULT_FALLBACKS.contactPage,
      ...(baseContent.contactPage || {})
    },
    footer: {
      ...VISUAL_DEFAULT_FALLBACKS.footer,
      ...(baseContent.footer || {})
    }
  };
}

function applyVisualSettings(baseContent, settingsMap) {
  const nextContent = cloneValue(baseContent);

  Object.entries(VISUAL_SETTING_KEYS).forEach(([formKey, contentPath]) => {
    const value = settingsMap[formKey];

    if (typeof value === "string" && value.trim() !== "") {
      if (formKey === "homeConvertibleVehicleIds") {
        try {
          const parsedValue = JSON.parse(value);

          if (Array.isArray(parsedValue)) {
            setPathValue(nextContent, contentPath, parsedValue);
          }
        } catch (error) {
        }

        return;
      }

      setPathValue(nextContent, contentPath, value.trim());
    }
  });

  nextContent.brand = {
    ...(nextContent.brand || {}),
    faviconImagePath: sanitizeBrandingImageUrl(nextContent.brand?.faviconImagePath),
    logoImagePath: sanitizeBrandingImageUrl(nextContent.brand?.logoImagePath)
  };
  nextContent.footer = {
    ...(nextContent.footer || {}),
    logoImagePath: sanitizeBrandingImageUrl(nextContent.footer?.logoImagePath)
  };
  nextContent.aceulle = {
    ...(nextContent.aceulle || {}),
    heroImagePath: sanitizeBrandingImageUrl(nextContent.aceulle?.heroImagePath),
    carHotelImagePath: sanitizeBrandingImageUrl(nextContent.aceulle?.carHotelImagePath)
  };
  nextContent.faqPage = {
    ...(nextContent.faqPage || {}),
    heroImagePath: sanitizeBrandingImageUrl(nextContent.faqPage?.heroImagePath)
  };
  nextContent.contactPage = {
    ...(nextContent.contactPage || {}),
    heroImagePath: sanitizeBrandingImageUrl(nextContent.contactPage?.heroImagePath)
  };

  return nextContent;
}

function buildVisualSettingsFromContent(content) {
  return Object.fromEntries(
    Object.entries(VISUAL_SETTING_KEYS).map(([formKey, contentPath]) => [
      formKey,
      Array.isArray(getPathValue(content, contentPath))
        ? JSON.stringify(getPathValue(content, contentPath))
        : String(getPathValue(content, contentPath) || "").trim()
    ])
  );
}

function loadLegacyVisualSettings() {
  try {
    if (!fs.existsSync(LEGACY_CONTENT_STORAGE_PATH)) {
      return null;
    }

    const rawValue = fs.readFileSync(LEGACY_CONTENT_STORAGE_PATH, "utf8");
    const parsedValue = JSON.parse(rawValue);
    return buildVisualSettingsFromContent({
      ...getBaseContent(),
      ...parsedValue,
      brand: {
        ...getBaseContent().brand,
        ...(parsedValue.brand || {})
      },
      footer: {
        ...getBaseContent().footer,
        ...(parsedValue.footer || {})
      }
    });
  } catch (error) {
    return null;
  }
}

async function readVisualSettingsMapFromDatabase() {
  try {
    const rows = await listSiteSettings();

    if (rows.length === 0) {
      const legacySettings = loadLegacyVisualSettings();

      if (legacySettings) {
        await upsertVisualSettings(legacySettings);
        return legacySettings;
      }
    }

    return rows.reduce((settingsMap, row) => {
      const matchingEntry = Object.entries(VISUAL_SETTING_KEYS).find(([, contentPath]) => contentPath === row.key);

      if (matchingEntry) {
        settingsMap[matchingEntry[0]] = String(row.value || "").trim();
      }

      return settingsMap;
    }, {});
  } catch (error) {
    return {};
  }
}

async function upsertVisualSettings(settings) {
  const entries = Object.entries(VISUAL_SETTING_KEYS).map(([formKey, contentPath]) => ({
    key: contentPath,
    value: String(settings[formKey] || "").trim()
  }));

  await upsertSiteSettings(entries);
}

async function readPersistedContentRevision() {
  try {
    const revisionSetting = await getSiteSetting(CONTENT_REVISION_SETTING_KEY);

    if (revisionSetting?.value) {
      return String(revisionSetting.value).trim() || siteContentRevisionCache;
    }
  } catch (error) {
  }

  return siteContentRevisionCache;
}

async function bumpContentRevision() {
  const nextRevision = String(Date.now());

  await upsertSiteSettings([
    {
      key: CONTENT_REVISION_SETTING_KEY,
      value: nextRevision
    }
  ]);

  siteContentRevisionCache = nextRevision;
  return nextRevision;
}

async function hydrateSiteContent(forceRefresh = false) {
  const persistedRevision = await readPersistedContentRevision();
  const shouldRefresh =
    forceRefresh ||
    !siteContentCache ||
    !hasLoadedFromDatabase ||
    persistedRevision !== siteContentRevisionCache;

  if (!shouldRefresh) {
    return cloneValue(siteContentCache);
  }

  const settingsMap = await readVisualSettingsMapFromDatabase();
  const nextContent = applyVisualSettings(getBaseContent(), settingsMap);
  siteContentCache = nextContent;
  hasLoadedFromDatabase = true;
  siteContentRevisionCache = persistedRevision;
  return cloneValue(siteContentCache);
}

async function getHomePageContent() {
  return hydrateSiteContent();
}

async function getCurrentSiteContent() {
  return hydrateSiteContent();
}

async function getCurrentSiteContentStatus() {
  return {
    revision: await readPersistedContentRevision()
  };
}

async function replaceHomePageContent(nextContent) {
  siteContentCache = cloneValue(nextContent);
  await upsertVisualSettings(buildVisualSettingsFromContent(siteContentCache));
  await bumpContentRevision();
  return cloneValue(siteContentCache);
}

async function getVisualSettings() {
  const currentContent = await hydrateSiteContent();
  return buildVisualSettingsFromContent(currentContent);
}

async function updateVisualSettings(payload = {}) {
  const currentContent = await hydrateSiteContent();
  const nextVisualSettings = Object.fromEntries(
    Object.entries(VISUAL_SETTING_KEYS).map(([formKey, contentPath]) => {
      const hasPayloadValue = Object.prototype.hasOwnProperty.call(payload, formKey);
      const rawPayloadValue = hasPayloadValue ? payload[formKey] : undefined;
      const payloadValue = hasPayloadValue
        ? Array.isArray(rawPayloadValue)
          ? JSON.stringify(rawPayloadValue)
          : String(rawPayloadValue ?? "").trim()
        : undefined;
      const currentValue = String(getPathValue(currentContent, contentPath) || "").trim();

      return [formKey, hasPayloadValue ? payloadValue : currentValue];
    })
  );

  await upsertVisualSettings(nextVisualSettings);
  siteContentCache = applyVisualSettings(getBaseContent(), nextVisualSettings);
  const revision = await bumpContentRevision();

  return {
    content: cloneValue(siteContentCache),
    revision,
    visualSettings: nextVisualSettings
  };
}

module.exports = {
  getHomePageContent,
  getCurrentSiteContent,
  getCurrentSiteContentStatus,
  replaceHomePageContent,
  getVisualSettings,
  updateVisualSettings
};
