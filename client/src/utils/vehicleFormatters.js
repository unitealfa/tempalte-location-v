const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 2
});

export function formatVehicleName(vehicle) {
  return [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
}

export function formatVehiclePrice(value) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatVehicleMeta(vehicle, seatsSuffix) {
  return `${vehicle.seats} ${seatsSuffix} | ${vehicle.transmission} | ${vehicle.fuelType}`;
}

export function getVehicleCardImageUrl(photoUrl) {
  if (
    typeof photoUrl === "string" &&
    /^\/api\/media\/vehicles\/\d+$/.test(photoUrl)
  ) {
    return `${photoUrl}/thumb`;
  }

  if (
    typeof photoUrl === "string" &&
    photoUrl.startsWith("/uploads/vehicles/") &&
    photoUrl.endsWith(".webp") &&
    !photoUrl.endsWith("--thumb.webp")
  ) {
    return photoUrl.replace(/\.webp$/, "--thumb.webp");
  }

  return photoUrl;
}
