const Service = require("../models/service.model");
const Project = require("../models/project.model");

const {
  MAX_HOME_CAPABILITIES,
  uploadServiceImages,
  replaceServiceImages,
  deleteServiceImages,
  hasReachedHomeCapabilityLimit,
  updateServiceCard,
  updateHeroSection,
  updateDeliveryProcessSection,
  updateCapabilitiesSection,
  updateHomeCapability,
} = require("../helpers/service.helper");

// ==================== Service Controller ====================

class ServiceController {
  // ==================== Get Public Service Cards ====================

  getPublicServiceCards = async (req, res) => {
    const services = await Service.find({
      isActive: true,
    })
      .select("title slug serviceCard displayOrder")
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

  // ==================== Get Home Capabilities ====================

  getHomeCapabilities = async (req, res) => {
    const services = await Service.find({
      isActive: true,
      "homeCapability.isVisible": true,
    })
      .select("title slug homeCapability")
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

  // ==================== Get Public Service By Slug ====================

  getPublicServiceBySlug = async (req, res) => {
    const service = await Service.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .select("-serviceCard.image.publicId -heroSection.image.publicId")
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const relatedProjects = await Project.find({
      services: service._id,
      isActive: true,
    })
      .select("title slug shortDescription cardImage displayOrder")
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

  // ==================== Get All Services ====================

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

  // ==================== Get Service By ID ====================

  getServiceById = async (req, res) => {
    const service = await Service.findById(req.params.id).lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  };

  // ==================== Create Service ====================

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

    const normalizedSlug = slug.toLowerCase().trim();

    const existingService = await Service.findOne({
      slug: normalizedSlug,
    }).lean();

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists",
      });
    }

    const serviceIsActive = isActive !== undefined ? isActive : true;

    const homeCapabilityData = {
      isVisible: homeCapability?.isVisible ?? false,

      title: homeCapability?.title ?? "",

      shortDescription: homeCapability?.shortDescription ?? "",

      displayOrder: homeCapability?.displayOrder ?? 0,
    };

    const homeLimitReached = await hasReachedHomeCapabilityLimit({
      isVisible: homeCapabilityData.isVisible,

      isActive: serviceIsActive,
    });

    if (homeLimitReached) {
      return res.status(400).json({
        success: false,
        message:
          "Only 6 services can be displayed in the Home Capabilities section",
      });
    }

    const cardImageFile = req.files?.cardImage?.[0];

    const heroImageFile = req.files?.heroImage?.[0];

    const uploadedImages = await uploadServiceImages({
      cardImageFile,
      heroImageFile,

      cardImageAlt: serviceCard.imageAlt || title,

      heroImageAlt: heroSection.imageAlt || title,
    });

    try {
      const serviceData = {
        title,
        slug: normalizedSlug,

        serviceCard: {
          label: serviceCard.label,

          description: serviceCard.description,

          highlights: serviceCard.highlights,

          image: uploadedImages.cardImage,
        },

        heroSection: {
          title: heroSection.title,

          description: heroSection.description,

          image: uploadedImages.heroImage,
        },

        deliveryProcessSection,

        capabilitiesSection,

        homeCapability: homeCapabilityData,

        displayOrder: displayOrder ?? 0,

        isActive: serviceIsActive,
      };

      const service = await Service.create(serviceData);

      return res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error) {
      await deleteServiceImages({
        serviceCard: {
          image: uploadedImages.cardImage,
        },

        heroSection: {
          image: uploadedImages.heroImage,
        },
      });

      throw error;
    }
  };

  // ==================== Update Service ====================

  updateService = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
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

    let normalizedSlug;

    if (slug !== undefined) {
      normalizedSlug = slug.toLowerCase().trim();

      if (normalizedSlug !== service.slug) {
        const existingService = await Service.findOne({
          slug: normalizedSlug,

          _id: {
            $ne: service._id,
          },
        }).lean();

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: "A service with this slug already exists",
          });
        }
      }
    }

    const finalHomeVisibility =
      homeCapability?.isVisible ?? service.homeCapability.isVisible;

    const finalActiveStatus = isActive ?? service.isActive;

    const homeLimitReached = await hasReachedHomeCapabilityLimit({
      isVisible: finalHomeVisibility,

      isActive: finalActiveStatus,

      excludedServiceId: service._id,
    });

    if (homeLimitReached) {
      return res.status(400).json({
        success: false,
        message:
          "Only 6 services can be displayed in the Home Capabilities section",
      });
    }

    await replaceServiceImages({
      service,

      cardImageFile: req.files?.cardImage?.[0],

      heroImageFile: req.files?.heroImage?.[0],

      cardImageAlt: serviceCard?.imageAlt,

      heroImageAlt: heroSection?.imageAlt,
    });

    if (title !== undefined) {
      service.title = title;
    }

    if (normalizedSlug !== undefined) {
      service.slug = normalizedSlug;
    }

    updateServiceCard(service, serviceCard);

    updateHeroSection(service, heroSection);

    updateDeliveryProcessSection(service, deliveryProcessSection);

    updateCapabilitiesSection(service, capabilitiesSection);

    updateHomeCapability(service, homeCapability);

    if (displayOrder !== undefined) {
      service.displayOrder = displayOrder;
    }

    if (isActive !== undefined) {
      service.isActive = isActive;
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  };

  // ==================== Delete Service ====================

  deleteService = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const relatedProjectsCount = await Project.countDocuments({
      services: service._id,
    });

    await deleteServiceImages(service);

    await service.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  };
}

module.exports = new ServiceController();
