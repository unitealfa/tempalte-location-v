const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const {
  createReservationSecureFile,
  deleteReservationSecureFile,
  findReservationSecureFileById
} = require("../repositories/reservationSecureFileRepository");
const {
  resolveSecureStorageRoot,
  resolveUploadsRoot
} = require("../services/storagePathService");

const uploadsRoot = resolveUploadsRoot();
const secureReservationUploadsRoot = path.resolve(
  resolveSecureStorageRoot(),
  "reservations"
);
const SECURE_LICENSE_PREFIX = "secure-license:";
const SECURE_LICENSE_DB_PREFIX = "secure-license-db:";
const ENCRYPTED_FILE_HEADER = Buffer.from("RVL2");
const LEGACY_ENCRYPTED_FILE_HEADER = Buffer.from("RVL1");
const MAX_RESERVATION_LICENSE_FILES = 2;

async function ensureSecureReservationUploadsRoot() {
  await fs.mkdir(secureReservationUploadsRoot, {
    recursive: true
  });
}

function getReservationFileEncryptionKey() {
  const keySeed =
    process.env.RESERVATION_FILE_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "location-de-v-reservation-file-key";

  return crypto.createHash("sha256").update(String(keySeed)).digest();
}

function encryptReservationBuffer(buffer, contentType = "image/webp") {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getReservationFileEncryptionKey(),
    iv
  );
  const encryptedBuffer = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  const contentTypeBuffer = Buffer.from(
    String(contentType || "application/octet-stream"),
    "utf8"
  );
  const contentTypeLengthBuffer = Buffer.alloc(2);
  contentTypeLengthBuffer.writeUInt16BE(contentTypeBuffer.length, 0);

  return Buffer.concat([
    ENCRYPTED_FILE_HEADER,
    contentTypeLengthBuffer,
    contentTypeBuffer,
    iv,
    authTag,
    encryptedBuffer
  ]);
}

function decryptReservationBuffer(buffer) {
  const header = buffer.subarray(0, ENCRYPTED_FILE_HEADER.length);

  if (header.equals(LEGACY_ENCRYPTED_FILE_HEADER)) {
    const ivStart = LEGACY_ENCRYPTED_FILE_HEADER.length;
    const ivEnd = ivStart + 12;
    const authTagEnd = ivEnd + 16;
    const iv = buffer.subarray(ivStart, ivEnd);
    const authTag = buffer.subarray(ivEnd, authTagEnd);
    const encryptedBuffer = buffer.subarray(authTagEnd);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getReservationFileEncryptionKey(),
      iv
    );

    decipher.setAuthTag(authTag);

    return {
      buffer: Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]),
      contentType: "image/webp"
    };
  }

  if (!header.equals(ENCRYPTED_FILE_HEADER)) {
    throw new Error("Fichier de permis invalide.");
  }

  const contentTypeLengthStart = ENCRYPTED_FILE_HEADER.length;
  const contentTypeLengthEnd = contentTypeLengthStart + 2;
  const contentTypeLength = buffer.readUInt16BE(contentTypeLengthStart);
  const contentTypeStart = contentTypeLengthEnd;
  const contentTypeEnd = contentTypeStart + contentTypeLength;
  const contentType = buffer.subarray(contentTypeStart, contentTypeEnd).toString("utf8");
  const ivStart = contentTypeEnd;
  const ivEnd = ivStart + 12;
  const authTagEnd = ivEnd + 16;
  const iv = buffer.subarray(ivStart, ivEnd);
  const authTag = buffer.subarray(ivEnd, authTagEnd);
  const encryptedBuffer = buffer.subarray(authTagEnd);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getReservationFileEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  return {
    buffer: Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]),
    contentType: contentType || "application/octet-stream"
  };
}

function normalizeReservationUploadFiles(files) {
  if (!files) {
    return [];
  }

  if (Array.isArray(files)) {
    return files.filter(Boolean).slice(0, MAX_RESERVATION_LICENSE_FILES);
  }

  return [files].filter(Boolean);
}

function serializeReservationLicenseReferences(references) {
  const normalizedReferences = references.filter(Boolean);

  if (normalizedReferences.length === 0) {
    return "";
  }

  if (normalizedReferences.length === 1) {
    return normalizedReferences[0];
  }

  return JSON.stringify(normalizedReferences);
}

function parseStoredReservationReferences(reference) {
  if (!reference) {
    return [];
  }

  if (Array.isArray(reference)) {
    return reference.filter(Boolean);
  }

  const normalizedReference = String(reference).trim();

  if (!normalizedReference) {
    return [];
  }

  if (normalizedReference.startsWith("[")) {
    try {
      const parsedReference = JSON.parse(normalizedReference);

      if (Array.isArray(parsedReference)) {
        return parsedReference.filter(Boolean);
      }
    } catch (error) {
      return [];
    }
  }

  return [normalizedReference];
}

function getSecureReservationFilename(reference) {
  const filename = String(reference || "").startsWith(SECURE_LICENSE_PREFIX)
    ? String(reference).slice(SECURE_LICENSE_PREFIX.length)
    : String(reference || "");

  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return null;
  }

  return filename;
}

function getSecureReservationDbId(reference) {
  if (
    typeof reference !== "string" ||
    !reference.startsWith(SECURE_LICENSE_DB_PREFIX)
  ) {
    return null;
  }

  const dbId = Number(reference.slice(SECURE_LICENSE_DB_PREFIX.length));
  return Number.isInteger(dbId) && dbId > 0 ? dbId : null;
}

function getLegacyReservationPath(reference) {
  if (
    typeof reference !== "string" ||
    !reference.startsWith("/uploads/reservations/")
  ) {
    return null;
  }

  return path.resolve(uploadsRoot, reference.replace(/^\/uploads\//, ""));
}

function getLegacyReservationMimeType(filePath) {
  const extension = path.extname(filePath || "").toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".webp":
    default:
      return "image/webp";
  }
}

function getMimeExtension(contentType) {
  const normalizedContentType = String(contentType || "").toLowerCase();

  switch (normalizedContentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/svg+xml":
      return ".svg";
    case "image/bmp":
      return ".bmp";
    case "image/webp":
      return ".webp";
    default:
      return ".bin";
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(request, file, callback) {
    const isImage = String(file.mimetype || "").startsWith("image/");

    if (!isImage) {
      callback(
        new Error(
          "Format non accepte. Utilisez JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, HEIF ou JFIF."
        )
      );
      return;
    }

    callback(null, true);
  },
  limits: {
    files: MAX_RESERVATION_LICENSE_FILES,
    fileSize: 20 * 1024 * 1024
  }
});

function handleReservationUpload(request, response, next) {
  upload.array("drivingLicensePhoto", MAX_RESERVATION_LICENSE_FILES)(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: error.message || "Upload du permis impossible."
      });
    }

    return next();
  });
}

async function optimizeReservationLicensePhotos(files) {
  const normalizedFiles = normalizeReservationUploadFiles(files);

  if (normalizedFiles.length === 0) {
    return "";
  }

  await ensureSecureReservationUploadsRoot();

  try {
    const references = [];

    for (const file of normalizedFiles) {
      let securedBuffer = null;
      let securedContentType = "image/webp";

      try {
        securedBuffer = await sharp(file.buffer)
          .rotate()
          .resize({
            width: 1800,
            height: 1800,
            fit: "inside",
            withoutEnlargement: true
          })
          .webp({
            quality: 74
          })
          .toBuffer();
      } catch (error) {
        securedBuffer = Buffer.from(file.buffer);
        securedContentType = String(file.mimetype || "application/octet-stream");
      }

      const encryptedPayload = encryptReservationBuffer(
        securedBuffer,
        securedContentType
      );
      const secureFile = await createReservationSecureFile(encryptedPayload);

      references.push(`${SECURE_LICENSE_DB_PREFIX}${secureFile.id}`);
    }

    return serializeReservationLicenseReferences(references);
  } catch (error) {
    throw new Error("Le permis de conduire est invalide ou n'a pas pu etre traite.");
  }
}

async function optimizeReservationLicensePhoto(file) {
  return optimizeReservationLicensePhotos(normalizeReservationUploadFiles(file));
}

async function removeUploadedReservationFile(fileOrFiles) {
  void fileOrFiles;
}

async function readStoredReservationFile(reference, index = 0) {
  const references = parseStoredReservationReferences(reference);
  const normalizedIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  const selectedReference = references[normalizedIndex];

  if (!selectedReference) {
    return null;
  }

  const secureFilename = getSecureReservationFilename(selectedReference);
  const secureDbId = getSecureReservationDbId(selectedReference);

  if (secureDbId) {
    const secureFile = await findReservationSecureFileById(secureDbId);

    if (!secureFile) {
      return null;
    }

    const decryptedFile = decryptReservationBuffer(secureFile.encryptedPayload);

    return {
      buffer: decryptedFile.buffer,
      contentType: decryptedFile.contentType,
      filename: `reservation-license-${secureDbId}${getMimeExtension(decryptedFile.contentType)}`
    };
  }

  if (secureFilename) {
    const encryptedBuffer = await fs.readFile(
      path.resolve(secureReservationUploadsRoot, secureFilename)
    );
    const decryptedFile = decryptReservationBuffer(encryptedBuffer);

    return {
      buffer: decryptedFile.buffer,
      contentType: decryptedFile.contentType,
      filename: `${path.parse(secureFilename).name}${getMimeExtension(decryptedFile.contentType)}`
    };
  }

  const legacyPath = getLegacyReservationPath(selectedReference);

  if (!legacyPath) {
    return null;
  }

  return {
    buffer: await fs.readFile(legacyPath),
    contentType: getLegacyReservationMimeType(legacyPath),
    filename: path.basename(legacyPath)
  };
}

async function removeStoredReservationFile(reference) {
  const references = parseStoredReservationReferences(reference);

  for (const currentReference of references) {
    const secureDbId = getSecureReservationDbId(currentReference);

    if (secureDbId) {
      await deleteReservationSecureFile(secureDbId).catch(() => {});
      continue;
    }

    const secureFilename = getSecureReservationFilename(currentReference);

    if (secureFilename) {
      await fs.unlink(
        path.resolve(secureReservationUploadsRoot, secureFilename)
      ).catch(() => {});
      continue;
    }

    const filePath = getLegacyReservationPath(currentReference);

    if (!filePath) {
      continue;
    }

    await fs.unlink(filePath).catch(() => {});
  }
}

module.exports = {
  handleReservationUpload,
  optimizeReservationLicensePhoto,
  optimizeReservationLicensePhotos,
  parseStoredReservationReferences,
  readStoredReservationFile,
  removeStoredReservationFile,
  removeUploadedReservationFile
};
