const multer = require("multer");

const {
  IMAGE_MIME_TYPES,
} = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
  10 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Create Multer Error
// ==================================================

const createUploadError = (
  message,
  code = "INVALID_FILE_TYPE",
) => {
  const error = new Error(
    message,
  );

  error.statusCode = 400;
  error.code = code;

  return error;
};

/*
|--------------------------------------------------------------------------
| File Filters
|--------------------------------------------------------------------------
*/

// ==================================================
// Image File Filter
// ==================================================

const imageFileFilter = (
  req,
  file,
  cb,
) => {
  if (
    IMAGE_MIME_TYPES.includes(
      file.mimetype,
    )
  ) {
    return cb(
      null,
      true,
    );
  }

  return cb(
    createUploadError(
      "Only JPEG, PNG, GIF, and WebP images are allowed.",
      "INVALID_IMAGE_TYPE",
    ),
    false,
  );
};

// ==================================================
// Document File Filter
// ==================================================
/*
| Accepts:
|
| - PDF
| - DOC
| - DOCX
|
*/

const documentFileFilter = (
  req,
  file,
  cb,
) => {
  if (
    DOCUMENT_MIME_TYPES.includes(
      file.mimetype,
    )
  ) {
    return cb(
      null,
      true,
    );
  }

  return cb(
    createUploadError(
      "Only PDF, DOC, and DOCX files are allowed.",
      "INVALID_DOCUMENT_TYPE",
    ),
    false,
  );
};

/*
|--------------------------------------------------------------------------
| Multer Configurations
|--------------------------------------------------------------------------
*/

// ==================================================
// Image Upload Configuration
// ==================================================

const imageUpload = multer({
  storage:
    multer.memoryStorage(),

  fileFilter:
    imageFileFilter,

  limits: {
    fileSize:
      MAX_IMAGE_SIZE,

    files: 20,
  },
});

// ==================================================
// Document Upload Configuration
// ==================================================

const documentUpload = multer({
  storage:
    multer.memoryStorage(),

  fileFilter:
    documentFileFilter,

  limits: {
    fileSize:
      MAX_DOCUMENT_SIZE,

    files: 20,
  },
});

/*
|--------------------------------------------------------------------------
| Generic Image Upload Middlewares
|--------------------------------------------------------------------------
*/

// ==================================================
// Upload Single Image
// ==================================================

const uploadSingle = (
  fieldName,
) => {
  return imageUpload.single(
    fieldName,
  );
};

// ==================================================
// Upload Image Array
// ==================================================

const uploadArray = (
  fieldName,
  maxCount = 10,
) => {
  return imageUpload.array(
    fieldName,
    maxCount,
  );
};

// ==================================================
// Upload Image Fields
// ==================================================

const uploadFields = (
  fields,
) => {
  return imageUpload.fields(
    fields,
  );
};

/*
|--------------------------------------------------------------------------
| Generic Document Upload Middlewares
|--------------------------------------------------------------------------
*/

// ==================================================
// Upload Single Document
// ==================================================

const uploadSingleDocument = (
  fieldName,
) => {
  return documentUpload.single(
    fieldName,
  );
};

// ==================================================
// Upload Document Array
// ==================================================

const uploadDocumentArray = (
  fieldName,
  maxCount = 10,
) => {
  return documentUpload.array(
    fieldName,
    maxCount,
  );
};

// ==================================================
// Upload Document Fields
// ==================================================

const uploadDocumentFields = (
  fields,
) => {
  return documentUpload.fields(
    fields,
  );
};

/*
|--------------------------------------------------------------------------
| Ready Image Upload Middlewares
|--------------------------------------------------------------------------
*/

// ==================================================
// Partner Logo
// ==================================================

const uploadPartnerLogo = () => {
  return imageUpload.single(
    "logo",
  );
};

// ==================================================
// Journey Image
// ==================================================

const uploadJourneyImage = () => {
  return imageUpload.single(
    "image",
  );
};

// ==================================================
// Team Member Image
// ==================================================

const uploadTeamMemberImage = () => {
  return imageUpload.single(
    "image",
  );
};

// ==================================================
// Service Images
// ==================================================

const uploadServiceImages = () => {
  return imageUpload.fields([
    {
      name: "cardImage",
      maxCount: 1,
    },

    {
      name: "heroImage",
      maxCount: 1,
    },
  ]);
};

// ==================================================
// Project Images
// ==================================================

const uploadProjectImages = () => {
  return imageUpload.fields([
    {
      name: "cardImage",
      maxCount: 1,
    },

    {
      name: "heroImage",
      maxCount: 1,
    },

    {
      name: "gallery",
      maxCount: 20,
    },

    {
      name:
        "certificateImages",
      maxCount: 10,
    },
  ]);
};

// ==================================================
// Equipment Image
// ==================================================
/*
| Safety certificate is stored as text.
|
| The middleware accepts only:
|
| image
|
*/

const uploadEquipmentImage = () => {
  return imageUpload.single(
    "image",
  );
};

/*
|--------------------------------------------------------------------------
| Ready Document Upload Middlewares
|--------------------------------------------------------------------------
*/

// ==================================================
// Resume
// ==================================================
/*
| Legacy field:
|
| resume
|
| Keep this middleware if older controllers use it.
|
*/

const uploadResume = () => {
  return documentUpload.single(
    "resume",
  );
};

// ==================================================
// Job Request CV
// ==================================================
/*
| Job application popup field:
|
| cv
|
*/

const uploadJobRequestCv = () => {
  return documentUpload.single(
    "cv",
  );
};

// ==================================================
// Certificate
// ==================================================

const uploadCertificate = () => {
  return documentUpload.single(
    "certificate",
  );
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,

  DOCUMENT_MIME_TYPES,

  createUploadError,

  imageFileFilter,
  documentFileFilter,

  uploadSingle,
  uploadArray,
  uploadFields,

  uploadSingleDocument,
  uploadDocumentArray,
  uploadDocumentFields,

  uploadPartnerLogo,
  uploadJourneyImage,
  uploadTeamMemberImage,
  uploadServiceImages,
  uploadProjectImages,
  uploadEquipmentImage,

  uploadResume,
  uploadJobRequestCv,
  uploadCertificate,
};