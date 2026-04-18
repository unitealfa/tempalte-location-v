import { useEffect, useState } from "react";
import { getVehicleCardImageUrl } from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

function getVehicleName(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function getVisibleVehicles(vehicles, offset) {
  if (vehicles.length <= 4) {
    return vehicles;
  }

  const visibleVehicles = [];
  let cursor = offset;

  while (visibleVehicles.length < 4) {
    visibleVehicles.push(vehicles[cursor % vehicles.length]);
    cursor += 1;
  }

  return visibleVehicles;
}

function CompareDrawer(props) {
  const content = props.content;
  const vehicles = props.vehicles;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const onRemove = props.onRemove;
  const onComparePageOpen = props.onComparePageOpen;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (vehicles.length <= 1) {
      setOffset(0);
      return;
    }

    if (offset < vehicles.length) {
      return;
    }

    setOffset(0);
  }, [offset, vehicles.length]);

  if (vehicles.length === 0) {
    return null;
  }

  const visibleVehicles = getVisibleVehicles(vehicles, offset);
  const placeholderCount = Math.max(0, 4 - visibleVehicles.length);
  const showCarouselButtons = vehicles.length > 4;

  return (
    <>
      <div className="vehica-compare-mobile-wrapper">
        {vehicles.length > 1 ? (
          <button
            type="button"
            className="vehica-compare-mobile-wrapper__inner"
            onClick={onComparePageOpen}
          >
            {content.compareToggleLabel} ({vehicles.length})
          </button>
        ) : (
          <span className="vehica-compare-mobile-wrapper__inner">
            {content.compareSelectOneMoreLabel}
          </span>
        )}
      </div>

      <div className="vehica-compare-area-wrapper">
        <div className="vehica-compare-area-inner">
          <div
            className={
              "vehica-compare-area vehica-compare-area--count-" + vehicles.length
            }
          >
            <div className="vehica-compare-area__top">
              <button
                type="button"
                className={
                  "vehica-compare-area__label" +
                  (isOpen ? " vehica-compare-area__label--open" : "")
                }
                onClick={onToggleOpen}
              >
                <i className="fas fa-exchange-alt" aria-hidden="true"></i>
                {content.compareToggleLabel} ({vehicles.length})
              </button>
            </div>

            <div
              className={
                "vehica-compare-area__inner" +
                (isOpen ? " vehica-compare-area__inner--open" : "")
              }
            >
              <div className="vehica-compare-area__listings">
                {visibleVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="vehica-compare-area__listing vehica-compare-area__listing--filled"
                  >
                    <div className="vehica-compare-area__image">
                      {vehicle.photoUrls && vehicle.photoUrls[0] ? (
                        <img
                          src={getVehicleCardImageUrl(vehicle.photoUrls[0])}
                          alt={getVehicleName(vehicle)}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageFallback}
                        />
                      ) : (
                        <div className="vehica-compare-area__icon"></div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="vehica-compare-area__remove"
                      onClick={() => onRemove(vehicle.id)}
                      aria-label={content.compareRemoveLabel}
                    >
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </button>

                    <button
                      type="button"
                      className="vehica-compare-area__name"
                      onClick={() => props.onVehicleOpen(vehicle.id)}
                    >
                      {getVehicleName(vehicle)}
                    </button>
                  </div>
                ))}

                {Array.from({ length: placeholderCount }).map((_, index) => (
                  <div
                    key={"placeholder-" + index}
                    className="vehica-compare-area__listing"
                  >
                    <div className="vehica-compare-area__image vehica-compare-area__image--placeholder"></div>
                  </div>
                ))}
              </div>

              <div className="vehica-compare-area__buttons">
                {vehicles.length > 1 ? (
                  <div className="vehica-compare-area__button">
                    <button
                      type="button"
                      className="vehica-button vehica-button--icon vehica-button--icon--compare"
                      onClick={onComparePageOpen}
                    >
                      {content.compareToggleLabel}
                    </button>
                  </div>
                ) : (
                  <div className="vehica-compare-area__one-more">
                    {content.compareDrawerHint}
                  </div>
                )}

                {showCarouselButtons ? (
                  <div className="vehica-compare-area__carousel-buttons">
                    <button
                      type="button"
                      className="vehica-compare-area__prev"
                      onClick={() => setOffset((currentValue) => {
                        const nextValue = currentValue - 1;
                        return nextValue < 0 ? vehicles.length - 1 : nextValue;
                      })}
                    >
                      <i className="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>

                    <button
                      type="button"
                      className="vehica-compare-area__next"
                      onClick={() => setOffset((currentValue) => {
                        const nextValue = currentValue + 1;
                        return nextValue >= vehicles.length ? 0 : nextValue;
                      })}
                    >
                      <i className="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CompareDrawer;
