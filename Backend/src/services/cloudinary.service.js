const cloudinary = require("../config/cloudinary");

// ==================== Cloudinary Constants ====================

const CLOUDINARY_ROOT_FOLDER = "lsa";

const CLOUDINARY_FOLDERS = Object.freeze({
  USERS: "users",

  PARTNERS: "partners",

  JOURNEYS: "journeys",

  TEAM_MEMBERS: "team-members",

  SERVICE_CARDS: "services/cards",

  SERVICE_HEROES: "services/heroes",

  PROJECT_CARDS: "projects/cards",

  PROJECT_HERO: "projects/hero",

  PROJECT_GALLERY: "projects/gallery",

  PROJECT_CERTIFICATES: "projects/certificates",

  EQUIPMENT_IMAGES: "equipment/images",

  RESUMES: "resumes",

  CERTIFICATES: "certificates",
});

const ALLOWED_FOLDERS = Object.freeze(Object.values(CLOUDINARY_FOLDERS));

const RASTER_IMAGE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const VECTOR_IMAGE_MIME_TYPES = Object.freeze(["image/svg+xml"]);

const IMAGE_MIME_TYPES = Object.freeze([
  ...RASTER_IMAGE_MIME_TYPES,
  ...VECTOR_IMAGE_MIME_TYPES,
]);

const PDF_MIME_TYPES = Object.freeze(["application/pdf"]);

const OFFICE_DOCUMENT_MIME_TYPES = Object.freeze([
  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const DOCUMENT_MIME_TYPES = Object.freeze([
  ...PDF_MIME_TYPES,
  ...OFFICE_DOCUMENT_MIME_TYPES,
]);

const ALLOWED_MIME_TYPES = Object.freeze([
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
]);

const RESOURCE_TYPES = Object.freeze({
  IMAGE: "image",
  RAW: "raw",
});

const DEFAULT_IMAGE_TRANSFORMATION = Object.freeze([
  {
    width: 1600,
    height: 1600,
    crop: "limit",
  },

  {
    quality: "auto",
  },

  {
    fetch_format: "auto",
  },
]);

const MAX_BATCH_DELETE_SIZE = 100;

// ==================== Error Helper ====================

const createServiceError = (
  message,
  statusCode = 500,
  code = "CLOUDINARY_ERROR",
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

// ==================== Validate Upload Folder ====================

const validateFolder = (folder) => {
  if (typeof folder !== "string" || !folder.trim()) {
    throw createServiceError(
      "Upload folder is required",
      400,
      "UPLOAD_FOLDER_REQUIRED",
    );
  }

  const normalizedFolder = folder.trim();

  if (!ALLOWED_FOLDERS.includes(normalizedFolder)) {
    throw createServiceError(
      `Invalid upload folder: ${normalizedFolder}`,
      400,
      "INVALID_UPLOAD_FOLDER",
    );
  }

  return normalizedFolder;
};

// ==================== Validate File Buffer ====================

const validateBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw createServiceError(
      "A valid file buffer is required",
      400,
      "FILE_BUFFER_REQUIRED",
    );
  }

  if (buffer.length === 0) {
    throw createServiceError(
      "The uploaded file is empty",
      400,
      "EMPTY_FILE_BUFFER",
    );
  }

  return buffer;
};

// ==================== Validate MIME Type ====================

const validateMimeType = (mimeType, allowedTypes) => {
  if (typeof mimeType !== "string" || !mimeType.trim()) {
    throw createServiceError(
      "File MIME type is required",
      400,
      "FILE_MIME_TYPE_REQUIRED",
    );
  }

  if (!Array.isArray(allowedTypes) || !allowedTypes.includes(mimeType)) {
    throw createServiceError(
      `File type ${mimeType} is not allowed`,
      400,
      "INVALID_FILE_TYPE",
    );
  }

  return mimeType;
};

// ==================== Validate Resource Type ====================

const validateResourceType = (resourceType) => {
  if (!Object.values(RESOURCE_TYPES).includes(resourceType)) {
    throw createServiceError(
      `Invalid Cloudinary resource type: ${resourceType}`,
      400,
      "INVALID_RESOURCE_TYPE",
    );
  }

  return resourceType;
};

// ==================== Sanitize Base Name ====================

const sanitizeBaseName = (value) => {
  return (
    String(value || "file")
      .trim()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "file"
  );
};

// ==================== Build Public ID ====================

const buildPublicId = ({ folder, originalName, prefix }) => {
  const normalizedFolder = validateFolder(folder);

  const sanitizedFolder = sanitizeBaseName(normalizedFolder);

  const sanitizedName = sanitizeBaseName(originalName);

  const sanitizedPrefix = prefix ? `${sanitizeBaseName(prefix)}_` : "";

  const uniqueSuffix = [Date.now(), Math.round(Math.random() * 1e9)].join("-");

  return [
    sanitizedPrefix,
    sanitizedFolder,
    "_",
    sanitizedName,
    "_",
    uniqueSuffix,
  ].join("");
};

// ==================== Build Cloudinary Folder ====================

const buildCloudinaryFolder = (folder) => {
  const normalizedFolder = validateFolder(folder);

  return `${CLOUDINARY_ROOT_FOLDER}/${normalizedFolder}`;
};

// ==================== Chunk Array ====================

const chunkArray = (values, chunkSize) => {
  const chunks = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
};

// ==================== Upload Stream ====================

const uploadStream = ({ buffer, options }) => {
  validateBuffer(buffer);

  return new Promise((resolve, reject) => {
    let isSettled = false;

    const resolveOnce = (value) => {
      if (isSettled) {
        return;
      }

      isSettled = true;

      resolve(value);
    };

    const rejectOnce = (error) => {
      if (isSettled) {
        return;
      }

      isSettled = true;

      reject(error);
    };

    let cloudinaryStream;

    try {
      cloudinaryStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return rejectOnce(
              createServiceError(
                error.message || "Cloudinary upload failed",
                error.http_code || 500,
                "CLOUDINARY_UPLOAD_FAILED",
              ),
            );
          }

          if (!result) {
            return rejectOnce(
              createServiceError(
                "Cloudinary returned an empty upload result",
                500,
                "EMPTY_CLOUDINARY_RESULT",
              ),
            );
          }

          return resolveOnce(result);
        },
      );
    } catch (error) {
      return rejectOnce(
        createServiceError(
          error.message || "Cloudinary upload stream could not be created",
          500,
          "CLOUDINARY_STREAM_CREATION_FAILED",
        ),
      );
    }

    cloudinaryStream.on("error", (error) => {
      rejectOnce(
        createServiceError(
          error.message || "Cloudinary upload stream failed",
          500,
          "CLOUDINARY_STREAM_FAILED",
        ),
      );
    });

    cloudinaryStream.end(buffer);
  });
};

// ==================== Format Upload Result ====================

const formatUploadResult = (result) => {
  return {
    url: result.secure_url,

    publicId: result.public_id,

    resourceType: result.resource_type,

    format: result.format || null,

    bytes: result.bytes ?? null,

    width: result.width ?? null,

    height: result.height ?? null,

    createdAt: result.created_at || null,
  };
};

// ==================== Format Image Result ====================

const formatImageResult = ({ uploadedFile, alt = "" }) => {
  return {
    url: uploadedFile.url,

    publicId: uploadedFile.publicId,

    alt: String(alt || "").trim(),
  };
};

// ==================== Get Image Transformation ====================

const getImageTransformation = ({ mimeType, transformation }) => {
  if (VECTOR_IMAGE_MIME_TYPES.includes(mimeType)) {
    return undefined;
  }

  if (transformation === null || transformation === false) {
    return undefined;
  }

  return transformation || DEFAULT_IMAGE_TRANSFORMATION;
};

// ==================== Upload Image Buffer ====================

const uploadImageBuffer = async ({
  buffer,
  folder,
  originalName = "image",
  mimeType,
  publicId,
  prefix,
  transformation,
}) => {
  validateBuffer(buffer);

  const normalizedFolder = validateFolder(folder);

  validateMimeType(mimeType, IMAGE_MIME_TYPES);

  const finalPublicId =
    publicId ||
    buildPublicId({
      folder: normalizedFolder,

      originalName,

      prefix,
    });

  const finalTransformation = getImageTransformation({
    mimeType,
    transformation,
  });

  const options = {
    folder: buildCloudinaryFolder(normalizedFolder),

    public_id: finalPublicId,

    resource_type: RESOURCE_TYPES.IMAGE,

    overwrite: false,

    unique_filename: false,

    use_filename: false,
  };

  if (finalTransformation) {
    options.transformation = finalTransformation;
  }

  const result = await uploadStream({
    buffer,
    options,
  });

  return formatUploadResult(result);
};

// ==================== Upload Document Buffer ====================

const uploadDocumentBuffer = async ({
  buffer,
  folder,
  originalName = "document",
  mimeType,
  publicId,
  prefix,
}) => {
  validateBuffer(buffer);

  const normalizedFolder = validateFolder(folder);

  validateMimeType(mimeType, DOCUMENT_MIME_TYPES);

  const finalPublicId =
    publicId ||
    buildPublicId({
      folder: normalizedFolder,

      originalName,

      prefix,
    });

  const result = await uploadStream({
    buffer,

    options: {
      folder: buildCloudinaryFolder(normalizedFolder),

      public_id: finalPublicId,

      resource_type: RESOURCE_TYPES.RAW,

      type: "upload",

      overwrite: false,

      unique_filename: false,

      use_filename: false,
    },
  });

  return formatUploadResult(result);
};

// ==================== Upload PDF Buffer ====================

const uploadPdfBuffer = async ({
  buffer,
  folder,
  originalName = "document",
  mimeType,
  publicId,
  prefix,
}) => {
  validateMimeType(mimeType, PDF_MIME_TYPES);

  return uploadDocumentBuffer({
    buffer,
    folder,
    originalName,
    mimeType,
    publicId,
    prefix,
  });
};

// ==================== Upload Multer Image ====================

const uploadMulterImage = async ({
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  if (!file) {
    throw createServiceError("Image file is required", 400, "IMAGE_REQUIRED");
  }

  return uploadImageBuffer({
    buffer: file.buffer,

    folder,

    originalName: file.originalname,

    mimeType: file.mimetype,

    publicId,

    prefix,

    transformation,
  });
};

// ==================== Upload Multer Document ====================

const uploadMulterDocument = async ({ file, folder, publicId, prefix }) => {
  if (!file) {
    throw createServiceError(
      "Document file is required",
      400,
      "DOCUMENT_REQUIRED",
    );
  }

  return uploadDocumentBuffer({
    buffer: file.buffer,

    folder,

    originalName: file.originalname,

    mimeType: file.mimetype,

    publicId,

    prefix,
  });
};

// ==================== Upload Multer PDF ====================

const uploadMulterPdf = async ({ file, folder, publicId, prefix }) => {
  if (!file) {
    throw createServiceError("PDF file is required", 400, "PDF_REQUIRED");
  }

  validateMimeType(file.mimetype, PDF_MIME_TYPES);

  return uploadPdfBuffer({
    buffer: file.buffer,

    folder,

    originalName: file.originalname,

    mimeType: file.mimetype,

    publicId,

    prefix,
  });
};

// ==================== Upload Multer File ====================

const uploadMulterFile = async ({
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  if (!file) {
    throw createServiceError("File is required", 400, "FILE_REQUIRED");
  }

  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    return uploadMulterImage({
      file,
      folder,
      publicId,
      prefix,
      transformation,
    });
  }

  if (DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    return uploadMulterDocument({
      file,
      folder,
      publicId,
      prefix,
    });
  }

  throw createServiceError(
    `File type ${file.mimetype} is not allowed`,
    400,
    "INVALID_FILE_TYPE",
  );
};

// ==================== Upload Multiple Multer Images ====================

const uploadMulterImages = async ({
  files = [],
  folder,
  prefix,
  transformation,
}) => {
  if (!Array.isArray(files)) {
    throw createServiceError(
      "Files must be provided as an array",
      400,
      "INVALID_FILES_ARRAY",
    );
  }

  if (files.length === 0) {
    return [];
  }

  validateFolder(folder);

  return Promise.all(
    files.map((file) =>
      uploadMulterImage({
        file,
        folder,
        prefix,
        transformation,
      }),
    ),
  );
};

// ==================== Upload Multiple Multer Documents ====================

const uploadMulterDocuments = async ({ files = [], folder, prefix }) => {
  if (!Array.isArray(files)) {
    throw createServiceError(
      "Files must be provided as an array",
      400,
      "INVALID_FILES_ARRAY",
    );
  }

  if (files.length === 0) {
    return [];
  }

  validateFolder(folder);

  return Promise.all(
    files.map((file) =>
      uploadMulterDocument({
        file,
        folder,
        prefix,
      }),
    ),
  );
};

// ==================== Upload Multiple Multer Files ====================

const uploadMulterFiles = async ({
  files = [],
  folder,
  prefix,
  transformation,
}) => {
  if (!Array.isArray(files)) {
    throw createServiceError(
      "Files must be provided as an array",
      400,
      "INVALID_FILES_ARRAY",
    );
  }

  if (files.length === 0) {
    return [];
  }

  validateFolder(folder);

  return Promise.all(
    files.map((file) =>
      uploadMulterFile({
        file,
        folder,
        prefix,
        transformation,
      }),
    ),
  );
};

// ==================== Delete Cloudinary Resource ====================

const deleteResource = async ({
  publicId,
  resourceType = RESOURCE_TYPES.IMAGE,
}) => {
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw createServiceError(
      "Cloudinary public ID is required",
      400,
      "PUBLIC_ID_REQUIRED",
    );
  }

  const normalizedResourceType = validateResourceType(resourceType);

  try {
    const result = await cloudinary.uploader.destroy(publicId.trim(), {
      resource_type: normalizedResourceType,

      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw createServiceError(
        "Cloudinary resource could not be deleted",
        500,
        "CLOUDINARY_DELETE_FAILED",
      );
    }

    return result;
  } catch (error) {
    if (error.statusCode && error.code) {
      throw error;
    }

    throw createServiceError(
      error.message || "Cloudinary resource deletion failed",
      error.http_code || 500,
      "CLOUDINARY_DELETE_FAILED",
    );
  }
};

// ==================== Delete Image ====================

const deleteImage = async (publicId) => {
  return deleteResource({
    publicId,

    resourceType: RESOURCE_TYPES.IMAGE,
  });
};

// ==================== Delete PDF ====================

const deletePdf = async (publicId) => {
  return deleteResource({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================== Delete Document ====================

const deleteDocument = async (publicId) => {
  return deleteResource({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================== Delete Resource Safely ====================

const deleteResourceSafely = async ({
  publicId,
  resourceType = RESOURCE_TYPES.IMAGE,
}) => {
  if (!publicId) {
    return null;
  }

  try {
    return await deleteResource({
      publicId,
      resourceType,
    });
  } catch (error) {
    console.error("Failed to delete Cloudinary resource:", {
      publicId,

      resourceType,

      message: error.message,

      code: error.code,
    });

    return null;
  }
};

// ==================== Delete Image Safely ====================

const deleteImageSafely = async (publicId) => {
  return deleteResourceSafely({
    publicId,

    resourceType: RESOURCE_TYPES.IMAGE,
  });
};

// ==================== Delete PDF Safely ====================

const deletePdfSafely = async (publicId) => {
  return deleteResourceSafely({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================== Delete Document Safely ====================

const deleteDocumentSafely = async (publicId) => {
  return deleteResourceSafely({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================== Delete Resource Batch ====================

const deleteResourceBatch = async ({ publicIds, resourceType }) => {
  const normalizedResourceType = validateResourceType(resourceType);

  const uniquePublicIds = [
    ...new Set(
      publicIds
        .filter(Boolean)
        .map((publicId) => String(publicId).trim())
        .filter(Boolean),
    ),
  ];

  if (uniquePublicIds.length === 0) {
    return [];
  }

  const batches = chunkArray(uniquePublicIds, MAX_BATCH_DELETE_SIZE);

  const results = [];

  for (const batch of batches) {
    try {
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: normalizedResourceType,

        type: "upload",

        invalidate: true,
      });

      const deleted = result.deleted || {};

      batch.forEach((publicId) => {
        const deletionStatus = deleted[publicId];

        results.push({
          success:
            deletionStatus === "deleted" || deletionStatus === "not_found",

          publicId,

          result: deletionStatus || null,
        });
      });
    } catch (error) {
      batch.forEach((publicId) => {
        results.push({
          success: false,

          publicId,

          message: error.message || "Resource deletion failed",
        });
      });
    }
  }

  return results;
};

// ==================== Delete Multiple Resources ====================

const deleteResources = async (resources = []) => {
  if (!Array.isArray(resources)) {
    throw createServiceError(
      "Resources must be provided as an array",
      400,
      "INVALID_RESOURCES_ARRAY",
    );
  }

  const validResources = resources.filter(
    (resource) => resource && typeof resource === "object" && resource.publicId,
  );

  if (validResources.length === 0) {
    return [];
  }

  const groupedResources = validResources.reduce((groups, resource) => {
    const resourceType = resource.resourceType || RESOURCE_TYPES.IMAGE;

    validateResourceType(resourceType);

    if (!groups[resourceType]) {
      groups[resourceType] = [];
    }

    groups[resourceType].push(resource.publicId);

    return groups;
  }, {});

  const groupResults = await Promise.all(
    Object.entries(groupedResources).map(([resourceType, publicIds]) =>
      deleteResourceBatch({
        publicIds,
        resourceType,
      }),
    ),
  );

  return groupResults.flat();
};

// ==================== Delete Multiple Images ====================

const deleteImages = async (publicIds = []) => {
  if (!Array.isArray(publicIds)) {
    throw createServiceError(
      "Public IDs must be provided as an array",
      400,
      "INVALID_PUBLIC_IDS_ARRAY",
    );
  }

  return deleteResourceBatch({
    publicIds,

    resourceType: RESOURCE_TYPES.IMAGE,
  });
};

// ==================== Delete Multiple Documents ====================

const deleteDocuments = async (publicIds = []) => {
  if (!Array.isArray(publicIds)) {
    throw createServiceError(
      "Public IDs must be provided as an array",
      400,
      "INVALID_PUBLIC_IDS_ARRAY",
    );
  }

  return deleteResourceBatch({
    publicIds,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================== Replace Image ====================

const replaceImage = async ({
  oldPublicId,
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  const uploadedImage = await uploadMulterImage({
    file,
    folder,
    publicId,
    prefix,
    transformation,
  });

  if (oldPublicId) {
    await deleteImageSafely(oldPublicId);
  }

  return uploadedImage;
};

// ==================== Replace PDF ====================

const replacePdf = async ({ oldPublicId, file, folder, publicId, prefix }) => {
  const uploadedPdf = await uploadMulterPdf({
    file,
    folder,
    publicId,
    prefix,
  });

  if (oldPublicId) {
    await deletePdfSafely(oldPublicId);
  }

  return uploadedPdf;
};

// ==================== Replace Document ====================

const replaceDocument = async ({
  oldPublicId,
  oldResourceType,
  file,
  folder,
  publicId,
  prefix,
}) => {
  const uploadedDocument = await uploadMulterDocument({
    file,
    folder,
    publicId,
    prefix,
  });

  if (oldPublicId) {
    await deleteResourceSafely({
      publicId: oldPublicId,

      resourceType: oldResourceType || RESOURCE_TYPES.RAW,
    });
  }

  return uploadedDocument;
};

// ==================== Replace File ====================

const replaceFile = async ({
  oldPublicId,
  oldResourceType,
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  const uploadedFile = await uploadMulterFile({
    file,
    folder,
    publicId,
    prefix,
    transformation,
  });

  if (oldPublicId) {
    await deleteResourceSafely({
      publicId: oldPublicId,

      resourceType: oldResourceType || RESOURCE_TYPES.IMAGE,
    });
  }

  return uploadedFile;
};

// ==================== Upload Image With Alt ====================

const uploadImageWithAlt = async ({
  file,
  folder,
  alt = "",
  publicId,
  prefix,
  transformation,
}) => {
  const uploadedImage = await uploadMulterImage({
    file,
    folder,
    publicId,
    prefix,
    transformation,
  });

  return formatImageResult({
    uploadedFile,
    alt,
  });
};

// ==================== Replace Image With Alt ====================

const replaceImageWithAlt = async ({
  currentImage,
  file,
  folder,
  alt,
  publicId,
  prefix,
  transformation,
}) => {
  if (!file) {
    return {
      url: currentImage?.url || "",

      publicId: currentImage?.publicId || "",

      alt:
        alt !== undefined ? String(alt || "").trim() : currentImage?.alt || "",
    };
  }

  const uploadedImage = await uploadMulterImage({
    file,
    folder,
    publicId,
    prefix,
    transformation,
  });

  const formattedImage = formatImageResult({
    uploadedFile: uploadedImage,

    alt: alt !== undefined ? alt : currentImage?.alt || "",
  });

  if (currentImage?.publicId) {
    await deleteImageSafely(currentImage.publicId);
  }

  return formattedImage;
};

// ==================== Exports ====================

module.exports = {
  CLOUDINARY_ROOT_FOLDER,
  CLOUDINARY_FOLDERS,
  ALLOWED_FOLDERS,

  RASTER_IMAGE_MIME_TYPES,
  VECTOR_IMAGE_MIME_TYPES,
  IMAGE_MIME_TYPES,

  PDF_MIME_TYPES,
  OFFICE_DOCUMENT_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  ALLOWED_MIME_TYPES,

  RESOURCE_TYPES,
  DEFAULT_IMAGE_TRANSFORMATION,

  createServiceError,

  validateFolder,
  validateBuffer,
  validateMimeType,
  validateResourceType,

  sanitizeBaseName,
  buildPublicId,
  buildCloudinaryFolder,

  formatUploadResult,
  formatImageResult,

  uploadStream,

  uploadImageBuffer,
  uploadDocumentBuffer,
  uploadPdfBuffer,

  uploadMulterImage,
  uploadMulterDocument,
  uploadMulterPdf,
  uploadMulterFile,

  uploadMulterImages,
  uploadMulterDocuments,
  uploadMulterFiles,

  deleteResource,
  deleteImage,
  deletePdf,
  deleteDocument,

  deleteResourceSafely,
  deleteImageSafely,
  deletePdfSafely,
  deleteDocumentSafely,

  deleteResourceBatch,
  deleteResources,
  deleteImages,
  deleteDocuments,

  replaceImage,
  replacePdf,
  replaceDocument,
  replaceFile,

  uploadImageWithAlt,
  replaceImageWithAlt,
};
