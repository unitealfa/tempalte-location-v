function normalizeDigits(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

export function buildTelUrl(phoneNumber) {
  const digits = normalizeDigits(phoneNumber);
  return digits ? `tel:${digits}` : "#";
}

export function buildWhatsappWebUrl(phoneNumber, message = "") {
  const digits = normalizeDigits(phoneNumber).replace(/^\+/, "");

  if (!digits) {
    return "";
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function openWhatsappOrCall({ phoneNumber, message = "" }) {
  if (typeof window === "undefined") {
    return;
  }

  const digits = normalizeDigits(phoneNumber);
  const normalizedDigits = digits.replace(/^\+/, "");
  const telUrl = buildTelUrl(digits);

  if (!normalizedDigits) {
    if (telUrl !== "#") {
      window.location.href = telUrl;
    }
    return;
  }

  const whatsappAppUrl = `whatsapp://send?phone=${normalizedDigits}&text=${encodeURIComponent(message)}`;
  let fallbackTriggered = false;

  const fallbackTimer = window.setTimeout(() => {
    if (fallbackTriggered) {
      return;
    }

    fallbackTriggered = true;

    if (telUrl !== "#") {
      window.location.href = telUrl;
    }
  }, 900);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      fallbackTriggered = true;
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.location.href = whatsappAppUrl;
}
