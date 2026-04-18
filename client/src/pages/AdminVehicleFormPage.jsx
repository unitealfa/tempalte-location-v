import { useEffect, useId, useRef, useState } from "react";
import VehicleVideo from "../components/VehicleVideo";
import {
  createVehicle,
  getVehicleById,
  readCachedVehicleById,
  updateVehicle
} from "../services/vehicleService";
import { extractAcceptedFilesFromDrop, isAcceptedMediaFile } from "../utils/dropFiles";
import { handleImageFallback } from "../utils/imageFallback";

function buildInitialFormValues() {
  return {
    brand: "",
    model: "",
    version: "",
    vehicleRanges: [],
    fuelType: "",
    transmission: "",
    seats: "",
    isConvertible: false,
    horsepower: "",
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    securityDeposit: "",
    includedKmPerDay: "",
    extraKmPrice: "",
    availabilityStatus: "available"
  };
}

function mapVehicleToFormValues(vehicle) {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    vehicleRanges: Array.isArray(vehicle.vehicleRanges)
      ? vehicle.vehicleRanges.filter((vehicleRange) => vehicleRange !== "Cabriolet")
      : [],
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    seats: String(vehicle.seats),
    isConvertible: Boolean(vehicle.isConvertible),
    horsepower: String(vehicle.horsepower),
    dailyPrice: String(vehicle.dailyPrice),
    weeklyPrice: String(vehicle.weeklyPrice),
    monthlyPrice: String(vehicle.monthlyPrice),
    securityDeposit: String(vehicle.securityDeposit),
    includedKmPerDay: String(vehicle.includedKmPerDay),
    extraKmPrice: String(vehicle.extraKmPrice),
    availabilityStatus: vehicle.availabilityStatus
  };
}


function getFileFingerprint(file) {
  return [file.name, file.size, file.lastModified].join(":");
}

function mergeUniqueFiles(currentFiles, nextFiles) {
  const fingerprints = new Set(currentFiles.map(getFileFingerprint));
  const mergedFiles = [...currentFiles];

  nextFiles.forEach((file) => {
    const fingerprint = getFileFingerprint(file);

    if (fingerprints.has(fingerprint)) {
      return;
    }

    fingerprints.add(fingerprint);
    mergedFiles.push(file);
  });

  return mergedFiles;
}

function AdminVehicleFormPage({
  content,
  mode,
  vehicleId,
  onBackClick,
  onSaved
}) {
  const cachedVehicle =
    mode === "edit" && vehicleId
      ? readCachedVehicleById(vehicleId, { adminView: true })
      : null;
  const [formValues, setFormValues] = useState(() =>
    cachedVehicle ? mapVehicleToFormValues(cachedVehicle) : buildInitialFormValues()
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => mode === "edit" && !cachedVehicle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState(() => cachedVehicle?.photoUrls || []);
  const [existingVideoUrl, setExistingVideoUrl] = useState(() => cachedVehicle?.videoUrl || "");
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [activeDropZone, setActiveDropZone] = useState("");
  const videoInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputId = useId();
  const photoInputId = useId();

  useEffect(() => {
    if (mode !== "edit" || !vehicleId) {
      setFormValues(buildInitialFormValues());
      setPhotoFiles([]);
      setVideoFile(null);
      setExistingPhotoUrls([]);
      setExistingVideoUrl("");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadVehicle = async () => {
      setIsLoading(() => !readCachedVehicleById(vehicleId, { adminView: true }));
      setErrorMessage("");

      try {
        const vehicle = await getVehicleById(vehicleId, {
          adminView: true
        });

        if (!isActive) {
          return;
        }

        setFormValues(mapVehicleToFormValues(vehicle));
        setPhotoFiles([]);
        setVideoFile(null);
        setExistingPhotoUrls(vehicle.photoUrls || []);
        setExistingVideoUrl(vehicle.videoUrl || "");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadVehicle();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, mode, vehicleId]);

  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviewUrls([]);
      return undefined;
    }

    const objectUrls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(existingVideoUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [existingVideoUrl, videoFile]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleVehicleRangeToggle = (vehicleRange) => {
    setFormValues((currentValues) => {
      const isSelected = currentValues.vehicleRanges.includes(vehicleRange);

      if (!isSelected && currentValues.vehicleRanges.length >= 2) {
        setErrorMessage(content.vehicleRangesLimitMessage);
        return currentValues;
      }

      setErrorMessage("");

      return {
        ...currentValues,
        vehicleRanges: isSelected
          ? currentValues.vehicleRanges.filter((item) => item !== vehicleRange)
          : [...currentValues.vehicleRanges, vehicleRange]
      };
    });
  };

  const handleExistingPhotoRemove = (photoUrlToRemove) => {
    setExistingPhotoUrls((currentPhotoUrls) =>
      currentPhotoUrls.filter((photoUrl) => photoUrl !== photoUrlToRemove)
    );
  };

  const applyPhotoFiles = (files) => {
    const nextPhotoFiles = Array.from(files || []);

    if (nextPhotoFiles.length === 0) {
      return;
    }

    const hasInvalidFile = nextPhotoFiles.some((file) => !isAcceptedMediaFile(file, "image"));

    if (hasInvalidFile) {
      setErrorMessage(content.invalidPhotoDropMessage);
      return;
    }

    setErrorMessage("");
    setPhotoFiles((currentPhotoFiles) =>
      mergeUniqueFiles(currentPhotoFiles, nextPhotoFiles)
    );
  };

  const handlePhotoSelection = (event) => {
    applyPhotoFiles(event.target.files);
    event.target.value = "";
  };

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const handleNewPhotoRemove = (photoIndexToRemove) => {
    setPhotoFiles((currentPhotoFiles) =>
      currentPhotoFiles.filter((photoFile, photoIndex) => photoIndex !== photoIndexToRemove)
    );
  };

  const applyVideoFile = (file) => {
    if (!file) {
      setVideoFile(null);
      return;
    }

    if (!isAcceptedMediaFile(file, "video")) {
      setErrorMessage(content.invalidVideoDropMessage);
      return;
    }

    setErrorMessage("");
    setVideoFile(file);
  };

  const handleVideoSelection = (event) => {
    applyVideoFile(event.target.files?.[0] || null);
    event.target.value = "";
  };

  const openVideoPicker = () => {
    videoInputRef.current?.click();
  };

  const handleDropZoneDragOver = (event, dropZone) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setActiveDropZone(dropZone);
  };

  const handleDropZoneDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setActiveDropZone("");
  };

  const handlePhotoDrop = async (event) => {
    event.preventDefault();
    setActiveDropZone("");
    const droppedFiles = await extractAcceptedFilesFromDrop(event, {
      acceptPrefix: "image",
      maxFiles: 20
    });
    applyPhotoFiles(droppedFiles);
  };

  const handleVideoDrop = async (event) => {
    event.preventDefault();
    setActiveDropZone("");
    const droppedFiles = await extractAcceptedFilesFromDrop(event, {
      acceptPrefix: "video",
      maxFiles: 1
    });
    applyVideoFile(droppedFiles?.[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        ...formValues,
        vehicleRanges: formValues.vehicleRanges
      };

      payload.photoFiles = photoFiles;
      payload.videoFile = videoFile;
      payload.retainedPhotoUrls = existingPhotoUrls;

      const response =
        mode === "edit"
          ? await updateVehicle(vehicleId, payload)
          : await createVehicle(payload);

      onSaved(response.vehicle);
    } catch (error) {
      setErrorMessage(
        error.message ||
          (mode === "edit"
            ? content.updateErrorMessage
            : content.createErrorMessage)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="vehicle-form-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du formulaire...</p>
        </section>
      </main>
    );
  }

  const isVehicleRangeLimitReached = formValues.vehicleRanges.length >= 2;
  const totalPhotoCount = existingPhotoUrls.length + photoPreviewUrls.length;
  const availabilitySummaryLabel =
    formValues.availabilityStatus === "maintenance"
      ? content.availabilityMaintenanceLabel
      : formValues.availabilityStatus === "reserved"
        ? content.availabilityReservedLabel
        : content.availabilityAvailableLabel;
  const pageTitle = mode === "edit" ? content.editTitle : content.createTitle;
  const pageDescription =
    mode === "edit" ? content.editDescription : content.createDescription;
  const videoDropDescription =
    activeDropZone === "video"
      ? content.mediaDropActiveLabel
      : videoFile
        ? content.mediaSelectedVideoLabel
        : content.videoDropHint;
  const photoDropDescription =
    activeDropZone === "photo"
      ? content.mediaDropActiveLabel
      : photoFiles.length > 0
        ? `${photoFiles.length} ${
            photoFiles.length > 1
              ? content.mediaSelectedPhotoPluralLabel
              : content.mediaSelectedPhotoSingularLabel
          }`
        : content.photoDropHint;

  return (
    <main className="vehicle-form-page">
      <section className="vehicle-form-page__hero">
        <div className="vehicle-form-page__container">
          <button
            type="button"
            className="vehicle-form-page__back"
            onClick={onBackClick}
            aria-label={mode === "edit" ? content.backToVehicleLabel : content.backToListLabel}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="vehicle-form-page__hero-copy">
            <h1>{pageTitle}</h1>
            <p className="hero-card__text">{pageDescription}</p>
          </div>
        </div>
      </section>

      <section className="vehicle-form-page__body">
        <div className="vehicle-form-page__container">
          <form
            className="vehicle-form vehicle-form--rentzo vehica-contact-form"
            onSubmit={handleSubmit}
          >
            <div className="vehicle-form-page__layout">
              <div className="vehicle-form-page__main">
                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{content.informationSectionTitle}</h2>
                  </div>

                  <div className="reservation-form__grid vehicle-form__grid">
                    <label className="login-form__field">
                      <span>{content.brandLabel}</span>
                      <input
                        type="text"
                        name="brand"
                        value={formValues.brand}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.modelLabel}</span>
                      <input
                        type="text"
                        name="model"
                        value={formValues.model}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.versionLabel}</span>
                      <input
                        type="text"
                        name="version"
                        value={formValues.version}
                        onChange={handleChange}
                      />
                    </label>

                    <div className="vehicle-form__option-group">
                      <span className="vehicle-form__option-group-title">
                        {content.vehicleRangesLabel}
                      </span>

                      <div className="vehicle-form__option-group-grid">
                        {content.vehicleRangeOptions.map((option) => {
                          const isSelected = formValues.vehicleRanges.includes(option);

                          return (
                            <label key={option} className="vehicle-form__option-item">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleVehicleRangeToggle(option)}
                                disabled={!isSelected && isVehicleRangeLimitReached}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>

                      <small className="vehicle-form__option-group-hint">
                        {content.vehicleRangesHint}
                      </small>
                    </div>

                    <label className="login-form__field">
                      <span>{content.fuelTypeLabel}</span>
                      <select
                        name="fuelType"
                        value={formValues.fuelType}
                        onChange={handleChange}
                      >
                        <option value="">Selectionner</option>
                        {content.fuelTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="login-form__field">
                      <span>{content.transmissionLabel}</span>
                      <select
                        name="transmission"
                        value={formValues.transmission}
                        onChange={handleChange}
                      >
                        <option value="">Selectionner</option>
                        {content.transmissionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="login-form__field">
                      <span>{content.seatsLabel}</span>
                      <input
                        type="number"
                        min="1"
                        name="seats"
                        value={formValues.seats}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.horsepowerLabel}</span>
                      <input
                        type="number"
                        min="0"
                        name="horsepower"
                        value={formValues.horsepower}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="vehicle-form__checkbox">
                      <input
                        type="checkbox"
                        name="isConvertible"
                        checked={formValues.isConvertible}
                        onChange={handleChange}
                      />
                      <span>{content.convertibleLabel}</span>
                    </label>

                    {mode === "edit" ? (
                      <label className="login-form__field">
                        <span>{content.adminAvailabilityLabel}</span>
                        <select
                          name="availabilityStatus"
                          value={formValues.availabilityStatus}
                          onChange={handleChange}
                        >
                          <option value="available">
                            {content.availabilityAvailableLabel}
                          </option>
                          <option value="reserved">
                            {content.availabilityReservedLabel}
                          </option>
                          <option value="maintenance">
                            {content.availabilityMaintenanceLabel}
                          </option>
                        </select>
                      </label>
                    ) : null}
                  </div>
                </section>

                <section className="vehicle-form-page__panel">
                  <div className="vehicle-form-page__panel-header">
                    <h2>{content.pricingSectionTitle}</h2>
                  </div>

                  <div className="reservation-form__grid vehicle-form__grid">
                    <label className="login-form__field">
                      <span>{content.dailyPriceLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="dailyPrice"
                        value={formValues.dailyPrice}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.weeklyPriceLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="weeklyPrice"
                        value={formValues.weeklyPrice}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.monthlyPriceLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="monthlyPrice"
                        value={formValues.monthlyPrice}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.securityDepositLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="securityDeposit"
                        value={formValues.securityDeposit}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.includedKmPerDayLabel}</span>
                      <input
                        type="number"
                        min="0"
                        name="includedKmPerDay"
                        value={formValues.includedKmPerDay}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="login-form__field">
                      <span>{content.extraKmPriceLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="extraKmPrice"
                        value={formValues.extraKmPrice}
                        onChange={handleChange}
                      />
                    </label>
                  </div>
                </section>

                <div className="vehicle-form-page__media-grid">
                  <section className="vehicle-form-page__panel">
                    <div className="vehicle-form-page__panel-header">
                      <h2>{content.videoSectionTitle}</h2>
                    </div>

                    <div className="login-form__field vehicle-form__media-field">
                      <span>{content.videoUrlLabel}</span>
                      <div
                        className={`vehicle-form__dropzone${
                          activeDropZone === "video" ? " vehicle-form__dropzone--active" : ""
                        }`}
                        onDragOver={(event) => handleDropZoneDragOver(event, "video")}
                        onDragLeave={handleDropZoneDragLeave}
                        onDrop={handleVideoDrop}
                      >
                        <div className="vehicle-form__dropzone-copy">
                          <strong>{content.videoUrlLabel}</strong>
                          <span>{videoDropDescription}</span>
                        </div>
                        <button
                          type="button"
                          className="vehicle-form__dropzone-cta"
                          onClick={openVideoPicker}
                        >
                          {content.mediaSelectLabel}
                        </button>
                      </div>
                      <input
                        id={videoInputId}
                        ref={videoInputRef}
                        className="vehicle-form__media-input"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelection}
                      />
                    </div>

                    {videoPreviewUrl ? (
                      <div className="vehicle-form__media">
                        <div className="vehica-car-embed-wrapper">
                          <div className="vehica-car-embed">
                            <VehicleVideo
                              src={videoPreviewUrl}
                              title={content.videoSectionTitle}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="vehicle-form-page__panel">
                    <div className="vehicle-form-page__panel-header">
                      <h2>{content.photosSectionTitle}</h2>
                    </div>

                    <div className="login-form__field vehicle-form__media-field">
                      <span>{content.photoUrlsLabel}</span>
                      <div
                        className={`vehicle-form__dropzone${
                          activeDropZone === "photo" ? " vehicle-form__dropzone--active" : ""
                        }`}
                        onDragOver={(event) => handleDropZoneDragOver(event, "photo")}
                        onDragLeave={handleDropZoneDragLeave}
                        onDrop={handlePhotoDrop}
                      >
                        <div className="vehicle-form__dropzone-copy">
                          <strong>{content.photoUrlsLabel}</strong>
                          <span>{photoDropDescription}</span>
                        </div>
                        <button
                          type="button"
                          className="vehicle-form__dropzone-cta"
                          onClick={openPhotoPicker}
                        >
                          {content.mediaSelectLabel}
                        </button>
                      </div>
                      <input
                        id={photoInputId}
                        ref={photoInputRef}
                        className="vehicle-form__media-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelection}
                      />
                    </div>

                    {existingPhotoUrls.length > 0 || photoPreviewUrls.length > 0 ? (
                      <div className="vehicle-form__gallery">
                        {existingPhotoUrls.map((photoUrl, index) => (
                          <div
                            key={`${photoUrl}-${index}`}
                            className="vehicle-form__gallery-item"
                          >
                            <button
                              type="button"
                              className="vehicle-form__remove-media"
                              aria-label={`Supprimer l'image ${index + 1}`}
                              onClick={() => handleExistingPhotoRemove(photoUrl)}
                            >
                              x
                            </button>

                            <img
                              src={photoUrl}
                              alt={`${content.photoUrlsLabel} ${index + 1}`}
                              onError={handleImageFallback}
                            />
                          </div>
                        ))}

                        {photoPreviewUrls.map((photoUrl, index) => (
                          <div
                            key={`${photoUrl}-${index}`}
                            className="vehicle-form__gallery-item"
                          >
                            <button
                              type="button"
                              className="vehicle-form__remove-media"
                              aria-label={`Supprimer la nouvelle image ${index + 1}`}
                              onClick={() => handleNewPhotoRemove(index)}
                            >
                              x
                            </button>

                            <img
                              src={photoUrl}
                              alt={`${content.photoUrlsLabel} ${
                                existingPhotoUrls.length + index + 1
                              }`}
                              onError={handleImageFallback}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </div>

                {errorMessage ? (
                  <p className="login-form__message login-form__message--error">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="vehicle-form-page__submit-row">
                  <button
                    type="submit"
                    className="login-form__submit vehicle-form-page__submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? mode === "edit"
                        ? content.editSubmittingLabel || "Modification en cours..."
                        : content.createSubmittingLabel || "Creation en cours..."
                      : mode === "edit"
                        ? content.editSubmitLabel
                        : content.createSubmitLabel}
                  </button>
                </div>
              </div>

              <aside className="vehicle-form-page__sidebar">
                <div className="vehicle-form-page__summary-card">
                  <h2>{pageTitle}</h2>
                  <p className="hero-card__text">{pageDescription}</p>

                  <div className="vehicle-form-page__summary-grid">
                    <div className="vehicle-form-page__summary-item">
                      <span>{content.vehicleRangesLabel}</span>
                      <strong>{formValues.vehicleRanges.length}/2</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.photosSectionTitle}</span>
                      <strong>{totalPhotoCount}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.videoSectionTitle}</span>
                      <strong>{videoPreviewUrl ? "1" : "0"}</strong>
                    </div>

                    <div className="vehicle-form-page__summary-item">
                      <span>{content.adminAvailabilityLabel}</span>
                      <strong>{availabilitySummaryLabel}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AdminVehicleFormPage;
