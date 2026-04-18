function readDataTransferItemAsString(item) {
  return new Promise((resolve) => {
    try {
      item.getAsString((value) => resolve(String(value || "")));
    } catch (error) {
      resolve("");
    }
  });
}

function extractUrlsFromHtml(html) {
  if (!html || typeof DOMParser === "undefined") {
    return [];
  }

  try {
    const documentValue = new DOMParser().parseFromString(html, "text/html");
    const mediaElements = Array.from(
      documentValue.querySelectorAll("img[src], source[src], video[src], a[href]")
    );

    return mediaElements
      .map((element) => element.getAttribute("src") || element.getAttribute("href") || "")
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function normalizeCandidateUrls(rawValue) {
  return String(rawValue || "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value && !value.startsWith("#"));
}

async function fetchUrlAsFile(url, acceptPrefix, fallbackBasename) {
  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit"
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const mimeType = String(blob.type || "");

    if (!mimeType.startsWith(acceptPrefix + "/") && !isAcceptedMediaFile({
      name: url,
      type: mimeType
    }, acceptPrefix)) {
      return null;
    }

    const urlObject = new URL(url, window.location.href);
    const pathSegments = urlObject.pathname.split("/").filter(Boolean);
    const rawFilename = pathSegments[pathSegments.length - 1] || fallbackBasename;
    const hasExtension = /\.[a-z0-9]{2,8}$/i.test(rawFilename);
    const extension = mimeType.split("/")[1] || "bin";
    const filename = hasExtension ? rawFilename : rawFilename + "." + extension;

    return new File([blob], filename, {
      type: mimeType,
      lastModified: Date.now()
    });
  } catch (error) {
    return null;
  }
}

export async function extractAcceptedFilesFromDrop(event, {
  acceptPrefix = "image",
  maxFiles = 1
} = {}) {
  const dataTransfer = event?.dataTransfer;

  if (!dataTransfer) {
    return [];
  }

  const directFiles = Array.from(dataTransfer.files || []).filter((file) =>
    isAcceptedMediaFile(file, acceptPrefix)
  );

  if (directFiles.length > 0) {
    return directFiles.slice(0, maxFiles);
  }

  const items = Array.from(dataTransfer.items || []);
  const itemFiles = items
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file) => file && isAcceptedMediaFile(file, acceptPrefix));

  if (itemFiles.length > 0) {
    return itemFiles.slice(0, maxFiles);
  }

  const textPayloads = await Promise.all(
    items
      .filter((item) => item.kind === "string")
      .map(async (item) => ({
        type: item.type,
        value: await readDataTransferItemAsString(item)
      }))
  );

  const urlCandidates = new Set();

  textPayloads.forEach(({ type, value }) => {
    if (!value) {
      return;
    }

    if (type === "text/html") {
      extractUrlsFromHtml(value).forEach((url) => urlCandidates.add(url));
      return;
    }

    normalizeCandidateUrls(value).forEach((url) => urlCandidates.add(url));
  });

  const fetchedFiles = [];

  for (const url of urlCandidates) {
    if (fetchedFiles.length >= maxFiles) {
      break;
    }

    const nextFile = await fetchUrlAsFile(
      url,
      acceptPrefix,
      acceptPrefix === "video" ? "dropped-video" : "dropped-image"
    );

    if (nextFile) {
      fetchedFiles.push(nextFile);
    }
  }

  return fetchedFiles.slice(0, maxFiles);
}
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".jfif",
  ".tif",
  ".tiff",
  ".ico",
  ".cur",
  ".apng",
  ".pjpeg",
  ".pjp",
  ".dib",
  ".jxl"
];

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogg",
  ".ogv"
];

function matchesExtension(filename, extensions) {
  const normalizedFilename = String(filename || "").toLowerCase();
  return extensions.some((extension) => normalizedFilename.endsWith(extension));
}

export function isAcceptedMediaFile(file, acceptPrefix = "image") {
  if (!file) {
    return false;
  }

  const mimeType = String(file.type || "").toLowerCase();

  if (mimeType.startsWith(acceptPrefix + "/")) {
    return true;
  }

  if (acceptPrefix === "image") {
    return matchesExtension(file.name, IMAGE_EXTENSIONS);
  }

  if (acceptPrefix === "video") {
    return matchesExtension(file.name, VIDEO_EXTENSIONS);
  }

  return false;
}
