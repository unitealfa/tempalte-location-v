const VERCEL_SAFE_UPLOAD_LIMIT_BYTES = 3.8 * 1024 * 1024;
const VERCEL_UPLOAD_OVERHEAD_BYTES = 160 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 3 * 1024 * 1024;

function buildOptimizedFilename(filename, extension) {
  const normalizedFilename = String(filename || "media").trim();
  const nextExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const sanitizedFilename = normalizedFilename.replace(/[^\w.-]+/g, "-");
  const filenameWithoutExtension = sanitizedFilename.replace(/\.[a-z0-9]{2,8}$/i, "");

  return `${filenameWithoutExtension || "media"}${nextExtension}`;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image invalide."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Compression impossible."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

async function optimizeImageFile(
  file,
  { maxDimension = 1600, quality = 0.72 } = {}
) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  try {
    const image = await loadImageElement(file);
    const longestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height, 1);
    const scaleRatio = Math.min(1, maxDimension / longestSide);
    const targetWidth = Math.max(1, Math.round((image.naturalWidth || image.width) * scaleRatio));
    const targetHeight = Math.max(1, Math.round((image.naturalHeight || image.height) * scaleRatio));
    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const optimizedBlob = await canvasToBlob(canvas, "image/webp", quality);

    if (!optimizedBlob || optimizedBlob.size >= file.size) {
      return file;
    }

    return new File([optimizedBlob], buildOptimizedFilename(file.name, ".webp"), {
      type: "image/webp",
      lastModified: Date.now()
    });
  } catch (error) {
    return file;
  }
}

function getTotalFilesSize(files) {
  return (files || []).reduce(
    (totalSize, file) => totalSize + Number(file?.size || 0),
    0
  );
}

function estimateVehicleUploadSize(photoFiles, videoFile) {
  return (
    getTotalFilesSize(photoFiles) +
    Number(videoFile?.size || 0) +
    VERCEL_UPLOAD_OVERHEAD_BYTES
  );
}

export async function optimizeVehicleMediaForUpload({
  photoFiles = [],
  videoFile = null
} = {}) {
  if (videoFile && videoFile.size > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error(
      "La video est trop lourde pour Vercel. Utilisez une video de moins de 3 Mo ou retirez-la."
    );
  }

  let optimizedPhotoFiles = await Promise.all(
    photoFiles.map((file) => optimizeImageFile(file, {
      maxDimension: 1600,
      quality: 0.72
    }))
  );

  if (
    estimateVehicleUploadSize(optimizedPhotoFiles, videoFile) >
    VERCEL_SAFE_UPLOAD_LIMIT_BYTES
  ) {
    optimizedPhotoFiles = await Promise.all(
      photoFiles.map((file) => optimizeImageFile(file, {
        maxDimension: 1280,
        quality: 0.6
      }))
    );
  }

  if (
    estimateVehicleUploadSize(optimizedPhotoFiles, videoFile) >
    VERCEL_SAFE_UPLOAD_LIMIT_BYTES
  ) {
    throw new Error(
      "Les medias du vehicule sont trop lourds pour Vercel. Reduisez le nombre de photos, compressez-les ou retirez la video."
    );
  }

  return {
    photoFiles: optimizedPhotoFiles,
    videoFile
  };
}
