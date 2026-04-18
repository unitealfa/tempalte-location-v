import { useEffect, useMemo, useState } from "react";
import { listVehicles, readCachedVehicleList } from "../services/vehicleService";
import { formatVehiclePrice, getVehicleCardImageUrl } from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

function getVehicleName(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function getViewportSlots(width) {
  if (width < 768) {
    return 1;
  }

  if (width < 1200) {
    return 2;
  }

  return 3;
}

function buildVisibleVehicles(vehicles, slotCount, offset, lockedVehicleId) {
  if (vehicles.length <= slotCount) {
    return vehicles;
  }

  if (lockedVehicleId) {
    const lockedVehicle = vehicles.find((vehicle) => vehicle.id === lockedVehicleId);
    const remainingVehicles = vehicles.filter((vehicle) => vehicle.id !== lockedVehicleId);

    if (!lockedVehicle) {
      return buildVisibleVehicles(vehicles, slotCount, offset, null);
    }

    const visibleVehicles = [lockedVehicle];
    let cursor = offset;

    while (visibleVehicles.length < slotCount) {
      visibleVehicles.push(remainingVehicles[cursor % remainingVehicles.length]);
      cursor += 1;
    }

    return visibleVehicles;
  }

  const visibleVehicles = [];
  let cursor = offset;

  while (visibleVehicles.length < slotCount) {
    visibleVehicles.push(vehicles[cursor % vehicles.length]);
    cursor += 1;
  }

  return visibleVehicles;
}

function buildCompareRows(content) {
  return [
    {
      key: "daily-price",
      label: content.dailyPriceLabel,
      featured: true,
      getValue: (vehicle) =>
        vehicle.dailyPrice ? formatVehiclePrice(vehicle.dailyPrice) + content.pricePerDaySuffix : "-"
    },
    {
      key: "weekly-price",
      label: content.weeklyPriceLabel,
      featured: true,
      getValue: (vehicle) =>
        vehicle.weeklyPrice ? formatVehiclePrice(vehicle.weeklyPrice) + content.pricePerDaySuffix : "-"
    },
    {
      key: "monthly-price",
      label: content.monthlyPriceLabel,
      featured: true,
      getValue: (vehicle) =>
        vehicle.monthlyPrice ? formatVehiclePrice(vehicle.monthlyPrice) + content.pricePerDaySuffix : "-"
    },
    { key: "brand", label: content.brandLabel, getValue: (vehicle) => vehicle.brand || "-" },
    { key: "model", label: content.modelLabel, getValue: (vehicle) => vehicle.model || "-" },
    { key: "version", label: content.versionLabel, getValue: (vehicle) => vehicle.version || "-" },
    {
      key: "horsepower",
      label: content.horsepowerLabel,
      getValue: (vehicle) => (vehicle.horsepower ? String(vehicle.horsepower) : "-")
    },
    {
      key: "transmission",
      label: content.transmissionLabel,
      getValue: (vehicle) => vehicle.transmission || "-"
    },
    {
      key: "fuel",
      label: content.fuelTypeLabel,
      getValue: (vehicle) => vehicle.fuelType || "-"
    },
    {
      key: "ranges",
      label: content.vehicleRangesLabel,
      getValue: (vehicle) =>
        Array.isArray(vehicle.vehicleRanges) && vehicle.vehicleRanges.length > 0
          ? vehicle.vehicleRanges.join(", ")
          : "-"
    },
    {
      key: "seats",
      label: content.seatsLabel,
      getValue: (vehicle) =>
        vehicle.seats ? String(vehicle.seats) + " " + content.seatsSuffix : "-"
    },
    {
      key: "convertible",
      label: content.convertibleLabel,
      getValue: (vehicle) => (vehicle.isConvertible ? content.yesLabel : content.noLabel)
    },
    {
      key: "deposit",
      label: content.securityDepositLabel,
      getValue: (vehicle) =>
        vehicle.securityDeposit ? formatVehiclePrice(vehicle.securityDeposit) : "-"
    },
    {
      key: "km-day",
      label: content.includedKmPerDayLabel,
      getValue: (vehicle) =>
        vehicle.includedKmPerDay ? String(vehicle.includedKmPerDay) : "-"
    },
    {
      key: "extra-km",
      label: content.extraKmPriceLabel,
      getValue: (vehicle) =>
        vehicle.extraKmPrice ? formatVehiclePrice(vehicle.extraKmPrice) : "-"
    },
    {
      key: "availability",
      label: content.adminAvailabilityLabel,
      getValue: (vehicle) => {
        if (vehicle.availabilityStatus === "maintenance") {
          return content.availabilityMaintenanceLabel;
        }

        if (vehicle.availabilityStatus === "reserved") {
          return content.availabilityReservedLabel;
        }

        return content.availabilityAvailableLabel;
      }
    }
  ];
}

function ComparePage(props) {
  const content = props.content;
  const compareVehicleIds = props.compareVehicleIds;
  const onBackClick = props.onBackClick;
  const onRemove = props.onRemove;
  const onVehicleOpen = props.onVehicleOpen;
  const getCachedComparedVehicles = () => {
    const cachedVehicles = readCachedVehicleList();
    return compareVehicleIds
      .map((vehicleId) => cachedVehicles.find((vehicle) => vehicle.id === vehicleId))
      .filter(Boolean);
  };
  const [vehicles, setVehicles] = useState(() => getCachedComparedVehicles());
  const [isLoading, setIsLoading] = useState(() => getCachedComparedVehicles().length === 0 && compareVehicleIds.length > 0);
  const [errorMessage, setErrorMessage] = useState("");
  const [offset, setOffset] = useState(0);
  const [lockedVehicleId, setLockedVehicleId] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1280 : window.innerWidth
  );

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      setIsLoading(() => vehicles.length === 0 && compareVehicleIds.length > 0);
      setErrorMessage("");

      try {
        const allVehicles = await listVehicles();

        if (isActive === false) {
          return;
        }

        const orderedVehicles = compareVehicleIds
          .map((vehicleId) => allVehicles.find((vehicle) => vehicle.id === vehicleId))
          .filter(Boolean);

        setVehicles(orderedVehicles);
      } catch (error) {
        if (isActive === false) {
          return;
        }

        setErrorMessage(content.compareLoadErrorMessage);
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
  }, [compareVehicleIds, content.compareLoadErrorMessage]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (lockedVehicleId === null) {
      return;
    }

    const stillExists = vehicles.some((vehicle) => vehicle.id === lockedVehicleId);

    if (stillExists === false) {
      setLockedVehicleId(null);
    }
  }, [lockedVehicleId, vehicles]);

  useEffect(() => {
    if (vehicles.length === 0) {
      setOffset(0);
      return;
    }

    if (offset < vehicles.length) {
      return;
    }

    setOffset(0);
  }, [offset, vehicles.length]);

  const visibleSlotCount = getViewportSlots(viewportWidth);
  const visibleVehicles = buildVisibleVehicles(
    vehicles,
    visibleSlotCount,
    offset,
    lockedVehicleId
  );
  const compareRows = useMemo(() => buildCompareRows(content), [content]);
  const showArrows = vehicles.length > visibleSlotCount;

  const goNext = () => {
    if (vehicles.length === 0) {
      return;
    }

    setOffset((currentValue) => {
      const nextValue = currentValue + 1;
      return nextValue >= vehicles.length ? 0 : nextValue;
    });
  };

  const goPrev = () => {
    if (vehicles.length === 0) {
      return;
    }

    setOffset((currentValue) => {
      const nextValue = currentValue - 1;
      return nextValue < 0 ? vehicles.length - 1 : nextValue;
    });
  };

  return (
    <main className="vehica-compare-page vehica-compare-page-shell">
      <section className="vehica-compare-page-section">
        {isLoading ? (
          <div className="vehica-compare__loader">
            <div className="vehica-compare__loader-inner">
              <svg width="120" height="30" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" fill="#A7A7A7" aria-hidden="true">
                <circle cx="15" cy="15" r="15">
                  <animate attributeName="r" from="15" to="15" begin="0s" dur="0.8s" values="15;9;15" calcMode="linear" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" from="1" to="1" begin="0s" dur="0.8s" values="1;.5;1" calcMode="linear" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="15" r="9" fillOpacity="0.3">
                  <animate attributeName="r" from="9" to="9" begin="0s" dur="0.8s" values="9;15;9" calcMode="linear" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" from="0.5" to="0.5" begin="0s" dur="0.8s" values=".5;1;.5" calcMode="linear" repeatCount="indefinite" />
                </circle>
                <circle cx="105" cy="15" r="15">
                  <animate attributeName="r" from="15" to="15" begin="0s" dur="0.8s" values="15;9;15" calcMode="linear" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" from="1" to="1" begin="0s" dur="0.8s" values="1;.5;1" calcMode="linear" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rentzo-catalog-empty">
            <div className="rentzo-catalog-empty__inner">
              <h2>{content.comparePageTitle}</h2>
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rentzo-catalog-empty">
            <div className="rentzo-catalog-empty__inner">
              <h2>{content.comparePageTitle}</h2>
              <p>{content.compareEmptyMessage}</p>
              <button type="button" className="vehica-button vehica-button--outline" onClick={onBackClick}>
                {content.compareBackToSearchLabel}
              </button>
            </div>
          </div>
        ) : (
          <div className={"vehica-compare vehica-compare--count-" + vehicles.length}>
            <div className="vehica-compare__data">
              <div className="vehica-compare__row">
                <div className="vehica-compare__column">
                  <h1 className="vehica-compare__heading">
                    {content.comparePageTitle} ({vehicles.length})
                  </h1>

                  <div className="vehica-compare__buttons">
                    <div className="vehica-compare__back-to-search">
                      <button type="button" className="vehica-button vehica-button--outline" onClick={onBackClick}>
                        {content.compareBackToSearchLabel}
                      </button>
                    </div>

                    {showArrows ? (
                      <div className="vehica-compare__arrows">
                        <button type="button" className="vehica-carousel__arrow vehica-carousel__arrow--left" onClick={goPrev}>
                          <i className="fas fa-chevron-left" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="vehica-carousel__arrow vehica-carousel__arrow--right" onClick={goNext}>
                          <i className="fas fa-chevron-right" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {visibleVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={"vehica-compare__column vehica-compare__column--" + vehicle.id}>
                    <div className="vehica-compare__image-wrapper">
                      <button type="button" className="vehica-compare__image" onClick={() => onVehicleOpen(vehicle.id)}>
                        {vehicle.photoUrls && vehicle.photoUrls[0] ? (
                          <img
                            src={getVehicleCardImageUrl(vehicle.photoUrls[0])}
                            alt={getVehicleName(vehicle)}
                            loading="lazy"
                            decoding="async"
                            onError={handleImageFallback}
                          />
                        ) : (
                          <div className="vehica-compare__image-wrapper__icon"></div>
                        )}
                        <div className="vehica-compare__mask"></div>
                      </button>

                      <button
                        type="button"
                        className="vehica-compare__remove"
                        onClick={() => onRemove(vehicle.id)}
                        aria-label={content.compareRemoveLabel}
                      >
                        <i className="fas fa-times" aria-hidden="true"></i>
                      </button>

                      <button
                        type="button"
                        className="vehica-compare__lock"
                        onClick={() =>
                          setLockedVehicleId((currentValue) =>
                            currentValue === vehicle.id ? null : vehicle.id
                          )
                        }
                      >
                        {lockedVehicleId === vehicle.id ? (
                          <span>
                            <i className="fas fa-lock" aria-hidden="true"></i>
                            {content.compareLockedLabel}
                          </span>
                        ) : (
                          <span>
                            <i className="fas fa-unlock" aria-hidden="true"></i>
                            {content.compareLockLabel}
                          </span>
                        )}
                      </button>
                    </div>

                    <h3 className="vehica-compare__name">
                      <button type="button" onClick={() => onVehicleOpen(vehicle.id)}>
                        {getVehicleName(vehicle)}
                      </button>
                    </h3>
                  </div>
                ))}

                {visibleVehicles.length < visibleSlotCount ? (
                  <div className="vehica-compare__column">
                    <button type="button" className="vehica-compare__image-placeholder" onClick={onBackClick}>
                      <div className="vehica-compare__image-placeholder__inner">
                        <div>
                          <i className="fas fa-plus" aria-hidden="true"></i>
                        </div>
                        <div>{content.compareAddAnotherLabel}</div>
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>

              {compareRows.map((row) => {
                const rowValues = visibleVehicles.map((vehicle) => row.getValue(vehicle));
                const hasAtLeastOneValue = rowValues.some((value) => value && value !== "-");

                if (hasAtLeastOneValue === false) {
                  return null;
                }

                return (
                  <div key={row.key} className="vehica-compare__row">
                    <div
                      className={
                        "vehica-compare__column vehica-compare__column--label" +
                        (row.featured ? " vehica-compare__column--featured-label" : "")
                      }
                    >
                      {row.label}
                    </div>

                    {rowValues.map((value, index) => (
                      <div
                        key={row.key + "-" + visibleVehicles[index].id}
                        className={
                          "vehica-compare__column" +
                          (row.featured ? " vehica-compare__column--featured" : "")
                        }
                      >
                        {value || "-"}
                      </div>
                    ))}

                    {visibleVehicles.length < visibleSlotCount ? (
                      <div className="vehica-compare__column">-</div>
                    ) : null}
                  </div>
                );
              })}

              <div className="vehica-compare__row">
                <div className="vehica-compare__column"></div>

                {visibleVehicles.map((vehicle) => (
                  <div key={"view-" + vehicle.id} className={"vehica-compare__column vehica-compare__column--" + vehicle.id}>
                    <div className="vehica-compare__button">
                      <button type="button" className="vehica-button" onClick={() => onVehicleOpen(vehicle.id)}>
                        {content.compareViewLabel}
                      </button>
                    </div>
                  </div>
                ))}

                {visibleVehicles.length < visibleSlotCount ? (
                  <div className="vehica-compare__column"></div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ComparePage;
