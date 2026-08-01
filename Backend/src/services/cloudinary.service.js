const cloudinary = require("../config/cloudinary");

/*
|--------------------------------------------------------------------------
| Cloudinary Service
|--------------------------------------------------------------------------
|
| Handles:
|
| - Image uploads
| - PDF uploads
| - Multiple image uploads
| - Resource deletion
| - Resource replacement
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CLOUDINARY_ROOT_FOLDER = "lsa";

const ALLOWED_FOLDERS = [
  "users",
  "partners",
  "journeys",
  "team-members",

  "services/cards",
  "services/heroes",

  "projects/cards",
  "projects/hero",
  "projects/gallery",
  "projects/certificates",

  "equipment/images",

  "resumes",
  "certificates",
];

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const PDF_MIME_TYPES = ["application/pdf"];

const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES];

const RESOURCE_TYPES = {
  IMAGE: "image",
  RAW: "raw",
};

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Validate Upload Folder
// ==================================================

const validateFolder = (folder) => {
  if (!folder) {
    throw createServiceError(
      "Upload folder is required.",
      400,
      "UPLOAD_FOLDER_REQUIRED",
    );
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw createServiceError(
      `Invalid upload folder: ${folder}`,
      400,
      "INVALID_UPLOAD_FOLDER",
    );
  }

  return folder;
};

// ==================================================
// Validate File Buffer
// ==================================================

const validateBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw createServiceError(
      "A valid file buffer is required.",
      400,
      "FILE_BUFFER_REQUIRED",
    );
  }
};

// ==================================================
// Validate MIME Type
// ==================================================

const validateMimeType = (mimeType, allowedTypes) => {
  if (!mimeType) {
    throw createServiceError(
      "File MIME type is required.",
      400,
      "FILE_MIME_TYPE_REQUIRED",
    );
  }

  if (!allowedTypes.includes(mimeType)) {
    throw createServiceError(
      `File type ${mimeType} is not allowed.`,
      400,
      "INVALID_FILE_TYPE",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Naming Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Sanitize Base Name
// ==================================================

const sanitizeBaseName = (value) => {
  return (
    String(value || "file")
      .trim()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "file"
  );
};

// ==================================================
// Build Public ID
// ==================================================

const buildPublicId = ({ folder, originalName, prefix }) => {
  const sanitizedFolder = sanitizeBaseName(folder);

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

// ==================================================
// Build Cloudinary Folder
// ==================================================

const buildCloudinaryFolder = (folder) => {
  validateFolder(folder);

  return `${CLOUDINARY_ROOT_FOLDER}/${folder}`;
};

/*
|--------------------------------------------------------------------------
| Upload Stream
|--------------------------------------------------------------------------
*/

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

    const cloudinaryStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return rejectOnce(
            createServiceError(
              error.message || "Cloudinary upload failed.",
              error.http_code || 500,
              "CLOUDINARY_UPLOAD_FAILED",
            ),
          );
        }

        if (!result) {
          return rejectOnce(
            createServiceError(
              "Cloudinary returned an empty upload result.",
              500,
              "EMPTY_CLOUDINARY_RESULT",
            ),
          );
        }

        return resolveOnce(result);
      },
    );

    cloudinaryStream.on("error", (error) => {
      rejectOnce(
        createServiceError(
          error.message || "Cloudinary upload stream failed.",
          500,
          "CLOUDINARY_STREAM_FAILED",
        ),
      );
    });

    cloudinaryStream.end(buffer);
  });
};

/*
|--------------------------------------------------------------------------
| Result Formatters
|--------------------------------------------------------------------------
*/

// ==================================================
// Format Upload Result
// ==================================================

const formatUploadResult = (result) => {
  return {
    url: result.secure_url,

    publicId: result.public_id,

    resourceType: result.resource_type,

    format: result.format || null,

    bytes: result.bytes || null,

    width: result.width || null,

    height: result.height || null,
  };
};

// ==================================================
// Format Image Result
// ==================================================

const formatImageResult = ({ uploadedFile, alt = "" }) => {
  return {
    url: uploadedFile.url,

    publicId: uploadedFile.publicId,

    alt: String(alt || "").trim(),
  };
};

/*
|--------------------------------------------------------------------------
| Upload Buffers
|--------------------------------------------------------------------------
*/

// ==================================================
// Upload Image Buffer
// ==================================================

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

  validateFolder(folder);

  validateMimeType(mimeType, IMAGE_MIME_TYPES);

  const finalPublicId =
    publicId ||
    buildPublicId({
      folder,
      originalName,
      prefix,
    });

  const result = await uploadStream({
    buffer,

    options: {
      folder: buildCloudinaryFolder(folder),

      public_id: finalPublicId,

      resource_type: RESOURCE_TYPES.IMAGE,

      transformation: transformation || [
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
      ],

      overwrite: false,

      unique_filename: false,

      use_filename: false,
    },
  });

  return formatUploadResult(result);
};

// ==================================================
// Upload PDF Buffer
// ==================================================

const uploadPdfBuffer = async ({
  buffer,
  folder,
  originalName = "document",
  mimeType,
  publicId,
  prefix,
}) => {
  validateBuffer(buffer);

  validateFolder(folder);

  validateMimeType(mimeType, PDF_MIME_TYPES);

  const finalPublicId =
    publicId ||
    buildPublicId({
      folder,
      originalName,
      prefix,
    });

  const result = await uploadStream({
    buffer,

    options: {
      folder: buildCloudinaryFolder(folder),

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

/*
|--------------------------------------------------------------------------
| Multer Uploads
|--------------------------------------------------------------------------
*/

// ==================================================
// Upload Multer Image
// ==================================================

const uploadMulterImage = async ({
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  if (!file) {
    throw createServiceError("Image file is required.", 400, "IMAGE_REQUIRED");
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

// ==================================================
// Upload Multer PDF
// ==================================================

const uploadMulterPdf = async ({ file, folder, publicId, prefix }) => {
  if (!file) {
    throw createServiceError("PDF file is required.", 400, "PDF_REQUIRED");
  }

  return uploadPdfBuffer({
    buffer: file.buffer,

    folder,

    originalName: file.originalname,

    mimeType: file.mimetype,

    publicId,

    prefix,
  });
};

// ==================================================
// Upload Multer Document
// ==================================================
/*
| Accepts:
|
| - Images
| - PDF files
|
*/

const uploadMulterDocument = async ({
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  if (!file) {
    throw createServiceError(
      "Document file is required.",
      400,
      "DOCUMENT_REQUIRED",
    );
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

  if (PDF_MIME_TYPES.includes(file.mimetype)) {
    return uploadMulterPdf({
      file,

      folder,

      publicId,

      prefix,
    });
  }

  throw createServiceError(
    `File type ${file.mimetype} is not allowed.`,
    400,
    "INVALID_DOCUMENT_TYPE",
  );
};

// ==================================================
// Upload Multiple Multer Images
// ==================================================

const uploadMulterImages = async ({
  files = [],
  folder,
  prefix,
  transformation,
}) => {
  if (!Array.isArray(files)) {
    throw createServiceError(
      "Files must be provided as an array.",
      400,
      "INVALID_FILES_ARRAY",
    );
  }

  if (files.length === 0) {
    return [];
  }

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

// ==================================================
// Upload Multiple Multer Documents
// ==================================================

const uploadMulterDocuments = async ({
  files = [],
  folder,
  prefix,
  transformation,
}) => {
  if (!Array.isArray(files)) {
    throw createServiceError(
      "Files must be provided as an array.",
      400,
      "INVALID_FILES_ARRAY",
    );
  }

  if (files.length === 0) {
    return [];
  }

  return Promise.all(
    files.map((file) =>
      uploadMulterDocument({
        file,

        folder,

        prefix,

        transformation,
      }),
    ),
  );
};

/*
|--------------------------------------------------------------------------
| Resource Deletion
|--------------------------------------------------------------------------
*/

// ==================================================
// Delete Cloudinary Resource
// ==================================================

const deleteResource = async ({
  publicId,
  resourceType = RESOURCE_TYPES.IMAGE,
}) => {
  if (!publicId) {
    throw createServiceError(
      "Cloudinary public ID is required.",
      400,
      "PUBLIC_ID_REQUIRED",
    );
  }

  if (!Object.values(RESOURCE_TYPES).includes(resourceType)) {
    throw createServiceError(
      `Invalid Cloudinary resource type: ${resourceType}`,
      400,
      "INVALID_RESOURCE_TYPE",
    );
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,

      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw createServiceError(
        "Cloudinary resource could not be deleted.",
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
      error.message || "Cloudinary resource deletion failed.",
      error.http_code || 500,
      "CLOUDINARY_DELETE_FAILED",
    );
  }
};

// ==================================================
// Delete Image
// ==================================================

const deleteImage = async (publicId) => {
  return deleteResource({
    publicId,

    resourceType: RESOURCE_TYPES.IMAGE,
  });
};

// ==================================================
// Delete PDF
// ==================================================

const deletePdf = async (publicId) => {
  return deleteResource({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================================================
// Delete Resource Safely
// ==================================================

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

// ==================================================
// Delete Image Safely
// ==================================================

const deleteImageSafely = async (publicId) => {
  return deleteResourceSafely({
    publicId,

    resourceType: RESOURCE_TYPES.IMAGE,
  });
};

// ==================================================
// Delete PDF Safely
// ==================================================

const deletePdfSafely = async (publicId) => {
  return deleteResourceSafely({
    publicId,

    resourceType: RESOURCE_TYPES.RAW,
  });
};

// ==================================================
// Delete Multiple Resources
// ==================================================

const deleteResources = async (resources = []) => {
  if (!Array.isArray(resources)) {
    throw createServiceError(
      "Resources must be provided as an array.",
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

  const results = await Promise.allSettled(
    validResources.map((resource) =>
      deleteResource({
        publicId: resource.publicId,

        resourceType: resource.resourceType || RESOURCE_TYPES.IMAGE,
      }),
    ),
  );

  return results.map((result, index) => {
    const resource = validResources[index];

    if (result.status === "fulfilled") {
      return {
        success: true,

        publicId: resource.publicId,

        result: result.value,
      };
    }

    return {
      success: false,

      publicId: resource.publicId,

      message: result.reason?.message || "Resource deletion failed.",
    };
  });
};

// ==================================================
// Delete Multiple Images
// ==================================================

const deleteImages = async (publicIds = []) => {
  if (!Array.isArray(publicIds)) {
    throw createServiceError(
      "Public IDs must be provided as an array.",
      400,
      "INVALID_PUBLIC_IDS_ARRAY",
    );
  }

  const validPublicIds = publicIds.filter(Boolean);

  if (validPublicIds.length === 0) {
    return [];
  }

  return deleteResources(
    validPublicIds.map((publicId) => ({
      publicId,

      resourceType: RESOURCE_TYPES.IMAGE,
    })),
  );
};

/*
|--------------------------------------------------------------------------
| Resource Replacement
|--------------------------------------------------------------------------
*/

// ==================================================
// Replace Image
// ==================================================

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

// ==================================================
// Replace PDF
// ==================================================

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

// ==================================================
// Replace Document
// ==================================================
/*
| Supports:
|
| - Replacing image with image
| - Replacing image with PDF
| - Replacing PDF with image
| - Replacing PDF with PDF
|
*/

const replaceDocument = async ({
  oldPublicId,
  oldResourceType,
  file,
  folder,
  publicId,
  prefix,
  transformation,
}) => {
  const uploadedDocument = await uploadMulterDocument({
    file,

    folder,

    publicId,

    prefix,

    transformation,
  });

  if (oldPublicId) {
    await deleteResourceSafely({
      publicId: oldPublicId,

      resourceType: oldResourceType || RESOURCE_TYPES.RAW,
    });
  }

  return uploadedDocument;
};

/*
|--------------------------------------------------------------------------
| Image Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Upload Image With Alt
// ==================================================

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
    uploadedFile: uploadedImage,

    alt,
  });
};

// ==================================================
// Replace Image With Alt
// ==================================================

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
      url: currentImage?.url,

      publicId: currentImage?.publicId,

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

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  CLOUDINARY_ROOT_FOLDER,

  ALLOWED_FOLDERS,

  IMAGE_MIME_TYPES,

  PDF_MIME_TYPES,

  ALLOWED_MIME_TYPES,

  RESOURCE_TYPES,

  createServiceError,

  validateFolder,

  validateBuffer,

  validateMimeType,

  sanitizeBaseName,

  buildPublicId,

  buildCloudinaryFolder,

  formatUploadResult,

  formatImageResult,

  uploadImageBuffer,

  uploadPdfBuffer,

  uploadMulterImage,

  uploadMulterPdf,

  uploadMulterDocument,

  uploadMulterImages,

  uploadMulterDocuments,

  deleteResource,

  deleteImage,

  deletePdf,

  deleteResourceSafely,

  deleteImageSafely,

  deletePdfSafely,

  deleteResources,

  deleteImages,

  replaceImage,

  replacePdf,

  replaceDocument,

  uploadImageWithAlt,

  replaceImageWithAlt,
};
