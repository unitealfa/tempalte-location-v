export const IMAGE_FALLBACK_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">' +
      '<rect width="640" height="420" fill="#151922"/>' +
      '<rect x="22" y="22" width="596" height="376" rx="20" fill="#1e2430" stroke="#2b3443"/>' +
      '<path d="M170 286l72-76 60 52 96-108 72 132H170z" fill="#c88b3a" opacity=".88"/>' +
      '<circle cx="240" cy="150" r="26" fill="#f4f4f4" opacity=".9"/>' +
      '<text x="320" y="348" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Aperçu indisponible</text>' +
    "</svg>"
  );

export function handleImageFallback(event) {
  const target = event?.currentTarget;

  if (!target) {
    return;
  }

  const currentSource = String(target.getAttribute("src") || "");

  if (
    target.dataset.originalSrcTried !== "true" &&
    currentSource.includes("--thumb.webp")
  ) {
    target.dataset.originalSrcTried = "true";
    target.src = currentSource.replace("--thumb.webp", ".webp");
    return;
  }

  if (target.dataset.fallbackApplied === "true") {
    return;
  }

  target.dataset.fallbackApplied = "true";
  target.src = IMAGE_FALLBACK_SRC;
}
