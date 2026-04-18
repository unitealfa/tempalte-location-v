import { handleImageFallback } from "../utils/imageFallback";

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

function Footer({ brand, content, header, onNavigate }) {
  const phoneValue = content.phoneValue || "0779 10 74 46";
  const emailValue = content.emailValue || "lea@gmail.com";
  const locationValue = content.locationValue || "Alger";
  const telHref = "tel:" + phoneValue.replace(/[^+\d]/g, "");
  const mailHref = emailValue ? "mailto:" + emailValue : "#";
  const footerLogoPath = content.logoImagePath || brand.logoImagePath || "/home/rentzo-logo.jpg";
  const shortInfo =
    content.shortInfo ||
    "✔︎ " + brand.name + ".\nLocation de voitures de luxe à " + locationValue + ".";
  const addressValue =
    content.addressValue || [locationValue, content.brandValue || brand.name].filter(Boolean).join("\n");
  const locationHref =
    content.mapUrl ||
    "https://maps.google.com/?q=" + encodeURIComponent(locationValue + ", Algerie");

  return (
    <footer className="rentzo-footer">
      <section className="rentzo-footer__section">
        <div className="rentzo-footer__container">
          <div className="rentzo-footer__column rentzo-footer__column--brand">
            <div className="vehica-logo-widget">
              <button
                type="button"
                className="rentzo-logo-button rentzo-logo-button--footer"
                onClick={() => onNavigate("/")}
                aria-label={brand.name}
              >
                <img src={footerLogoPath} alt={brand.name} onError={handleImageFallback} />
              </button>
            </div>

            <div className="vehica-short-info">
              <div className="vehica-short-info__inner">{shortInfo}</div>
            </div>
          </div>

          <div className="rentzo-footer__column rentzo-footer__column--nav">
            <div className="vehica-simple_menu vehica-simple-menu--vertical vehica-simple-menu-2-columns">
              <ul className="vehica-simple-menu">
                {header.navigationItems.map((item) => (
                  <li key={item.path} className="menu-item">
                    <button
                      type="button"
                      className="rentzo-footer__nav-button"
                      onClick={() => onNavigate(item.path)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rentzo-footer__column rentzo-footer__column--contact">
            <div className="vehica-phone">
              <div className="vehica-phone-v2">
                <a className="vehica-phone-highlight" href={telHref}>
                  {phoneValue}
                </a>
              </div>
            </div>

            {emailValue ? (
              <div className="vehica-email">
                <a className="vehica-email__link" href={mailHref}>
                  <span className="vehica-email__icon">
                    <EmailIcon />
                  </span>
                  <span>{emailValue}</span>
                </a>
              </div>
            ) : null}

            <div className="vehica-address">
              <a href={locationHref} target="_blank" rel="noreferrer">
                <span>{addressValue}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="rentzo-footer__divider"></div>

        <div className="rentzo-footer__bottom-row">
          <div className="vehica-copyrights">{content.copyrightText || content.legalText}</div>

          <div className="rentzo-footer__bottom-social">
            <div className="vehica-social-profiles">
              <div className="vehica-social-profiles__v1">
                <SocialIcon href={content.facebookUrl} label="Facebook">
                  <FacebookIcon />
                </SocialIcon>

                <SocialIcon href={content.instagramUrl} label="Instagram">
                  <InstagramIcon />
                </SocialIcon>

              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

export default Footer;
