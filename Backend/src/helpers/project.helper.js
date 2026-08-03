const Service = require("../models/service.model");

const {
  uploadMulterImage,
  replaceImage,
  deleteImage,
  deleteImages,
} = require("../services/cloudinary.service");

// ==================== Normalize Slug ====================

const normalizeSlug = (slug) => {
  return slug.toLowerCase().trim();
};

// ==================== Format Image ====================

const formatImage = (uploadedImage, { alt = "", displayOrder } = {}) => {
  const image = {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
    alt,
  };

  if (displayOrder !== undefined) {
    image.displayOrder = displayOrder;
  }

  return image;
};

// ==================== Validate Related Services ====================

const selectedServicesExist = async (serviceIds = []) => {
  if (serviceIds.length === 0) {
    return true;
  }

  const uniqueServiceIds = [...new Set(serviceIds.map((id) => id.toString()))];

  const existingServicesCount = await Service.countDocuments({
    _id: {
      $in: uniqueServiceIds,
    },
  });

  return existingServicesCount === uniqueServiceIds.length;
};

// ==================== Upload Project Main Images ====================

const uploadProjectMainImages = async ({
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
      folder: "projects/cards",
      prefix: "project-card",
    });

    uploadedImages.heroImage = await uploadMulterImage({
      file: heroImageFile,
      folder: "projects/hero",
      prefix: "project-hero",
    });

    return {
      cardImage: formatImage(uploadedImages.cardImage, {
        alt: cardImageAlt,
      }),

      heroImage: formatImage(uploadedImages.heroImage, {
        alt: heroImageAlt,
      }),
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

// ==================== Upload Project Gallery ====================

const uploadProjectGallery = async ({
  files = [],
  altValues = [],
  startingOrder = 0,
}) => {
  const uploadedGallery = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const uploadedImage = await uploadMulterImage({
        file: files[index],
        folder: "projects/gallery",
        prefix: "project-gallery",
      });

      uploadedGallery.push(
        formatImage(uploadedImage, {
          alt: altValues[index] || "",
          displayOrder: startingOrder + index,
        }),
      );
    }

    return uploadedGallery;
  } catch (error) {
    await deleteImages(uploadedGallery.map((image) => image.publicId));

    throw error;
  }
};

// ==================== Upload Project Certificates ====================

const uploadProjectCertificates = async ({
  files = [],
  altValues = [],
  startingOrder = 0,
}) => {
  const uploadedCertificates = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const uploadedImage = await uploadMulterImage({
        file: files[index],
        folder: "projects/certificates",
        prefix: "project-certificate",
      });

      uploadedCertificates.push(
        formatImage(uploadedImage, {
          alt: altValues[index] || "",
          displayOrder: startingOrder + index,
        }),
      );
    }

    return uploadedCertificates;
  } catch (error) {
    await deleteImages(uploadedCertificates.map((image) => image.publicId));

    throw error;
  }
};

// ==================== Replace Project Main Images ====================

const replaceProjectMainImages = async ({
  project,
  cardImageFile,
  heroImageFile,
  cardImageAlt,
  heroImageAlt,
}) => {
  if (cardImageFile) {
    const uploadedCardImage = await replaceImage({
      oldPublicId: project.cardImage?.publicId,

      file: cardImageFile,
      folder: "projects/cards",
      prefix: "project-card",
    });

    project.cardImage = formatImage(uploadedCardImage, {
      alt: cardImageAlt ?? project.cardImage?.alt ?? project.title,
    });
  } else if (cardImageAlt !== undefined) {
    project.cardImage.alt = cardImageAlt;
  }

  if (heroImageFile) {
    const uploadedHeroImage = await replaceImage({
      oldPublicId: project.hero?.image?.publicId,

      file: heroImageFile,
      folder: "projects/heroes",
      prefix: "project-hero",
    });

    project.hero.image = formatImage(uploadedHeroImage, {
      alt: heroImageAlt ?? project.hero.image?.alt ?? project.title,
    });
  } else if (heroImageAlt !== undefined) {
    project.hero.image.alt = heroImageAlt;
  }
};

// ==================== Remove Images By Public ID ====================

const removeImagesByPublicIds = async ({
  currentImages = [],
  publicIds = [],
}) => {
  if (publicIds.length === 0) {
    return currentImages;
  }

  const publicIdSet = new Set(publicIds);

  const imagesToDelete = currentImages.filter((image) =>
    publicIdSet.has(image.publicId),
  );

  await deleteImages(imagesToDelete.map((image) => image.publicId));

  return currentImages.filter((image) => !publicIdSet.has(image.publicId));
};

// ==================== Delete Project Images ====================

const deleteProjectImages = async (project) => {
  const publicIds = [
    project.cardImage?.publicId,
    project.hero?.image?.publicId,

    ...(project.gallery || []).map((image) => image.publicId),

    ...(project.certificates || []).map((image) => image.publicId),
  ].filter(Boolean);

  await deleteImages(publicIds);
};

// ==================== Update Hero Section ====================

const updateProjectHero = (project, { heroTitle, heroDescription }) => {
  if (heroTitle !== undefined) {
    project.hero.title = heroTitle;
  }

  if (heroDescription !== undefined) {
    project.hero.description = heroDescription;
  }
};

// ==================== Update Project Details ====================

const updateProjectDetails = (project, projectDetails) => {
  if (!projectDetails) {
    return;
  }

  const fields = ["client", "location", "completionDate", "duration", "status"];

  fields.forEach((field) => {
    if (projectDetails[field] !== undefined) {
      project.projectDetails[field] = projectDetails[field];
    }
  });
};

// ==================== Update Detailed Scope ====================

const updateDetailedScope = (project, detailedScope) => {
  if (!detailedScope) {
    return;
  }

  if (detailedScope.title !== undefined) {
    project.detailedScope.title = detailedScope.title;
  }

  if (detailedScope.description !== undefined) {
    project.detailedScope.description = detailedScope.description;
  }

  if (detailedScope.items !== undefined) {
    project.detailedScope.items = detailedScope.items;
  }
};

// ==================== Export Helpers ====================

module.exports = {
  normalizeSlug,
  selectedServicesExist,

  uploadProjectMainImages,
  uploadProjectGallery,
  uploadProjectCertificates,

  replaceProjectMainImages,
  removeImagesByPublicIds,
  deleteProjectImages,

  updateProjectHero,
  updateProjectDetails,
  updateDetailedScope,
};
