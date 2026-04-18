function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(String(value || "").replace(" ", "T"));
}

export function getReservationBillingDays(pickupDatetime, returnDatetime) {
  const pickupTime = toDate(pickupDatetime).getTime();
  const returnTime = toDate(returnDatetime).getTime();

  if (Number.isNaN(pickupTime) || Number.isNaN(returnTime) || returnTime <= pickupTime) {
    return 0;
  }

  return Math.max(1, Math.ceil((returnTime - pickupTime) / (1000 * 60 * 60 * 24)));
}

function toPriceNumber(value) {
  const parsedValue = Number(value || 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function calculateReservationPricing(vehicle, pickupDatetime, returnDatetime) {
  const billingDays = getReservationBillingDays(pickupDatetime, returnDatetime);

  if (!vehicle || billingDays <= 0) {
    return {
      billingDays: 0,
      rateType: "daily",
      ratePerDay: 0,
      totalPrice: 0
    };
  }

  let rateType = "daily";
  let ratePerDay = toPriceNumber(vehicle.dailyPrice);

  if (billingDays >= 30 && toPriceNumber(vehicle.monthlyPrice) > 0) {
    rateType = "monthly";
    ratePerDay = toPriceNumber(vehicle.monthlyPrice);
  } else if (billingDays >= 7 && toPriceNumber(vehicle.weeklyPrice) > 0) {
    rateType = "weekly";
    ratePerDay = toPriceNumber(vehicle.weeklyPrice);
  }

  return {
    billingDays,
    rateType,
    ratePerDay,
    totalPrice: Number((billingDays * ratePerDay).toFixed(2))
  };
}

export function getReservationRateLabel(rateType, content) {
  if (rateType === "monthly") {
    return content.monthlyPriceLabel;
  }

  if (rateType === "weekly") {
    return content.weeklyPriceLabel;
  }

  return content.dailyPriceLabel;
}
