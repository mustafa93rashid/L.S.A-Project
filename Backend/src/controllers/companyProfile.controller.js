const {
  getCurrentCompanyProfile,
  replaceCompanyProfile,
  removeCompanyProfile,
} = require("../helpers/companyProfile.helper");

// ==================== Get Company Profile ====================

const getCompanyProfile = async (req, res) => {
  const companyProfile = await getCurrentCompanyProfile();

  if (!companyProfile) {
    return res.status(404).json({
      success: false,
      message: "Company profile is not available",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: companyProfile._id,
      fileName: companyProfile.fileName,
      url: companyProfile.url,
      format: companyProfile.format,
      size: companyProfile.size,
      updatedAt: companyProfile.updatedAt,
    },
  });
};

// ==================== Download Company Profile ====================

const downloadCompanyProfile = async (req, res) => {
  const companyProfile = await getCurrentCompanyProfile();

  if (!companyProfile) {
    return res.status(404).json({
      success: false,
      message: "Company profile is not available",
    });
  }

  const response = await fetch(companyProfile.url);

  if (!response.ok) {
    const error = new Error("Failed to retrieve company profile file");

    error.statusCode = 502;
    error.code = "COMPANY_PROFILE_DOWNLOAD_FAILED";

    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const safeFileName =
    companyProfile.fileName || "LSA-Company-Profile.pdf";

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFileName}"`,
  );

  res.setHeader("Content-Length", buffer.length);

  return res.send(buffer);
};

// ==================== Update Company Profile ====================

const updateCompanyProfile = async (req, res) => {
  const companyProfile = await replaceCompanyProfile({
    file: req.file,
    userId: req.user._id,
  });

  return res.status(200).json({
    success: true,
    message: "Company profile updated successfully",
    data: {
      id: companyProfile._id,
      fileName: companyProfile.fileName,
      url: companyProfile.url,
      format: companyProfile.format,
      size: companyProfile.size,
      updatedAt: companyProfile.updatedAt,
    },
  });
};

// ==================== Delete Company Profile ====================

const deleteCompanyProfile = async (req, res) => {
  const companyProfile = await removeCompanyProfile();

  if (!companyProfile) {
    return res.status(404).json({
      success: false,
      message: "Company profile is not available",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Company profile deleted successfully",
  });
};

module.exports = {
  getCompanyProfile,
  downloadCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
};