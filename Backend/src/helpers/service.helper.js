const Service = require("../models/service.model");

const {
  uploadMulterImage,
  replaceImage,
  deleteImages,
} = require("../services/cloudinary.service");

// ==================== Constants ====================

const MAX_HOME_CAPABILITIES = 6;

// ==================== Format Image ====================

const formatImage = (uploadedImage, alt = "") => {
  return {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
    alt,
  };
};

// ==================== Upload Service Images ====================

const uploadServiceImages = async ({
  cardImageFile,
  heroImageFile,
  cardImageAlt = "",
  heroImageAlt = "",
}) => {
  const uploadedImages = {
    cardImage: null,
    heroImage: null,
  };

  try {
    uploadedImages.cardImage = await uploadMulterImage({
      file: cardImageFile,
      folder: "services/cards",
      prefix: "service-card",
    });

    uploadedImages.heroImage = await uploadMulterImage({
      file: heroImageFile,
      folder: "services/heroes",
      prefix: "service-hero",
    });

    return {
      cardImage: formatImage(uploadedImages.cardImage, cardImageAlt),

      heroImage: formatImage(uploadedImages.heroImage, heroImageAlt),
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

// ==================== Replace Service Images ====================

const replaceServiceImages = async ({
  service,
  cardImageFile,
  heroImageFile,
  cardImageAlt,
  heroImageAlt,
}) => {
  if (cardImageFile) {
    const uploadedCardImage = await replaceImage({
      oldPublicId: service.serviceCard.image.publicId,

      file: cardImageFile,
      folder: "services/cards",
      prefix: "service-card",
    });

    service.serviceCard.image = formatImage(
      uploadedCardImage,
      cardImageAlt ?? service.serviceCard.image.alt ?? service.title,
    );
  }

  if (heroImageFile) {
    const uploadedHeroImage = await replaceImage({
      oldPublicId: service.heroSection.image.publicId,

      file: heroImageFile,
      folder: "services/heroes",
      prefix: "service-hero",
    });

    service.heroSection.image = formatImage(
      uploadedHeroImage,
      heroImageAlt ?? service.heroSection.image.alt ?? service.title,
    );
  }
};

// ==================== Delete Service Images ====================

const deleteServiceImages = async (service) => {
  const publicIds = [
    service.serviceCard?.image?.publicId,
    service.heroSection?.image?.publicId,
  ].filter(Boolean);

  if (!publicIds.length) {
    return;
  }

  await deleteImages(publicIds);
};

// ==================== Check Home Capability Limit ====================

const hasReachedHomeCapabilityLimit = async ({
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

  const visibleServicesCount = await Service.countDocuments(filter);

  return visibleServicesCount >= MAX_HOME_CAPABILITIES;
};

// ==================== Update Service Card ====================

const updateServiceCard = (service, serviceCard) => {
  if (!serviceCard) {
    return;
  }

  if (serviceCard.label !== undefined) {
    service.serviceCard.label = serviceCard.label;
  }

  if (serviceCard.description !== undefined) {
    service.serviceCard.description = serviceCard.description;
  }

  if (serviceCard.highlights !== undefined) {
    service.serviceCard.highlights = serviceCard.highlights;
  }

  if (serviceCard.imageAlt !== undefined) {
    service.serviceCard.image.alt = serviceCard.imageAlt;
  }
};

// ==================== Update Hero Section ====================

const updateHeroSection = (service, heroSection) => {
  if (!heroSection) {
    return;
  }

  if (heroSection.title !== undefined) {
    service.heroSection.title = heroSection.title;
  }

  if (heroSection.description !== undefined) {
    service.heroSection.description = heroSection.description;
  }

  if (heroSection.imageAlt !== undefined) {
    service.heroSection.image.alt = heroSection.imageAlt;
  }
};

// ==================== Update Delivery Process Section ====================

const updateDeliveryProcessSection = (service, deliveryProcessSection) => {
  if (!deliveryProcessSection) {
    return;
  }

  if (deliveryProcessSection.title !== undefined) {
    service.deliveryProcessSection.title = deliveryProcessSection.title;
  }

  if (deliveryProcessSection.description !== undefined) {
    service.deliveryProcessSection.description =
      deliveryProcessSection.description;
  }

  if (deliveryProcessSection.steps !== undefined) {
    service.deliveryProcessSection.steps = deliveryProcessSection.steps;
  }
};

// ==================== Update Capabilities Section ====================

const updateCapabilitiesSection = (service, capabilitiesSection) => {
  if (!capabilitiesSection) {
    return;
  }

  if (capabilitiesSection.title !== undefined) {
    service.capabilitiesSection.title = capabilitiesSection.title;
  }

  if (capabilitiesSection.description !== undefined) {
    service.capabilitiesSection.description = capabilitiesSection.description;
  }

  if (capabilitiesSection.items !== undefined) {
    service.capabilitiesSection.items = capabilitiesSection.items;
  }

  if (capabilitiesSection.table !== undefined) {
    if (capabilitiesSection.table.headers !== undefined) {
      service.capabilitiesSection.table.headers =
        capabilitiesSection.table.headers;
    }

    if (capabilitiesSection.table.rows !== undefined) {
      service.capabilitiesSection.table.rows = capabilitiesSection.table.rows;
    }
  }
};

// ==================== Update Home Capability ====================

const updateHomeCapability = (service, homeCapability) => {
  if (!homeCapability) {
    return;
  }

  if (homeCapability.isVisible !== undefined) {
    service.homeCapability.isVisible = homeCapability.isVisible;
  }

  if (homeCapability.title !== undefined) {
    service.homeCapability.title = homeCapability.title;
  }

  if (homeCapability.shortDescription !== undefined) {
    service.homeCapability.shortDescription = homeCapability.shortDescription;
  }

  if (homeCapability.displayOrder !== undefined) {
    service.homeCapability.displayOrder = homeCapability.displayOrder;
  }
};

// ==================== Exports ====================

module.exports = {
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
};
