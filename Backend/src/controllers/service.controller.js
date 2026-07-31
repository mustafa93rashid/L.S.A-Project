const Service = require("../models/service.model");
const Project = require("../models/project.model");

const {
  uploadMulterImage,
  replaceImage,
  deleteImages,
} = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_HOME_CAPABILITIES = 6;

/*
|--------------------------------------------------------------------------
| Image Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Format Uploaded Image
// ==================================================
const formatImage = (uploadedImage, alt = "") => {
  return {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
    alt,
  };
};

// ==================================================
// Upload Service Images
// ==================================================
const uploadServiceImages = async ({
  cardImageFile,
  heroImageFile,
  cardImageAlt,
  heroImageAlt,
}) => {
  const uploadedImages = {
    cardImage: null,
    heroImage: null,
  };

  try {
    uploadedImages.cardImage =
      await uploadMulterImage({
        file: cardImageFile,
        folder: "services/cards",
        prefix: "service-card",
      });

    uploadedImages.heroImage =
      await uploadMulterImage({
        file: heroImageFile,
        folder: "services/heroes",
        prefix: "service-hero",
      });

    return {
      cardImage: formatImage(
        uploadedImages.cardImage,
        cardImageAlt,
      ),

      heroImage: formatImage(
        uploadedImages.heroImage,
        heroImageAlt,
      ),
    };
  } catch (error) {
    await deleteImages(
      [
        uploadedImages.cardImage?.publicId,
        uploadedImages.heroImage?.publicId,
      ].filter(Boolean),
    );

    throw error;
  }
};

// ==================================================
// Replace Service Images
// ==================================================
const replaceServiceImages = async ({
  service,
  cardImageFile,
  heroImageFile,
}) => {
  if (cardImageFile) {
    const uploadedCardImage =
      await replaceImage({
        oldPublicId:
          service.serviceCard.image.publicId,

        file: cardImageFile,
        folder: "services/cards",
        prefix: "service-card",
      });

    service.serviceCard.image = formatImage(
      uploadedCardImage,
      service.serviceCard.image.alt ||
        service.title,
    );
  }

  if (heroImageFile) {
    const uploadedHeroImage =
      await replaceImage({
        oldPublicId:
          service.heroSection.image.publicId,

        file: heroImageFile,
        folder: "services/heroes",
        prefix: "service-hero",
      });

    service.heroSection.image = formatImage(
      uploadedHeroImage,
      service.heroSection.image.alt ||
        service.title,
    );
  }
};

// ==================================================
// Delete Service Images
// ==================================================
const deleteServiceImages = async (service) => {
  const publicIds = [
    service.serviceCard?.image?.publicId,
    service.heroSection?.image?.publicId,
  ].filter(Boolean);

  await deleteImages(publicIds);
};

/*
|--------------------------------------------------------------------------
| Business Logic Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Check Home Capability Limit
// ==================================================
const hasReachedHomeCapabilityLimit =
  async ({
    isVisible,
    isActive,
    excludedServiceId = null,
  }) => {
    if (!isVisible || !isActive) {
      return false;
    }

    const filter = {
      isActive: true,
      "homeCapability.isVisible": true,
    };

    if (excludedServiceId) {
      filter._id = {
        $ne: excludedServiceId,
      };
    }

    const visibleServicesCount =
      await Service.countDocuments(filter);

    return (
      visibleServicesCount >=
      MAX_HOME_CAPABILITIES
    );
  };

/*
|--------------------------------------------------------------------------
| Service Controller
|--------------------------------------------------------------------------
*/

class ServiceController {
  /*
  |--------------------------------------------------------------------------
  | Get Public Service Cards
  |--------------------------------------------------------------------------
  |
  | يعيد الكاردات التي تظهر في صفحة الخدمات.
  |
  */

  getPublicServiceCards = async (
    req,
    res,
  ) => {
    const services = await Service.find({
      isActive: true,
    })
      .select(
        "title slug serviceCard displayOrder",
      )
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Home Capabilities
  |--------------------------------------------------------------------------
  |
  | يعيد ست خدمات كحد أقصى لقسم Our Core Capabilities.
  |
  */

  getHomeCapabilities = async (
    req,
    res,
  ) => {
    const services = await Service.find({
      isActive: true,
      "homeCapability.isVisible": true,
    })
      .select(
        "title slug homeCapability",
      )
      .sort({
        "homeCapability.displayOrder": 1,
        createdAt: 1,
      })
      .limit(MAX_HOME_CAPABILITIES)
      .lean();

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Public Service Details
  |--------------------------------------------------------------------------
  |
  | يعيد تفاصيل الخدمة والمشاريع المرتبطة بها.
  |
  */

  getPublicServiceBySlug = async (
    req,
    res,
  ) => {
    const service = await Service.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .select(
        "-serviceCard.image.publicId -heroSection.image.publicId",
      )
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const relatedProjects =
      await Project.find({
        services: service._id,
        isActive: true,
      })
        .select(
          "title slug shortDescription cardImage displayOrder",
        )
        .sort({
          displayOrder: 1,
          createdAt: -1,
        })
        .lean();

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
  |
  | يعيد جميع الخدمات للوحة التحكم.
  |
  */

  getAllServices = async (req, res) => {
    const services = await Service.find()
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

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
    const service = await Service.findById(
      req.params.id,
    ).lean();

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
    const {
      title,
      slug,
      serviceCard,
      heroSection,
      deliveryProcessSection,
      capabilitiesSection,
      homeCapability,
      displayOrder,
      isActive,
    } = req.body;

    const existingService =
      await Service.findOne({
        slug,
      }).lean();

    if (existingService) {
      return res.status(409).json({
        success: false,
        message:
          "A service with this slug already exists.",
      });
    }

    const serviceIsActive =
      isActive !== undefined
        ? isActive
        : true;

    const homeLimitReached =
      await hasReachedHomeCapabilityLimit({
        isVisible:
          homeCapability.isVisible,

        isActive: serviceIsActive,
      });

    if (homeLimitReached) {
      return res.status(400).json({
        success: false,
        message:
          "Only 6 services can be displayed in the Home Capabilities section.",
      });
    }

    const cardImageFile =
      req.files?.cardImage?.[0];

    const heroImageFile =
      req.files?.heroImage?.[0];

    const uploadedImages =
      await uploadServiceImages({
        cardImageFile,
        heroImageFile,

        cardImageAlt:
          serviceCard.imageAlt || title,

        heroImageAlt:
          heroSection.imageAlt || title,
      });

    try {
      const service = await Service.create({
        title,
        slug,

        serviceCard: {
          label: serviceCard.label,

          description:
            serviceCard.description,

          highlights:
            serviceCard.highlights,

          image: uploadedImages.cardImage,
        },

        heroSection: {
          title: heroSection.title,

          description:
            heroSection.description,

          image: uploadedImages.heroImage,
        },

        deliveryProcessSection,

        capabilitiesSection,

        homeCapability,

        displayOrder,

        isActive: serviceIsActive,
      });

      return res.status(201).json({
        success: true,
        message:
          "Service created successfully.",
        data: service,
      });
    } catch (error) {
      await deleteImages([
        uploadedImages.cardImage.publicId,
        uploadedImages.heroImage.publicId,
      ]);

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Service
  |--------------------------------------------------------------------------
  */

  updateService = async (req, res) => {
    const service = await Service.findById(
      req.params.id,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const {
      title,
      slug,
      serviceCard,
      heroSection,
      deliveryProcessSection,
      capabilitiesSection,
      homeCapability,
      displayOrder,
      isActive,
    } = req.body;

    if (
      slug !== undefined &&
      slug !== service.slug
    ) {
      const existingService =
        await Service.findOne({
          slug,

          _id: {
            $ne: service._id,
          },
        }).lean();

      if (existingService) {
        return res.status(409).json({
          success: false,
          message:
            "A service with this slug already exists.",
        });
      }
    }

    const finalHomeVisibility =
      homeCapability?.isVisible ??
      service.homeCapability.isVisible;

    const finalActiveStatus =
      isActive ?? service.isActive;

    const homeLimitReached =
      await hasReachedHomeCapabilityLimit({
        isVisible: finalHomeVisibility,
        isActive: finalActiveStatus,

        excludedServiceId:
          service._id,
      });

    if (homeLimitReached) {
      return res.status(400).json({
        success: false,
        message:
          "Only 6 services can be displayed in the Home Capabilities section.",
      });
    }

    await replaceServiceImages({
      service,

      cardImageFile:
        req.files?.cardImage?.[0],

      heroImageFile:
        req.files?.heroImage?.[0],
    });

    if (title !== undefined) {
      service.title = title;
    }

    if (slug !== undefined) {
      service.slug = slug;
    }

    if (serviceCard !== undefined) {
      service.serviceCard.label =
        serviceCard.label;

      service.serviceCard.description =
        serviceCard.description;

      service.serviceCard.highlights =
        serviceCard.highlights;

      if (
        serviceCard.imageAlt !== undefined
      ) {
        service.serviceCard.image.alt =
          serviceCard.imageAlt;
      }
    }

    if (heroSection !== undefined) {
      service.heroSection.title =
        heroSection.title;

      service.heroSection.description =
        heroSection.description;

      if (
        heroSection.imageAlt !== undefined
      ) {
        service.heroSection.image.alt =
          heroSection.imageAlt;
      }
    }

    if (
      deliveryProcessSection !== undefined
    ) {
      service.deliveryProcessSection =
        deliveryProcessSection;
    }

    if (
      capabilitiesSection !== undefined
    ) {
      service.capabilitiesSection =
        capabilitiesSection;
    }

    if (homeCapability !== undefined) {
      service.homeCapability =
        homeCapability;
    }

    if (displayOrder !== undefined) {
      service.displayOrder =
        displayOrder;
    }

    if (isActive !== undefined) {
      service.isActive = isActive;
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message:
        "Service updated successfully.",
      data: service,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Service
  |--------------------------------------------------------------------------
  */

  deleteService = async (req, res) => {
    const service = await Service.findById(
      req.params.id,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const relatedProjectsCount =
      await Project.countDocuments({
        services: service._id,
      });

    if (relatedProjectsCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This service cannot be deleted because it is assigned to one or more projects.",
      });
    }

    await deleteServiceImages(service);

    await service.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Service deleted successfully.",
    });
  };
}

module.exports = new ServiceController();