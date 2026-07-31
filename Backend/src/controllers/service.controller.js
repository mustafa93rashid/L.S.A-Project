const Service = require("../models/service.model");

const {
  uploadMulterImage,
  replaceImage,
  deleteImage,
} = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

const uploadServiceImages = async (cardImageFile, heroImageFile) => {
  const cardImage = await uploadMulterImage({
    file: cardImageFile,
    folder: "services/cards",
    prefix: "service-card",
  });

  const heroImage = await uploadMulterImage({
    file: heroImageFile,
    folder: "services/heroes",
    prefix: "service-hero",
  });

  return {
    cardImage,
    heroImage,
  };
};

const deleteServiceImages = async (cardImage, heroImage) => {
  if (cardImage?.publicId) {
    await deleteImage(cardImage.publicId);
  }

  if (heroImage?.publicId) {
    await deleteImage(heroImage.publicId);
  }
};

const replaceServiceImages = async (service, cardImageFile, heroImageFile) => {
  if (cardImageFile) {
    const uploadedCardImage = await replaceImage({
      oldPublicId: service.cardImage.publicId,

      file: cardImageFile,

      folder: "services/cards",

      prefix: "service-card",
    });

    service.cardImage = {
      url: uploadedCardImage.url,
      publicId: uploadedCardImage.publicId,
    };
  }

  if (heroImageFile) {
    const uploadedHeroImage = await replaceImage({
      oldPublicId: service.hero.image.publicId,

      file: heroImageFile,

      folder: "services/heroes",

      prefix: "service-hero",
    });

    service.hero.image = {
      url: uploadedHeroImage.url,
      publicId: uploadedHeroImage.publicId,
    };
  }
};

/*
|--------------------------------------------------------------------------
| Service Controller
|--------------------------------------------------------------------------
*/

class ServiceController {
  /*
  |--------------------------------------------------------------------------
  | Get Public Services
  |--------------------------------------------------------------------------
  */

  getPublicServices = async (req, res) => {
    const services = await Service.find({
      isActive: true,
    })
      .select(
        "title slug categoryLabel shortDescription cardImage highlights displayOrder isFeatured",
      )
      .sort({
        displayOrder: 1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Public Service By Slug
  |--------------------------------------------------------------------------
  */

  getPublicServiceBySlug = async (req, res) => {
    const service = await Service.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select("-cardImage.publicId -hero.image.publicId");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Related Projects
    |--------------------------------------------------------------------------
    */

    const relatedProjects = [];

    return res.status(200).json({
      success: true,
      data: {
        service,
        relatedProjects,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get All Services
  |--------------------------------------------------------------------------
  */

  getAllServices = async (req, res) => {
    const services = await Service.find().sort({
      displayOrder: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Service By ID
  |--------------------------------------------------------------------------
  */

  getServiceById = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Create Service
  |--------------------------------------------------------------------------
  */

  createService = async (req, res) => {
    const cardImageFile = req.files.cardImage[0];

    const heroImageFile = req.files.heroImage[0];

    const existingService = await Service.findOne({
      slug: req.body.slug,
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "Service slug already exists.",
      });
    }

    let uploadedImages = null;

    try {
      uploadedImages = await uploadServiceImages(cardImageFile, heroImageFile);

      const service = await Service.create({
        title: req.body.title,

        slug: req.body.slug,

        categoryLabel: req.body.categoryLabel,

        shortDescription: req.body.shortDescription,

        cardImage: {
          url: uploadedImages.cardImage.url,

          publicId: uploadedImages.cardImage.publicId,
        },

        hero: {
          title: req.body.heroTitle,

          description: req.body.heroDescription,

          image: {
            url: uploadedImages.heroImage.url,

            publicId: uploadedImages.heroImage.publicId,
          },
        },

        highlights: req.body.highlights,

        processSection: req.body.processSection,

        capabilitiesSection: req.body.capabilitiesSection,

        displayOrder: req.body.displayOrder,

        isFeatured: req.body.isFeatured,

        isActive: req.body.isActive,
      });

      return res.status(201).json({
        success: true,
        message: "Service created successfully.",
        data: service,
      });
    } catch (error) {
      if (uploadedImages) {
        await deleteServiceImages(
          uploadedImages.cardImage,
          uploadedImages.heroImage,
        );
      }

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Service
  |--------------------------------------------------------------------------
  */

  updateService = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (req.body.slug && req.body.slug !== service.slug) {
      const existingService = await Service.findOne({
        slug: req.body.slug,

        _id: {
          $ne: service._id,
        },
      });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message: "Service slug already exists.",
        });
      }
    }

    await replaceServiceImages(
      service,
      req.files?.cardImage?.[0],
      req.files?.heroImage?.[0],
    );

    Object.assign(service, {
      title: req.body.title ?? service.title,

      slug: req.body.slug ?? service.slug,

      categoryLabel: req.body.categoryLabel ?? service.categoryLabel,

      shortDescription: req.body.shortDescription ?? service.shortDescription,

      highlights: req.body.highlights ?? service.highlights,

      processSection: req.body.processSection ?? service.processSection,

      capabilitiesSection:
        req.body.capabilitiesSection ?? service.capabilitiesSection,

      displayOrder: req.body.displayOrder ?? service.displayOrder,

      isFeatured: req.body.isFeatured ?? service.isFeatured,

      isActive: req.body.isActive ?? service.isActive,
    });

    if (req.body.heroTitle) {
      service.hero.title = req.body.heroTitle;
    }

    if (req.body.heroDescription) {
      service.hero.description = req.body.heroDescription;
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: service,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Service
  |--------------------------------------------------------------------------
  */

  deleteService = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await deleteServiceImages(service.cardImage, service.hero.image);

    await service.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  };
}

module.exports = new ServiceController();
