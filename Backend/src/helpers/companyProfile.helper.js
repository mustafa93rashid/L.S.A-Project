const path = require("path");

const CompanyProfile = require("../models/companyProfile.model");

const {
  CLOUDINARY_FOLDERS,
  uploadMulterPdf,
  deletePdfSafely,
} = require("../services/cloudinary.service");

const DEFAULT_COMPANY_PROFILE_NAME =
  "LSA-Engineering-Services-Company-Profile.pdf";

// ==================== Get Current Company Profile ====================

const getCurrentCompanyProfile = async () => {
  return CompanyProfile.findOne().lean();
};

// ==================== Generate Company Profile File Name ====================

const generateCompanyProfileFileName = (originalName) => {
  if (!originalName) {
    return DEFAULT_COMPANY_PROFILE_NAME;
  }

  const extension = path.extname(originalName) || ".pdf";

  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseName) {
    return DEFAULT_COMPANY_PROFILE_NAME;
  }

  return `${baseName}${extension.toLowerCase()}`;
};

// ==================== Upload Company Profile File ====================

const uploadCompanyProfileFile = async (file) => {
  if (!file) {
    const error = new Error("Company profile file is required");

    error.statusCode = 400;
    error.code = "COMPANY_PROFILE_FILE_REQUIRED";

    throw error;
  }

  const uploadedFile = await uploadMulterPdf({
    file,
    folder: CLOUDINARY_FOLDERS.COMPANY_PROFILE,
    prefix: "company_profile",
  });

  return {
    ...uploadedFile,
    originalName: generateCompanyProfileFileName(file.originalname),
  };
};

// ==================== Delete Company Profile File ====================

const deleteCompanyProfileFile = async (publicId) => {
  if (!publicId) {
    return null;
  }

  return deletePdfSafely(publicId);
};

// ==================== Replace Company Profile ====================

const replaceCompanyProfile = async ({ file, userId }) => {
  const existingProfile = await CompanyProfile.findOne();

  let uploadedFile = null;

  try {
    uploadedFile = await uploadCompanyProfileFile(file);

    let companyProfile;

    if (existingProfile) {
      const oldPublicId = existingProfile.publicId;

      existingProfile.fileName = uploadedFile.originalName;
      existingProfile.url = uploadedFile.url;
      existingProfile.publicId = uploadedFile.publicId;
      existingProfile.resourceType = uploadedFile.resourceType;
      existingProfile.format = uploadedFile.format || "pdf";
      existingProfile.size = uploadedFile.bytes;
      existingProfile.updatedBy = userId;

      companyProfile = await existingProfile.save();

      if (
        oldPublicId &&
        oldPublicId !== uploadedFile.publicId
      ) {
        await deleteCompanyProfileFile(oldPublicId);
      }
    } else {
      companyProfile = await CompanyProfile.create({
        fileName: uploadedFile.originalName,
        url: uploadedFile.url,
        publicId: uploadedFile.publicId,
        resourceType: uploadedFile.resourceType,
        format: uploadedFile.format || "pdf",
        size: uploadedFile.bytes,
        updatedBy: userId,
      });
    }

    return companyProfile;
  } catch (error) {
    if (uploadedFile?.publicId) {
      await deleteCompanyProfileFile(uploadedFile.publicId);
    }

    throw error;
  }
};

// ==================== Remove Company Profile ====================

const removeCompanyProfile = async () => {
  const companyProfile = await CompanyProfile.findOne();

  if (!companyProfile) {
    return null;
  }

  await CompanyProfile.deleteOne({
    _id: companyProfile._id,
  });

  if (companyProfile.publicId) {
    await deleteCompanyProfileFile(companyProfile.publicId);
  }

  return companyProfile;
};

module.exports = {
  getCurrentCompanyProfile,
  generateCompanyProfileFileName,
  uploadCompanyProfileFile,
  deleteCompanyProfileFile,
  replaceCompanyProfile,
  removeCompanyProfile,
};