import { useLayoutEffect, useRef, useState } from "react";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true">
      <path d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true">
      <path d="M201.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 173.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
    </svg>
  );
}

function Spacer({ className }) {
  return (
    <div className={className + " elementor-widget elementor-widget-spacer"}>
      <div className="elementor-widget-container">
        <div className="elementor-spacer">
          <div className="elementor-spacer-inner"></div>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ item, titleId, contentId, isOpen, onToggle, tabNumber }) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    };

    updateHeight();

    let frameId = 0;
    frameId = window.requestAnimationFrame(updateHeight);

    const handleResize = () => {
      updateHeight();
    };

    window.addEventListener("resize", handleResize);

    if (typeof ResizeObserver === "undefined" || !contentRef.current) {
      return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [isOpen, item.answer, item.question]);

  return (
    <div className={"elementor-accordion-item" + (isOpen ? " elementor-accordion-item--open" : "")}>
      <div
        id={titleId}
        className={"elementor-tab-title" + (isOpen ? " elementor-active" : "")}
        data-tab={tabNumber}
        role="button"
        tabIndex={0}
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <span className="elementor-accordion-icon elementor-accordion-icon-right" aria-hidden="true">
          <span className="elementor-accordion-icon-closed">
            <ChevronDownIcon />
          </span>
          <span className="elementor-accordion-icon-opened">
            <ChevronUpIcon />
          </span>
        </span>

        <span className="elementor-accordion-title">{item.question}</span>
      </div>

      <div
        id={contentId}
        className={"elementor-tab-content-shell" + (isOpen ? " elementor-tab-content-shell--open" : "")}
        role="region"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        style={{ maxHeight: isOpen ? String(contentHeight) + "px" : "0px" }}
      >
        <div ref={contentRef} className="elementor-tab-content elementor-clearfix">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

function AccordionColumn({ items, widgetClassName, columnKey }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className={widgetClassName + " vehica-accordion elementor-widget elementor-widget-accordion"}>
      <div className="elementor-widget-container">
        <div className="elementor-accordion">
          {items.map((item, index) => {
            const itemId = columnKey + "-" + index;
            const titleId = "elementor-tab-title-" + itemId;
            const contentId = "elementor-tab-content-" + itemId;
            const isOpen = openId === itemId;

            return (
              <AccordionItem
                key={itemId}
                item={item}
                titleId={titleId}
                contentId={contentId}
                tabNumber={index + 1}
                isOpen={isOpen}
                onToggle={() => setOpenId(isOpen ? null : itemId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FaqPage({ content, onContactClick }) {
  const heroTitleStart = content?.heroTitleStart ?? "Questions";
  const heroTitleAccent = content?.heroTitleAccent ?? "fréquentes";
  const heroSubtitle = content?.heroSubtitle ?? "Nous répondrons à toutes vos questions";
  const pageTitle = content?.pageTitle ?? "Questions fréquentes";
  const contactButtonLabel = content?.contactButtonLabel || "Contact";
  const heroImagePath = content?.heroImagePath || "/home/rentzo-contact-hero.jpg";
  const leftItems = content?.leftItems || [];
  const rightItems = content?.rightItems || [];

  return (
    <main className="rentzo-faq-source">
      <div className="elementor elementor-27299">
        <section
          className="elementor-section elementor-top-section elementor-element elementor-element-b224af9 elementor-section-height-min-height elementor-hidden-mobile elementor-section-boxed elementor-section-height-default elementor-section-items-middle"
          style={{ backgroundImage: "url('" + heroImagePath + "')" }}
        >
          <div className="elementor-background-overlay"></div>

          <div className="elementor-container elementor-column-gap-default">
            <div className="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-f8609ca">
              <div className="elementor-widget-wrap elementor-element-populated">
                <Spacer className="elementor-element elementor-element-d380493" />

                <div className="elementor-element elementor-element-c6a997d elementor-widget elementor-widget-heading">
                  <div className="elementor-widget-container">
                    <h1 className="elementor-heading-title elementor-size-default">
                      {heroTitleAccent ? (
                        <>
                          {heroTitleStart} <span className="vehica-text-primary">{heroTitleAccent}</span>
                        </>
                      ) : (
                        heroTitleStart
                      )}
                    </h1>
                  </div>
                </div>

                <div className="elementor-element elementor-element-8a033d3 elementor-widget elementor-widget-heading">
                  <div className="elementor-widget-container">
                    <h2 className="elementor-heading-title elementor-size-default">{heroSubtitle}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="elementor-section elementor-top-section elementor-element elementor-element-8cb2d9a elementor-section-boxed elementor-section-height-default elementor-section-height-default">
          <div className="elementor-container elementor-column-gap-default">
            <div className="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-61fc3ef">
              <div className="elementor-widget-wrap elementor-element-populated">
                <div className="elementor-element elementor-element-e58b527 elementor-widget-divider--separator-type-pattern elementor-widget-divider--no-spacing elementor-widget-divider--view-line elementor-widget elementor-widget-divider">
                  <div className="elementor-widget-container">
                    <div className="elementor-divider">
                      <span className="elementor-divider-separator"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="elementor-section elementor-top-section elementor-element elementor-element-6509ce9 elementor-section-boxed elementor-section-height-default elementor-section-height-default">
          <div className="elementor-container elementor-column-gap-default">
            <div className="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-951cf7b">
              <div className="elementor-widget-wrap elementor-element-populated">
                <div className="elementor-element elementor-element-8de1214 elementor-widget elementor-widget-heading">
                  <div className="elementor-widget-container">
                    <h1 className="elementor-heading-title elementor-size-default">{pageTitle}</h1>
                  </div>
                </div>

                <Spacer className="elementor-element elementor-element-0fb9abf" />
                <Spacer className="elementor-element elementor-element-29172f4" />
              </div>
            </div>
          </div>
        </section>

        <section className="elementor-section elementor-top-section elementor-element elementor-element-e1400f0 elementor-section-boxed elementor-section-height-default elementor-section-height-default">
          <div className="elementor-container elementor-column-gap-default">
            <div className="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-fe2ba6a">
              <div className="elementor-widget-wrap elementor-element-populated">
                <Spacer className="elementor-element elementor-element-bb3ded4" />
                <Spacer className="elementor-element elementor-element-361084c" />

                <section className="elementor-section elementor-inner-section elementor-element elementor-element-1031699 elementor-section-boxed elementor-section-height-default elementor-section-height-default">
                  <div className="elementor-container elementor-column-gap-default">
                    <div className="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-fbcdc1b">
                      <div className="elementor-widget-wrap elementor-element-populated">
                        <AccordionColumn items={leftItems} widgetClassName="elementor-element elementor-element-9b6660e" columnKey="left" />
                      </div>
                    </div>

                    <div className="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-b8bbd5b">
                      <div className="elementor-widget-wrap elementor-element-populated">
                        <AccordionColumn items={rightItems} widgetClassName="elementor-element elementor-element-c009c3c" columnKey="right" />
                      </div>
                    </div>
                  </div>
                </section>

                <Spacer className="elementor-element elementor-element-7faeb60" />

                <div className="elementor-element elementor-element-c32bc6f elementor-align-center elementor-widget elementor-widget-button">
                  <div className="elementor-widget-container">
                    <div className="elementor-button-wrapper">
                      <button type="button" className="elementor-button elementor-button-link elementor-size-sm" onClick={onContactClick}>
                        <span className="elementor-button-content-wrapper">
                          <span className="elementor-button-text">{contactButtonLabel}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <Spacer className="elementor-element elementor-element-482807e" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FaqPage;
