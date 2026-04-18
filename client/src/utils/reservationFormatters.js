const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium"
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short"
});

function normalizeDate(value) {
  return new Date(String(value || "").replace(" ", "T"));
}

function shouldHideTime(value) {
  const normalizedValue = String(value || "").replace(" ", "T");
  const timePart = normalizedValue.split("T")[1] || "";
  return timePart.startsWith("00:00") || timePart.startsWith("23:59");
}

export function formatReservationDateTime(value) {
  if (!value) {
    return "";
  }

  const date = normalizeDate(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (shouldHideTime(value)) {
    return dateFormatter.format(date);
  }

  return dateTimeFormatter.format(date);
}

export function getReservationLocationLabel(options, value) {
  return (
    options.find((option) => option.value === value)?.label ||
    value
  );
}
