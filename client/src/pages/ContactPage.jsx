function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6.5h16A1.5 1.5 0 0 1 21.5 8v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z"
        fill="none"
        stroke="currentColor"
      />
      <path d="M3.5 8l8.5 6 8.5-6" fill="none" stroke="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" aria-hidden="true">
      <path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true">
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
  );
}

function SocialIcon({ href, label, children }) {
  const externalProps = href && href !== "#" ? { target: "_blank", rel: "noreferrer" } : {};

  return (
    <div className="vehica-social-icon">
      <a href={href || "#"} title={label} aria-label={label} {...externalProps}>
        {children}
      </a>
    </div>
  );
}

function ContactPage({ content, footerContent, brand }) {
  const phoneValue = footerContent.phoneValue || "0779 10 74 46";
  const emailValue = footerContent.emailValue || "lea@gmail.com";
  const telHref = "tel:" + phoneValue.replace(/[^+\d]/g, "");
  const mailHref = emailValue ? "mailto:" + emailValue : "#";
  const addressValue =
    footerContent.addressValue ||
    [footerContent.locationValue || "Alger", brand.name].filter(Boolean).join("\n");
  const mapQuery = content.mapQuery || "Alger Centre, Alger, Algeria";
  const mapLinkUrl = content.mapLinkUrl || "";
  const hasManualCoordinates =
    content.mapLatitude !== undefined &&
    content.mapLatitude !== null &&
    String(content.mapLatitude).trim() !== "" &&
    content.mapLongitude !== undefined &&
    content.mapLongitude !== null &&
    String(content.mapLongitude).trim() !== "";
  const coordinatesQuery = hasManualCoordinates
    ? String(content.mapLatitude).trim() + "," + String(content.mapLongitude).trim()
    : "";
  const resolvedMapQuery = coordinatesQuery || mapQuery;
  const locationHref =
    mapLinkUrl ||
    "https://maps.google.com/?q=" + encodeURIComponent(resolvedMapQuery);
  const mapSrc =
    "https://maps.google.com/maps?q=" +
    encodeURIComponent(resolvedMapQuery) +
    "&t=m&z=15&output=embed&iwloc=near";
  const heroImagePath = content.heroImagePath || "/home/rentzo-contact-hero.jpg";

  return (
    <main className="rentzo-contact-page">
      <section
        className="rentzo-contact-hero"
        style={{ backgroundImage: "url('" + heroImagePath + "')" }}
      >
        <div className="rentzo-contact-hero__overlay"></div>

        <div className="rentzo-contact-hero__inner">
          <h1 className="rentzo-contact-hero__title">
            {content.heroTitleStart} <span className="vehica-text-primary">{content.heroTitleAccent}</span>
          </h1>
          <h2 className="rentzo-contact-hero__subtitle">{content.heroSubtitle}</h2>
        </div>
      </section>

      <section className="rentzo-pattern-divider" aria-hidden="true">
        <div className="rentzo-pattern-divider__inner"></div>
      </section>

      <section className="rentzo-contact-main">
        <div className="rentzo-contact-main__container">
          <article className="rentzo-contact-main__column rentzo-contact-main__column--info">
            <h1 className="rentzo-contact-main__title">{content.pageTitle}</h1>
            <div className="rentzo-contact-main__spacer rentzo-contact-main__spacer--title"></div>

            <div className="vehica-short-info rentzo-contact-main__short-info">
              <div className="vehica-short-info__inner">{content.shortInfo}</div>
            </div>
            <div className="rentzo-contact-main__spacer rentzo-contact-main__spacer--regular"></div>

            <div className="vehica-address rentzo-contact-main__address">
              <a href={locationHref} target="_blank" rel="noreferrer">
                <span>{addressValue}</span>
              </a>
            </div>
            <div className="rentzo-contact-main__spacer rentzo-contact-main__spacer--regular"></div>

            <div className="vehica-phone rentzo-contact-main__phone">
              <div className="vehica-phone-v1">
                <a className="vehica-phone-highlight" href={telHref}>
                  {phoneValue}
                </a>
              </div>
            </div>
            <div className="rentzo-contact-main__spacer rentzo-contact-main__spacer--small"></div>

            <div className="vehica-email rentzo-contact-main__email">
              <a className="vehica-email__link" href={mailHref}>
                <span className="vehica-email__icon">
                  <EmailIcon />
                </span>
                <span>{emailValue}</span>
              </a>
            </div>
            <div className="rentzo-contact-main__spacer rentzo-contact-main__spacer--regular"></div>

            <div className="vehica-social-profiles rentzo-contact-main__socials">
              <div className="vehica-social-profiles__v2">
                <div className="vehica-social-profiles__v2__inner">
                  <div className="vehica-social-profiles__v2__title">{content.socialTitle}</div>

                  <SocialIcon href={footerContent.facebookUrl} label="Facebook">
                    <FacebookIcon />
                  </SocialIcon>

                  <SocialIcon href={footerContent.instagramUrl} label="Instagram">
                    <InstagramIcon />
                  </SocialIcon>

                </div>
              </div>
            </div>
          </article>

          <div className="rentzo-contact-main__column rentzo-contact-main__column--empty" aria-hidden="true">
            <div className="rentzo-contact-main__ghost-form"></div>
          </div>
        </div>
      </section>

      <section className="rentzo-contact-divider" aria-hidden="true">
        <div className="rentzo-contact-divider__container">
          <div className="rentzo-contact-divider__line"></div>
        </div>
      </section>

      <section className="rentzo-contact-hours">
        <div className="rentzo-contact-hours__column rentzo-contact-hours__column--info">
          <div className="rentzo-contact-hours__inner">
            <div className="rentzo-contact-hours__spacer rentzo-contact-hours__spacer--top"></div>
            <h2>{content.hoursTitle}</h2>
            <div className="rentzo-contact-hours__spacer rentzo-contact-hours__spacer--minor"></div>
            <h3>{content.hoursSubtitle}</h3>
            <div className="rentzo-contact-hours__spacer rentzo-contact-hours__spacer--major"></div>

            <div className="rentzo-contact-hours__text">
              <ul>
                {(content.hoursItems || []).map((item) => (
                  <li key={item.day}>
                    <span className="vehica-day-label">
                      <strong>{item.day}</strong>: {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rentzo-contact-hours__spacer rentzo-contact-hours__spacer--bottom"></div>
          </div>
        </div>

        <div className="rentzo-contact-hours__column rentzo-contact-hours__column--map">
          <div className="elementor-custom-embed">
            <iframe loading="lazy" src={mapSrc} title={brand.name} aria-label={brand.name}></iframe>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
