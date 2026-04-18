import { useEffect, useRef, useState } from "react";
import { handleImageFallback } from "../utils/imageFallback";

function MobilePhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.2 3.5h2.7c.4 0 .8.3.9.7l.8 3.3a1 1 0 0 1-.3 1l-1.6 1.4a14.7 14.7 0 0 0 5.5 5.5l1.4-1.6a1 1 0 0 1 1-.3l3.3.8c.4.1.7.5.7.9v2.7c0 .6-.4 1-.9 1.1-.7.1-1.4.2-2 .2C9.3 20.2 3.8 14.7 3.8 8.2c0-.7.1-1.4.2-2 .1-.5.5-.9 1.1-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MobileEmailIcon() {
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

function Header({
  brand,
  header,
  footerContent,
  currentAdmin,
  currentPath,
  isProfilePage,
  isMenuOpen,
  onMenuClose,
  onMenuToggle,
  onNavigate,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  onClientsClick
}) {
  const accountMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const menuItemRefs = useRef({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [menuHoverStyle, setMenuHoverStyle] = useState({
    opacity: 0,
    width: "0px",
    transform: "translateX(0px)"
  });

  const telHref = footerContent?.phoneValue ? "tel:" + footerContent.phoneValue.replace(/[^+\d]/g, "") : "#";
  const mailHref = footerContent?.emailValue ? "mailto:" + footerContent.emailValue : "#";
  const headerLogoPath = brand.logoImagePath || "/home/rentzo-logo.jpg";

  const navigationItems = currentAdmin
    ? [
        {
          label: header.dashboardLabel,
          path: "/admin"
        },
        ...header.navigationItems.filter((item) => item.path !== "/commencer"),
        {
          label: header.clientsLabel,
          path: "/reservations"
        },
        {
          label: header.visualLabel,
          path: "/admin/visuelle"
        }
      ]
    : header.navigationItems;

  const isNavItemActive = (itemPath) => {
    if (itemPath === "/") {
      return currentPath === "/";
    }

    return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
  };

  const updateMenuHover = (path) => {
    const itemElement = menuItemRefs.current[path];

    if (!desktopMenuRef.current || !itemElement) {
      setMenuHoverStyle({
        opacity: 0,
        width: "0px",
        transform: "translateX(0px)"
      });
      return;
    }

    setMenuHoverStyle({
      opacity: 1,
      width: itemElement.offsetWidth + "px",
      transform: "translateX(" + itemElement.offsetLeft + "px)"
    });
  };

  const hideMenuHover = () => {
    setMenuHoverStyle((currentValue) => ({
      ...currentValue,
      opacity: 0
    }));
  };

  const handleNavigate = (path) => {
    setIsMobileNavOpen(false);
    onMenuClose();

    if (path === "/reservations") {
      onClientsClick();
      return;
    }

    onNavigate(path);
  };

  const handleLogin = () => {
    setIsMobileNavOpen(false);
    onMenuClose();
    onLoginClick();
  };

  const handleProfile = () => {
    setIsMobileNavOpen(false);
    onMenuClose();
    onProfileClick();
  };

  const handleLogout = () => {
    setIsMobileNavOpen(false);
    onMenuClose();
    onLogoutClick();
  };

  const handleAccountButtonClick = (event) => {
    event.stopPropagation();

    if (currentAdmin) {
      onMenuToggle();
      return;
    }

    handleLogin();
  };

  useEffect(() => {
    let frameId = 0;

    const updateScrollState = () => {
      const currentScroll = window.scrollY || window.pageYOffset || 0;

      setIsScrolled((currentValue) => {
        if (currentValue) {
          return currentScroll > 20;
        }

        return currentScroll > 110;
      });

      frameId = 0;
    };

    const handleScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setMenuHoverStyle((currentValue) => {
        if (!currentValue.opacity) {
          return currentValue;
        }

        return {
          ...currentValue,
          opacity: 0
        };
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    onMenuClose();
  }, [currentPath]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current || !accountMenuRef.current.contains(event.target)) {
        onMenuClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onMenuClose();
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, onMenuClose]);

  const headerClassName = [
    "vehica-app",
    "vehica-header",
    "vehica-header--with-submit-button",
    "vehica-header--no-dashboard-link",
    isScrolled ? "vehica-menu-sticky-active" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div className="vehica-hide-mobile vehica-hide-tablet">
        <div className="vehica-menu__desktop">
          <div className="vehica-menu__wrapper">
            <div className="vehica-menu__left">
              <div className="vehica-logo">
                <button
                  type="button"
                  className="rentzo-logo-button"
                  aria-label={brand.name}
                  onClick={() => handleNavigate("/")}
                >
                  <img src={headerLogoPath} alt={brand.name} onError={handleImageFallback} />
                </button>
              </div>

              <div className="vehica-logo vehica-logo--sticky">
                <button
                  type="button"
                  className="rentzo-logo-button"
                  aria-label={brand.name}
                  onClick={() => handleNavigate("/")}
                >
                  <img src={headerLogoPath} alt={brand.name} onError={handleImageFallback} />
                </button>
              </div>

              <div
                className="vehica-menu__container"
                onMouseLeave={hideMenuHover}
              >
                <div
                  className="vehica-menu-hover"
                  style={menuHoverStyle}
                ></div>

                <div className="vehica-menu" ref={desktopMenuRef}>
                  {navigationItems.map((item) => (
                    <div
                      key={item.path}
                      ref={(node) => {
                        if (node) {
                          menuItemRefs.current[item.path] = node;
                        } else {
                          delete menuItemRefs.current[item.path];
                        }
                      }}
                      className={
                        "menu-item vehica-menu-item-depth-0" +
                        (isNavItemActive(item.path) ? " current-menu-item" : "")
                      }
                      onMouseEnter={() => updateMenuHover(item.path)}
                    >
                      <button
                        type="button"
                        title={item.label}
                        className="vehica-menu__link"
                        onClick={() => handleNavigate(item.path)}
                      >
                        {item.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="vehica-menu__sticky-submit">
              <div className="rentzo-account-menu" ref={accountMenuRef}>
                <button
                  type="button"
                  className="vehica-button vehica-button--menu-submit"
                  aria-expanded={currentAdmin ? isMenuOpen : false}
                  onClick={handleAccountButtonClick}
                >
                  <span className="vehica-menu-item-depth-0">
                    <span className="rentzo-account-menu__plus">+</span>
                    <span>{header.accountLabel}</span>
                  </span>
                </button>

                {currentAdmin && isMenuOpen ? (
                  <div className="rentzo-account-menu__popup">
                    <div className="rentzo-account-menu__identity">
                      <strong>{currentAdmin.username}</strong>
                      <span>{currentAdmin.role}</span>
                    </div>

                    <button
                      type="button"
                      className={
                        "rentzo-account-menu__action" +
                        (isProfilePage ? " rentzo-account-menu__action--active" : "")
                      }
                      onClick={handleProfile}
                    >
                      {header.profileLabel}
                    </button>

                    <button
                      type="button"
                      className="rentzo-account-menu__action"
                      onClick={handleLogout}
                    >
                      {header.logoutLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vehica-hide-desktop">
        <div className="vehica-mobile-menu__wrapper vehica-mobile-menu__wrapper--mobile-simple-menu vehica-hide-desktop">
          <div className="vehica-mobile-menu__hamburger">
            <button
              type="button"
              className="rentzo-menu-button"
              aria-label="Ouvrir le menu"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="15"
                viewBox="0 0 28 21"
                className="vehica-menu-icon"
              >
                <g transform="translate(-11925 99)">
                  <rect width="28" height="4.2" rx="1.5" transform="translate(11925 -99)" fill="#A7A7A7" />
                  <rect width="19.6" height="4.2" rx="1.5" transform="translate(11925 -90.6)" fill="#A7A7A7" />
                  <rect width="14" height="4.2" rx="1.5" transform="translate(11925 -82.2)" fill="#A7A7A7" />
                </g>
              </svg>
            </button>
          </div>

          <div className="vehica-mobile-menu__logo vehica-mobile-menu__logo--right">
            <div className="vehica-logo">
              <button
                type="button"
                className="rentzo-logo-button"
                aria-label={brand.name}
                onClick={() => handleNavigate("/")}
              >
                <img src={headerLogoPath} alt={brand.name} onError={handleImageFallback} />
              </button>
            </div>
          </div>

          <div className={"vehica-mobile-menu__open" + (isMobileNavOpen ? " vehica-active" : "")}>
            <div className="vehica-mobile-menu__open__content">
              <div className="vehica-mobile-menu__open__top">
                <div className="vehica-mobile-menu__open__top__submit-button">
                  <button
                    type="button"
                    className="vehica-button"
                    onClick={currentAdmin ? handleProfile : handleLogin}
                  >
                    <span className="vehica-menu-item-depth-0">
                      <span className="rentzo-account-menu__plus">+</span>
                      <span>{header.accountLabel}</span>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="vehica-mobile-menu__open__top__x"
                  aria-label={header.closeButtonLabel}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20.124" height="21.636" viewBox="0 0 20.124 21.636">
                    <g transform="translate(-11872.422 99.636)">
                      <path
                        d="M20.163-1.122a2.038,2.038,0,0,1,.61,1.388A1.989,1.989,0,0,1,20.05,1.79a2.4,2.4,0,0,1-1.653.649,2.116,2.116,0,0,1-1.637-.754l-6.034-6.94-6.1,6.94a2.18,2.18,0,0,1-1.637.754A2.364,2.364,0,0,1,1.37,1.79,1.989,1.989,0,0,1,.648.266a2.02,2.02,0,0,1,.578-1.388l6.58-7.363L1.45-15.636a2.038,2.038,0,0,1-.61-1.388,1.989,1.989,0,0,1,.722-1.524A2.364,2.364,0,0,1,3.184-19.2a2.177,2.177,0,0,1,1.669.785l5.874,6.669,5.809-6.669A2.177,2.177,0,0,1,18.2-19.2a2.364,2.364,0,0,1,1.621.649,1.989,1.989,0,0,1,.722,1.524,2.02,2.02,0,0,1-.578,1.388L13.615-8.485Z"
                        transform="translate(11871.773 -80.439)"
                        fill="#A7A7A7"
                      />
                    </g>
                  </svg>
                </button>
              </div>

              <div className="vehica-mobile-menu__nav">
                <div className="vehica-menu">
                  {navigationItems.map((item) => (
                    <div
                      key={item.path}
                      className={
                        "menu-item vehica-menu-item-depth-0" +
                        (isNavItemActive(item.path) ? " current-menu-item" : "")
                      }
                    >
                      <button
                        type="button"
                        title={item.label}
                        className="vehica-menu__link"
                        onClick={() => handleNavigate(item.path)}
                      >
                        {item.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="vehica-mobile-menu__info">
                {footerContent?.phoneValue ? (
                  <a href={telHref} className="rentzo-mobile-menu__info-link">
                    <span className="rentzo-mobile-menu__info-icon">
                      <MobilePhoneIcon />
                    </span>
                    <span>{footerContent.phoneValue}</span>
                  </a>
                ) : null}

                {footerContent?.emailValue ? (
                  <a href={mailHref} className="rentzo-mobile-menu__info-link">
                    <span className="rentzo-mobile-menu__info-icon">
                      <MobileEmailIcon />
                    </span>
                    <span>{footerContent.emailValue}</span>
                  </a>
                ) : null}
              </div>

              <div className="vehica-mobile-menu__info rentzo-mobile-menu__account">
                {currentAdmin ? (
                  <>
                    <div className="rentzo-mobile-menu__identity">
                      <strong>{currentAdmin.username}</strong>
                      <span>{currentAdmin.role}</span>
                    </div>

                    <button
                      type="button"
                      className="rentzo-mobile-menu__action"
                      onClick={handleProfile}
                    >
                      {header.profileLabel}
                    </button>

                    <button
                      type="button"
                      className="rentzo-mobile-menu__action"
                      onClick={handleLogout}
                    >
                      {header.logoutLabel}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="rentzo-mobile-menu__action"
                    onClick={handleLogin}
                  >
                    {header.loginLabel}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={"vehica-mobile-menu-mask" + (isMobileNavOpen ? " vehica-mobile-menu-mask--active" : "")}
            aria-label="Fermer le menu mobile"
            onClick={() => setIsMobileNavOpen(false)}
          ></button>
        </div>
      </div>
    </header>
  );
}

export default Header;
