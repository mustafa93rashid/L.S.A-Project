const Equipment = require("../models/equipment.model");
const EquipmentCategory = require("../models/equipmentCategory.model");

const {
  uploadMulterImage,
  deleteImage,
} = require("../services/cloudinary.service");

// ==================== Constants ====================

const EQUIPMENT_IMAGE_FOLDER = "equipment/images";

// ==================== Escape Regex ====================

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================== Get Current User ID ====================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id;
};

// ==================== Normalize Slug ====================

const normalizeSlug = (slug) => {
  return slug.toLowerCase().trim();
};

// ==================== Format Equipment Image ====================

const formatEquipmentImage = (uploadedImage, alt = "") => {
  return {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
    alt: String(alt || "").trim(),
  };
};

// ==================== Upload Equipment Image ====================

const uploadEquipmentImage = async ({ file, alt = "" }) => {
  const uploadedImage = await uploadMulterImage({
    file,
    folder: EQUIPMENT_IMAGE_FOLDER,
    prefix: "equipment",
  });

  return formatEquipmentImage(uploadedImage, alt);
};

// ==================== Delete Equipment Image Safely ====================

const deleteEquipmentImageSafely = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error("Failed to delete equipment image from Cloudinary:", {
      publicId,
      message: error.message,
      code: error.code,
    });
  }
};

// ==================== Replace Equipment Image ====================

const replaceEquipmentImage = async ({
  equipment,
  file,
  imageAlt,
  fallbackAlt,
}) => {
  if (!file) {
    if (imageAlt !== undefined) {
      equipment.image.alt = imageAlt;
    }

    return null;
  }

  const oldPublicId = equipment.image?.publicId;

  const uploadedImage = await uploadEquipmentImage({
    file,

    alt: imageAlt ?? equipment.image?.alt ?? fallbackAlt ?? equipment.title,
  });

  equipment.image = uploadedImage;

  return {
    oldPublicId,
    newPublicId: uploadedImage.publicId,
  };
};

// ==================== Find Active Category ====================

const findActiveCategory = async (categoryId) => {
  return EquipmentCategory.findOne({
    _id: categoryId,
    isActive: true,
  })
    .select("_id")
    .lean();
};

// ==================== Equipment Slug Exists ====================

const equipmentSlugExists = async ({ slug, excludedEquipmentId = null }) => {
  const filter = {
    slug: normalizeSlug(slug),
  };

  if (excludedEquipmentId) {
    filter._id = {
      $ne: excludedEquipmentId,
    };
  }

  return Equipment.exists(filter);
};

// ==================== Category Duplicate Exists ====================

const categoryDuplicateExists = async ({
  name,
  slug,
  excludedCategoryId = null,
}) => {
  const duplicateConditions = [];

  if (name !== undefined) {
    duplicateConditions.push({
      name: {
        $regex: `^${escapeRegex(name)}$`,
        $options: "i",
      },
    });
  }

  if (slug !== undefined) {
    duplicateConditions.push({
      slug: normalizeSlug(slug),
    });
  }

  if (duplicateConditions.length === 0) {
    return false;
  }

  const filter = {
    $or: duplicateConditions,
  };

  if (excludedCategoryId) {
    filter._id = {
      $ne: excludedCategoryId,
    };
  }

  return EquipmentCategory.exists(filter);
};

// ==================== Update Equipment Fields ====================

const updateEquipmentFields = (equipment, data) => {
  const simpleFields = [
    "title",
    "category",
    "shortDescription",
    "description",
    "location",
    "availableUnits",
    "displayOrder",
    "isActive",
  ];

  simpleFields.forEach((field) => {
    if (data[field] !== undefined) {
      equipment[field] = data[field];
    }
  });

  if (data.slug !== undefined) {
    equipment.slug = normalizeSlug(data.slug);
  }

  if (data.primarySpecification !== undefined) {
    if (data.primarySpecification.label !== undefined) {
      equipment.primarySpecification.label = data.primarySpecification.label;
    }

    if (data.primarySpecification.value !== undefined) {
      equipment.primarySpecification.value = data.primarySpecification.value;
    }
  }

  if (data.safetyCertificate !== undefined) {
    if (data.safetyCertificate.isAvailable !== undefined) {
      equipment.safetyCertificate.isAvailable =
        data.safetyCertificate.isAvailable;
    }

    if (data.safetyCertificate.message !== undefined) {
      equipment.safetyCertificate.message = data.safetyCertificate.message;
    }
  }
};

// ==================== Update Category Fields ====================

const updateCategoryFields = (category, data) => {
  if (data.name !== undefined) {
    category.name = data.name;
  }

  if (data.slug !== undefined) {
    category.slug = normalizeSlug(data.slug);
  }

  if (data.displayOrder !== undefined) {
    category.displayOrder = data.displayOrder;
  }

  if (data.isActive !== undefined) {
    category.isActive = data.isActive;
  }
};

// ==================== Export Helpers ====================

module.exports = {
  EQUIPMENT_IMAGE_FOLDER,

  escapeRegex,
  getCurrentUserId,
  normalizeSlug,

  uploadEquipmentImage,
  replaceEquipmentImage,
  deleteEquipmentImageSafely,

  findActiveCategory,
  equipmentSlugExists,
  categoryDuplicateExists,

  updateEquipmentFields,
  updateCategoryFields,
};
