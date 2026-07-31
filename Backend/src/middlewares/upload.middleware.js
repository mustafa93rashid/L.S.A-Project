const multer = require("multer");

const {
  ALLOWED_MIME_TYPES,
} = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPEG, PNG, GIF, and WebP images are allowed.",
    ),
    false,
  );
};

/*
|--------------------------------------------------------------------------
| Multer Configuration
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 20,
  },
});

/*
|--------------------------------------------------------------------------
| Generic Upload Middlewares
|--------------------------------------------------------------------------
*/

const uploadSingle = (fieldName) =>
  upload.single(fieldName);

const uploadArray = (
  fieldName,
  maxCount = 10,
) => upload.array(fieldName, maxCount);

const uploadFields = (fields) =>
  upload.fields(fields);

/*
|--------------------------------------------------------------------------
| Ready Upload Middlewares
|--------------------------------------------------------------------------
*/

const uploadPartnerLogo = () =>
  upload.single("logo");

const uploadJourneyImage = () =>
  upload.single("image");

const uploadTeamMemberImage = () =>
  upload.single("image");

const uploadServiceImages = () =>
  upload.fields([
    {
      name: "cardImage",
      maxCount: 1,
    },
    {
      name: "heroImage",
      maxCount: 1,
    },
  ]);

const uploadProjectImages = () =>
  upload.fields([
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
  ]);

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadSingle,
  uploadArray,
  uploadFields,

  uploadPartnerLogo,
  uploadJourneyImage,
  uploadTeamMemberImage,
  uploadServiceImages,
  uploadProjectImages,

  fileFilter,
};