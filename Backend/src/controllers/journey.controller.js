const Journey = require("../models/journey.model");

const {
  uploadMulterImage,
  replaceImage,
  deleteImage,
} = require("../services/cloudinary.service");

class JourneyController {
  // ==================== Get Public Journeys ====================
  getPublicJourneys = async (req, res) => {
    const journeys = await Journey.find(
      {},
      "period title description icon side image",
    )
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: journeys.length,
      data: journeys,
    });
  };

  // ==================== Get All Journeys ====================
  getAllJourneys = async (req, res) => {
    const journeys = await Journey.find().sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: journeys.length,
      data: journeys,
    });
  };

  // ==================== Create Journey ====================
  createJourney = async (req, res) => {
    const { period, title, description, icon, side } = req.body;

    let uploadedImage = null;

    try {
      uploadedImage = await uploadMulterImage({
        file: req.file,
        folder: "journeys",
        prefix: "journey",
      });

      const journey = await Journey.create({
        period,
        title,
        description,
        icon,
        side,
        image: {
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Journey created successfully",
        data: journey,
      });
    } catch (error) {
      if (uploadedImage?.publicId) {
        try {
          await deleteImage(uploadedImage.publicId);
        } catch (deleteError) {
          console.error("Failed to delete uploaded journey image:", {
            publicId: uploadedImage.publicId,
            message: deleteError.message,
          });
        }
      }

      throw error;
    }
  };

  // ==================== Update Journey ====================
  updateJourney = async (req, res) => {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: "Journey not found",
      });
    }

    const { period, title, description, icon, side } = req.body;

    if (req.file) {
      const updatedImage = await replaceImage({
        oldPublicId: journey.image?.publicId,
        file: req.file,
        folder: "journeys",
        prefix: "journey",
      });

      journey.image = {
        url: updatedImage.url,
        publicId: updatedImage.publicId,
      };
    }

    if (period !== undefined) {
      journey.period = period;
    }

    if (title !== undefined) {
      journey.title = title;
    }

    if (description !== undefined) {
      journey.description = description;
    }

    if (icon !== undefined) {
      journey.icon = icon;
    }

    if (side !== undefined) {
      journey.side = side;
    }

    await journey.save();

    return res.status(200).json({
      success: true,
      message: "Journey updated successfully",
      data: journey,
    });
  };

  // ==================== Delete Journey ====================
  deleteJourney = async (req, res) => {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: "Journey not found",
      });
    }

    if (journey.image?.publicId) {
      await deleteImage(journey.image.publicId);
    }

    await journey.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Journey deleted successfully",
    });
  };
}

module.exports = new JourneyController();
