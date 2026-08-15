const PDF_MIME_TYPE = "application/pdf";

const MAX_COMPANY_PROFILE_SIZE = 20 * 1024 * 1024;

// ==================== Create Validation Error ====================

const createValidationError = (message, code) => {
  const error = new Error(message);

  error.statusCode = 400;
  error.code = code;

  return error;
};

// ==================== Validate Company Profile Upload ====================

const validateCompanyProfileUpload = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return next(
      createValidationError(
        "Company profile PDF file is required",
        "COMPANY_PROFILE_FILE_REQUIRED",
      ),
    );
  }

  if (file.mimetype !== PDF_MIME_TYPE) {
    return next(
      createValidationError(
        "Only PDF files are allowed for the company profile",
        "INVALID_COMPANY_PROFILE_FILE_TYPE",
      ),
    );
  }

  const fileName = file.originalname?.toLowerCase();

  if (!fileName?.endsWith(".pdf")) {
    return next(
      createValidationError(
        "The company profile file must have a .pdf extension",
        "INVALID_COMPANY_PROFILE_EXTENSION",
      ),
    );
  }

  if (file.size > MAX_COMPANY_PROFILE_SIZE) {
    return next(
      createValidationError(
        "Company profile file must not exceed 20 MB",
        "COMPANY_PROFILE_FILE_TOO_LARGE",
      ),
    );
  }

  next();
};

module.exports = {
  validateCompanyProfileUpload,
};