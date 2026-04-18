import { useEffect, useMemo, useState } from "react";
import CompareDrawer from "../components/CompareDrawer";
import VehicleCard from "../components/VehicleCard";
import {
  hasCachedVehicleList,
  listVehicles,
  readCachedVehicleList
} from "../services/vehicleService";

function getUniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "fr", { sensitivity: "base" })
  );
}

function GridViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <g transform="translate(-819 -493)">
        <rect width="9" height="8" rx="3" transform="translate(819 493)" fill="currentColor" />
        <rect width="9" height="8" rx="3" transform="translate(830 493)" fill="currentColor" />
        <rect width="9" height="8" rx="3" transform="translate(830 505)" fill="currentColor" />
        <rect width="9" height="8" rx="3" transform="translate(819 505)" fill="currentColor" />
      </g>
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" viewBox="0 0 25 20" aria-hidden="true">
      <g transform="translate(-830 -493)">
        <rect width="25" height="8" rx="3" transform="translate(830 493)" fill="currentColor" />
        <rect width="25" height="8" rx="3" transform="translate(830 505)" fill="currentColor" />
      </g>
    </svg>
  );
}

function getAvailabilityLabel(vehicle, content) {
  if (vehicle.availabilityStatus === "maintenance") {
    return content.availabilityMaintenanceLabel;
  }

  if (vehicle.availabilityStatus === "reserved") {
    return content.availabilityReservedLabel;
  }

  return content.availabilityAvailableLabel;
}

function FilterField(props) {
  return (
    <div className="vehica-results__field vehica-relation-field">
      <h4 className="vehica-results__field__label">{props.label}</h4>
      {props.children}
    </div>
  );
}

function SelectField(props) {
  const wrapClassName =
    "rentzo-inventory-select-wrap" + (props.value ? " vehica-active-taxonomy" : "");

  return (
    <FilterField label={props.label}>
      <div className={wrapClassName}>
        <select
          className="rentzo-inventory-select"
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        >
          <option value="">{props.placeholder}</option>
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </FilterField>
  );
}

function LocationVehiclesPage(props) {
  const content = props.content;
  const currentAdmin = props.currentAdmin;
  const compareVehicleIds = props.compareVehicleIds || [];
  const onCompareToggle = props.onCompareToggle;
  const onCompareRemove = props.onCompareRemove;
  const onComparePageOpen = props.onComparePageOpen;
  const onCreateClick = props.onCreateClick;
  const onVehicleClick = props.onVehicleClick;
  const adminView = Boolean(currentAdmin);
  const [vehicles, setVehicles] = useState(() => readCachedVehicleList({ adminView }));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !hasCachedVehicleList({ adminView }));
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState("");
  const [seatsFilter, setSeatsFilter] = useState("");
  const [convertibleFilter, setConvertibleFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      setIsLoading(() => !hasCachedVehicleList({ adminView: Boolean(currentAdmin) }));
      setErrorMessage("");

      try {
        const nextVehicles = await listVehicles({
          adminView: Boolean(currentAdmin)
        });

        if (isActive === false) {
          return;
        }

        setVehicles(nextVehicles);
      } catch (error) {
        if (isActive === false) {
          return;
        }

        setErrorMessage(error.message || content.loadErrorMessage);
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
  }, [content.loadErrorMessage, currentAdmin]);

  useEffect(() => {
    if (isMobileFiltersOpen === false) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    if (compareVehicleIds.length > 0) {
      return;
    }

    setIsCompareDrawerOpen(false);
  }, [compareVehicleIds.length]);

  const brandOptions = getUniqueValues(vehicles.map((vehicle) => vehicle.brand)).map((value) => ({
    value,
    label: value
  }));
  const filteredModelSource = brandFilter
    ? vehicles.filter((vehicle) => vehicle.brand === brandFilter)
    : vehicles;
  const modelOptions = getUniqueValues(filteredModelSource.map((vehicle) => vehicle.model)).map((value) => ({
    value,
    label: value
  }));
  const transmissionOptions = getUniqueValues(vehicles.map((vehicle) => vehicle.transmission)).map((value) => ({
    value,
    label: value
  }));
  const fuelTypeOptions = getUniqueValues(vehicles.map((vehicle) => vehicle.fuelType)).map((value) => ({
    value,
    label: value
  }));
  const rangeOptions = getUniqueValues(
    vehicles.flatMap((vehicle) => (Array.isArray(vehicle.vehicleRanges) ? vehicle.vehicleRanges : []))
  ).map((value) => ({
    value,
    label: value
  }));
  const seatsOptions = getUniqueValues(vehicles.map((vehicle) => String(vehicle.seats))).map((value) => ({
    value,
    label: value + " " + content.seatsSuffix
  }));
  const availabilityOptions = [
    { value: "available", label: content.availabilityAvailableLabel },
    { value: "reserved", label: content.availabilityReservedLabel }
  ];

  if (currentAdmin) {
    availabilityOptions.push({
      value: "maintenance",
      label: content.availabilityMaintenanceLabel
    });
  }

  const comparedVehicles = useMemo(
    () =>
      compareVehicleIds
        .map((vehicleId) => vehicles.find((vehicle) => vehicle.id === vehicleId))
        .filter(Boolean),
    [compareVehicleIds, vehicles]
  );

  const visibleVehicles = vehicles
    .filter((vehicle) => {
      if (brandFilter && vehicle.brand !== brandFilter) {
        return false;
      }

      if (modelFilter && vehicle.model !== modelFilter) {
        return false;
      }

      if (transmissionFilter && vehicle.transmission !== transmissionFilter) {
        return false;
      }

      if (fuelTypeFilter && vehicle.fuelType !== fuelTypeFilter) {
        return false;
      }

      if (rangeFilter) {
        const hasSelectedRange =
          Array.isArray(vehicle.vehicleRanges) && vehicle.vehicleRanges.includes(rangeFilter);

        if (hasSelectedRange === false) {
          return false;
        }
      }

      if (seatsFilter && String(vehicle.seats) !== seatsFilter) {
        return false;
      }

      if (convertibleFilter === "yes" && vehicle.isConvertible === false) {
        return false;
      }

      if (convertibleFilter === "no" && vehicle.isConvertible) {
        return false;
      }

      if (availabilityFilter && vehicle.availabilityStatus !== availabilityFilter) {
        return false;
      }

      return true;
    })
    .map((vehicle, index) => ({ vehicle, index }))
    .sort((left, right) => {
      if (sortBy === "price-low-to-high") {
        return left.vehicle.dailyPrice - right.vehicle.dailyPrice;
      }

      if (sortBy === "price-high-to-low") {
        return right.vehicle.dailyPrice - left.vehicle.dailyPrice;
      }

      if (sortBy === "name-a-z") {
        return (left.vehicle.brand + " " + left.vehicle.model).localeCompare(
          right.vehicle.brand + " " + right.vehicle.model,
          "fr",
          { sensitivity: "base" }
        );
      }

      return left.index - right.index;
    })
    .map((entry) => entry.vehicle);

  const activeFilterCount = [
    brandFilter,
    modelFilter,
    transmissionFilter,
    fuelTypeFilter,
    rangeFilter,
    seatsFilter,
    convertibleFilter,
    availabilityFilter
  ].filter((value) => Boolean(value)).length;

  const clearFilters = () => {
    setBrandFilter("");
    setModelFilter("");
    setTransmissionFilter("");
    setFuelTypeFilter("");
    setRangeFilter("");
    setSeatsFilter("");
    setConvertibleFilter("");
    setAvailabilityFilter("");
  };

  const resultLabel =
    visibleVehicles.length === 1
      ? content.resultsSingularLabel
      : content.resultsPluralLabel;
  const hasVehicles = visibleVehicles.length > 0;
  const inventoryClassName =
    "vehica-inventory-v1" +
    (isLoading ? " vehica-inventory-v1__is-reloading" : "") +
    (viewMode === "list" ? " vehica-inventory-v1--view-list" : "");
  const mobileButtonClassName =
    "vehica-inventory-v1__mobile-button-options" +
    (activeFilterCount > 0 ? " vehica-inventory-v1__mobile-button-options--active" : "");
  const filterPanelClassName =
    "vehica-results__fields" +
    (isMobileFiltersOpen ? " vehica-results__fields--mobile-open" : "");
  const resultsClassName =
    "vehica-inventory-v1__results" +
    (viewMode === "list" ? " vehica-inventory-v1__results--list" : "");

  return (
    <main className="rentzo-catalog-page">
      <section className="rentzo-catalog-hero vehica-hide-mobile">
        <div className="rentzo-catalog-hero__overlay"></div>
        <div className="rentzo-catalog-hero__inner">
          <div className="rentzo-catalog-hero__spacer"></div>
          <h1 className="rentzo-catalog-hero__title">
            {content.heroTitleStart} <span className="vehica-text-primary">{content.heroTitleAccent}</span>
          </h1>
          <h2 className="rentzo-catalog-hero__subtitle">{content.heroSubtitle}</h2>
        </div>
      </section>

      <section className="rentzo-catalog-inventory">
        <div className={inventoryClassName}>
          <div className={mobileButtonClassName}>
            <button type="button" onClick={() => setIsMobileFiltersOpen(true)}>
              {content.mobileFiltersLabel}
              {activeFilterCount > 0 ? " (" + activeFilterCount + ")" : ""}
            </button>
          </div>

          <div className="vehica-inventory-v1__top">
            <div className="vehica-inventory-v1__top__inner">
              <div className={filterPanelClassName}>
                <div className="vehica-results__fields__mobile-section-top">
                  <h3 className="vehica-results__fields__mobile-section-top__title">
                    {content.mobileFiltersTitle}
                  </h3>

                  <h4 className="vehica-results__fields__mobile-section-top__subtitle">
                    <span className="vehica-results__fields__mobile-section-top__subtitle__number">
                      {visibleVehicles.length}
                    </span>
                    <span className="vehica-results__fields__mobile-section-top__subtitle__label">
                      {resultLabel}
                    </span>
                    {activeFilterCount > 0 ? (
                      <button
                        type="button"
                        className="vehica-results__fields__mobile-section-top__subtitle__clear"
                        onClick={clearFilters}
                      >
                        {content.clearFiltersLabel}
                      </button>
                    ) : null}
                  </h4>

                  <button
                    type="button"
                    className="vehica-results__fields__mobile-section-top__close"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    aria-label={content.clearFiltersLabel}
                  >
                    <i className="fa fa-times-circle" aria-hidden="true"></i>
                  </button>
                </div>

                                <SelectField
                  label={content.filterVehicleRangeLabel}
                  value={rangeFilter}
                  onChange={setRangeFilter}
                  options={rangeOptions}
                  placeholder={content.filterVehicleRangeLabel}
                />

                <SelectField
                  label={content.filterBrandLabel}
                  value={brandFilter}
                  onChange={(nextValue) => {
                    setBrandFilter(nextValue);
                    setModelFilter("");
                  }}
                  options={brandOptions}
                  placeholder={content.filterBrandLabel}
                />

                <SelectField
                  label={content.filterModelLabel}
                  value={modelFilter}
                  onChange={setModelFilter}
                  options={modelOptions}
                  placeholder={content.filterModelLabel}
                />

                <SelectField
                  label={content.filterTransmissionLabel}
                  value={transmissionFilter}
                  onChange={setTransmissionFilter}
                  options={transmissionOptions}
                  placeholder={content.filterTransmissionLabel}
                />

                <SelectField
                  label={content.filterFuelTypeLabel}
                  value={fuelTypeFilter}
                  onChange={setFuelTypeFilter}
                  options={fuelTypeOptions}
                  placeholder={content.filterFuelTypeLabel}
                />

                <SelectField
                  label={content.filterSeatsLabel}
                  value={seatsFilter}
                  onChange={setSeatsFilter}
                  options={seatsOptions}
                  placeholder={content.filterSeatsLabel}
                />

                <SelectField
                  label={content.filterConvertibleLabel}
                  value={convertibleFilter}
                  onChange={setConvertibleFilter}
                  options={[
                    { value: "yes", label: content.filterConvertibleYesLabel },
                    { value: "no", label: content.filterConvertibleNoLabel }
                  ]}
                  placeholder={content.filterConvertibleLabel}
                />

                <SelectField
                  label={content.filterAvailabilityLabel}
                  value={availabilityFilter}
                  onChange={setAvailabilityFilter}
                  options={availabilityOptions}
                  placeholder={content.filterAvailabilityLabel}
                />

                <div className="vehica-results__fields__clear-load-more">
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      className="vehica-results__fields__clear"
                      onClick={clearFilters}
                    >
                      {content.clearFiltersLabel}
                    </button>
                  ) : null}
                </div>

                <div className="vehica-results__fields__mobile-section-bottom">
                  <button
                    type="button"
                    className="vehica-button rentzo-catalog-mobile-search"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    {content.mobileSearchLabel}
                  </button>
                </div>
              </div>

              <div className="vehica-inventory-v1__bar">
                <div className="vehica-inventory-v1__bar__left">
                  {currentAdmin ? (
                    <button
                      type="button"
                      className="vehica-search-v1__button-clear rentzo-catalog-create rentzo-catalog-create--desktop"
                      onClick={onCreateClick}
                    >
                      {content.createLabel}
                    </button>
                  ) : null}
                </div>

                <div className="vehica-inventory-v1__bar__right">
                  <button
                    type="button"
                    className={
                      "vehica-inventory-v1__compare" +
                      (compareMode ? " vehica-inventory-v1__compare--active" : "")
                    }
                    onClick={() => setCompareMode((currentValue) => currentValue === false)}
                  >
                    <i className="fas fa-exchange-alt" aria-hidden="true"></i>
                    {content.compareToggleLabel}
                    {compareMode ? " (" + comparedVehicles.length + ")" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="vehica-inventory-v1__loader">
              <svg width="120" height="30" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" fill="#0f141e" aria-hidden="true">
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
          ) : null}

          <div className="vehica-inventory-v1__middle">
            <div>
              <div className="vehica-inventory-v1__title">
                {visibleVehicles.length} {resultLabel}
              </div>
            </div>

            <div className="vehica-inventory-v1__sort">
              <div className="vehica-inventory-v1__view">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "vehica-inventory-v1__view__button-active" : ""}
                  aria-label={content.viewGridLabel}
                >
                  <GridViewIcon />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "vehica-inventory-v1__view__button-active" : ""}
                  aria-label={content.viewListLabel}
                >
                  <ListViewIcon />
                </button>
              </div>

              <div className="vehica-inventory-v1__sort__heading">
                {content.sortHeadingLabel}
              </div>

              <div className="vehica-inventory-v1__sort__select">
                <div className="rentzo-inventory-select-wrap rentzo-inventory-select-wrap--sort">
                  <select
                    className="rentzo-inventory-select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="newest">{content.sortNewestLabel}</option>
                    <option value="price-low-to-high">{content.sortPriceLowLabel}</option>
                    <option value="price-high-to-low">{content.sortPriceHighLabel}</option>
                    <option value="name-a-z">{content.sortNameLabel}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rentzo-catalog-empty rentzo-catalog-empty--error">
              <p className="login-form__message login-form__message--error">{errorMessage}</p>
            </div>
          ) : hasVehicles ? (
            <div className={resultsClassName}>
              {visibleVehicles.map((vehicle) => (
                <div key={vehicle.id} className="vehica-inventory-v1__results__card">
                  <VehicleCard
                    content={content}
                    vehicle={vehicle}
                    viewMode={viewMode}
                    compareMode={compareMode}
                    isCompared={compareVehicleIds.includes(vehicle.id)}
                    onCompareToggle={onCompareToggle}
                    showAdminState={Boolean(currentAdmin)}
                    availabilityLabel={getAvailabilityLabel(vehicle, content)}
                    onOpen={() => onVehicleClick(vehicle.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rentzo-catalog-empty">
              <div className="rentzo-catalog-empty__inner">
                <h2>{content.emptyTitle}</h2>
                <p>{content.emptyDescription}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <CompareDrawer
        content={content}
        vehicles={comparedVehicles}
        isOpen={isCompareDrawerOpen}
        onToggleOpen={() => setIsCompareDrawerOpen((currentValue) => currentValue === false)}
        onRemove={onCompareRemove}
        onComparePageOpen={onComparePageOpen}
        onVehicleOpen={onVehicleClick}
      />
    </main>
  );
}

export default LocationVehiclesPage;
