import { getVehicleCardImageUrl, formatVehiclePrice } from "../utils/vehicleFormatters";
import { handleImageFallback } from "../utils/imageFallback";

function getVehicleTitle(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function getPhotoCount(vehicle) {
  return Array.isArray(vehicle.photoUrls) ? vehicle.photoUrls.length : 0;
}

function getPrimaryImage(vehicle) {
  const firstPhoto = Array.isArray(vehicle.photoUrls) ? vehicle.photoUrls[0] : "";
  return getVehicleCardImageUrl(firstPhoto) || "/home/rentzo-catalog-hero.jpg";
}

function VehicleCard(props) {
  const content = props.content;
  const vehicle = props.vehicle;
  const onOpen = props.onOpen;
  const showAdminState = props.showAdminState;
  const availabilityLabel = props.availabilityLabel;
  const viewMode = props.viewMode || "grid";
  const compareMode = props.compareMode;
  const isCompared = props.isCompared;
  const onCompareToggle = props.onCompareToggle;
  const vehicleTitle = getVehicleTitle(vehicle);
  const photoCount = getPhotoCount(vehicle);
  const hasVideo = Boolean(vehicle.videoUrl);
  const mediaRatio = viewMode === "list" ? "37.8%" : "84.52380952381%";
  const isHiddenState =
    vehicle.availabilityStatus === "maintenance" ||
    vehicle.availabilityStatus === "reserved";
  const statusVisible = Boolean(showAdminState && isHiddenState && availabilityLabel);
  const cardClassName =
    "vehica-car-card vehica-car vehica-car-card-v2" +
    (viewMode === "list" ? " vehica-car-card--list" : "") +
    (isCompared ? " vehica-car-card--is-compare" : "");
  const compareId = "vehica-compare-" + vehicle.id;

  return (
    <div id={"vehica-car-" + vehicle.id} data-id={vehicle.id} className={cardClassName}>
      <div className="vehica-car-card__inner">
        <div
          className={
            "vehica-car-card__compare" +
            (compareMode ? " vehica-car-card__compare--visible" : "")
          }
        >
          <div className="vehica-compare-add">
            <div className="vehica-checkbox" onClick={(event) => event.stopPropagation()}>
              <input
                id={compareId}
                type="checkbox"
                checked={isCompared}
                onChange={() => onCompareToggle(vehicle.id)}
              />
              <label htmlFor={compareId}>{content.compareToggleLabel}</label>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="vehica-car-card-link"
          onClick={onOpen}
          aria-label={content.detailActionLabel + ": " + vehicleTitle}
        />

        <div className="vehica-car-card__image-bg">
          <div className="vehica-car-card__image" style={{ paddingTop: mediaRatio }}>
            <img
              src={getPrimaryImage(vehicle)}
              alt={vehicleTitle}
              loading="lazy"
              decoding="async"
              onError={handleImageFallback}
              sizes={
                viewMode === "list"
                  ? "(max-width: 1023px) 100vw, 520px"
                  : "(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 25vw"
              }
            />

            <div className="vehica-car-card__image-info">
              {statusVisible ? (
                <span className="rentzo-catalog-card__status">{availabilityLabel}</span>
              ) : null}

              <span className="vehica-car-card__image-info__photos">
                {hasVideo ? (
                  <span className="vehica-car-card__image-info__media">
                    <i className="fas fa-video" aria-hidden="true"></i>
                    <span>1</span>
                  </span>
                ) : null}

                <span className="vehica-car-card__image-info__media">
                  <i className="far fa-images" aria-hidden="true"></i>
                  <span>{photoCount}</span>
                </span>
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
              {vehicle.seats} {content.seatsSuffix}
            </div>
            <div className="vehica-car-card__info__single">{vehicle.transmission}</div>
            <div className="vehica-car-card__info__single">{vehicle.fuelType}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
