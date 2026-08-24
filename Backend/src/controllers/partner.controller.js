const Partner = require("../models/partner.model");

const {uploadMulterImage, replaceImage, deleteImage } = require("../services/cloudinary.service");

class PartnerController {
  // ==================== Get Public Partners ====================

getPublicPartners = async (req, res) => {
  const partners = await Partner.find(
    {},
    "logo website displayOrder"
  )
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: partners.length,
    data: partners,
  });
};

  // ==================== Get All Partners ====================

getAllPartners = async (req, res) => {
  const partners = await Partner.find()
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: partners.length,
    data: partners,
  });
};

  // ==================== Create Partner ====================

createPartner = async (req, res) => {
  const { website, displayOrder } = req.body;

  let uploadedLogo = null;

  try {
    uploadedLogo = await uploadMulterImage({
      file: req.file,
      folder: "partners",
      prefix: "partner",
    });

    const partner = await Partner.create({
      logo: {
        url: uploadedLogo.url,
        publicId: uploadedLogo.publicId,
      },

      website: website?.trim() || null,

      displayOrder: Number(displayOrder),
    });

    return res.status(201).json({
      success: true,
      message: "Partner created successfully",
      data: partner,
    });
  } catch (error) {
    if (uploadedLogo?.publicId) {
      try {
        await deleteImage(uploadedLogo.publicId);
      } catch (deleteError) {
        console.error("Failed to delete uploaded partner logo:", {
          publicId: uploadedLogo.publicId,
          message: deleteError.message,
        });
      }
    }

    throw error;
  }
};

  // ==================== Update Partner ====================

updatePartner = async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: "Partner not found",
    });
  }

  const { website, displayOrder } = req.body;

  if (req.file) {
    const updatedLogo = await replaceImage({
      oldPublicId: partner.logo?.publicId,
      file: req.file,
      folder: "partners",
      prefix: "partner",
    });

    partner.logo = {
      url: updatedLogo.url,
      publicId: updatedLogo.publicId,
    };
  }

  if (website !== undefined) {
    partner.website = website.trim() || null;
  }

  if (displayOrder !== undefined) {
    partner.displayOrder = Number(displayOrder);
  }

  await partner.save();

  return res.status(200).json({
    success: true,
    message: "Partner updated successfully",
    data: partner,
  });
};
  // ==================== Delete Partner ====================

  deletePartner = async (req, res) => {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.logo?.publicId) {
      await deleteImage(partner.logo.publicId);
    }

    await partner.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Partner deleted successfully",
    });
  };
}

module.exports = new PartnerController();
