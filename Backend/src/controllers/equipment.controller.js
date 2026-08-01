const EquipmentCategory = require("../models/equipmentCategory.model");
const Equipment = require("../models/equipment.model");
const { EquipmentRequest } = require("../models/equipmentRequest.model");

const { uploadMulterImage, deleteImage } = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EQUIPMENT_IMAGE_FOLDER = "equipment/images";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Escape Regular Expression
// ==================================================

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================================================
// Get Current User ID
// ==================================================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id;
};

// ==================================================
// Format Equipment Image
// ==================================================

const formatEquipmentImage = (uploadedImage, alt = "") => {
  return {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
    alt: String(alt || "").trim(),
  };
};

// ==================================================
// Upload Equipment Image
// ==================================================

const uploadEquipmentImage = async (file, alt = "") => {
  const uploadedImage = await uploadMulterImage({
    file,
    folder: EQUIPMENT_IMAGE_FOLDER,
    prefix: "equipment",
  });

  return formatEquipmentImage(uploadedImage, alt);
};

// ==================================================
// Delete Equipment Image Safely
// ==================================================

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

/*
|--------------------------------------------------------------------------
| Equipment Controller
|--------------------------------------------------------------------------
*/

class EquipmentController {
  /*
  |--------------------------------------------------------------------------
  | Public Categories
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get Public Categories
  // ==================================================

  getPublicCategories = async (req, res) => {
    const categories = await EquipmentCategory.find({
      isActive: true,
    })
      .select("name slug displayOrder")
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Dashboard Categories
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get Category Options
  // ==================================================

  getCategoryOptions = async (req, res) => {
    const categories = await EquipmentCategory.find({
      isActive: true,
    })
      .select("name slug")
      .sort({
        displayOrder: 1,
        name: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  };

  // ==================================================
  // Get All Categories
  // ==================================================

  getAllCategories = async (req, res) => {
    const categories = await EquipmentCategory.find()
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  };

  // ==================================================
  // Get Category By ID
  // ==================================================

getCategoryById = async (req, res) => {
  const category = await EquipmentCategory.findById(req.params.id)
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email")
    .lean();

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Equipment category not found.",
    });
  }

  const equipment = await Equipment.find({
    category: category._id,
  })
    .select(
      "title slug shortDescription image primarySpecification location availableUnits safetyCertificate displayOrder isActive",
    )
    .sort({
      displayOrder: 1,
      createdAt: -1,
    })
    .lean();

  return res.status(200).json({
    success: true,
    data: {
      category,
      equipment,
    },
  });
};

  // ==================================================
  // Create Category
  // ==================================================

  createCategory = async (req, res) => {
    const { name, slug, displayOrder, isActive } = req.body;

    const existingCategory = await EquipmentCategory.findOne({
      $or: [
        {
          slug,
        },
        {
          name: {
            $regex: `^${escapeRegex(name)}$`,
            $options: "i",
          },
        },
      ],
    }).lean();

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "An equipment category with this name or slug already exists.",
      });
    }

    const currentUserId = getCurrentUserId(req);

    const category = await EquipmentCategory.create({
      name,
      slug,
      displayOrder,
      isActive,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    return res.status(201).json({
      success: true,
      message: "Equipment category created successfully.",
      data: category,
    });
  };

  // ==================================================
  // Update Category
  // ==================================================

  updateCategory = async (req, res) => {
    const category = await EquipmentCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Equipment category not found.",
      });
    }

    const { name, slug, displayOrder, isActive } = req.body;

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
        slug,
      });
    }

    if (duplicateConditions.length > 0) {
      const existingCategory = await EquipmentCategory.findOne({
        _id: {
          $ne: category._id,
        },
        $or: duplicateConditions,
      }).lean();

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "An equipment category with this name or slug already exists.",
        });
      }
    }

    if (name !== undefined) {
      category.name = name;
    }

    if (slug !== undefined) {
      category.slug = slug;
    }

    if (displayOrder !== undefined) {
      category.displayOrder = displayOrder;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    category.updatedBy = getCurrentUserId(req);

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Equipment category updated successfully.",
      data: category,
    });
  };

  // ==================================================
  // Delete Category
  // ==================================================

  deleteCategory = async (req, res) => {
    const category = await EquipmentCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Equipment category not found.",
      });
    }

    const equipmentCount = await Equipment.countDocuments({
      category: category._id,
    });

    if (equipmentCount > 0) {
      return res.status(409).json({
        success: false,
        message: "This category cannot be deleted because it contains equipment.",
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Equipment category deleted successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Public Equipment
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get Public Equipment
  // ==================================================

  getPublicEquipment = async (req, res) => {
    const filter = {
      isActive: true,
    };

    if (req.query.category) {
      const category = await EquipmentCategory.findOne({
        slug: req.query.category,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!category) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      filter.category = category._id;
    }

    if (req.query.search) {
      const searchTerm = escapeRegex(req.query.search);

      filter.$or = [
        {
          title: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          location: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          "primarySpecification.label": {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          "primarySpecification.value": {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    const equipment = await Equipment.find(filter)
      .populate({
        path: "category",
        select: "name slug displayOrder",
        match: {
          isActive: true,
        },
      })
      .select(
        "title slug category shortDescription image.url image.alt primarySpecification location availableUnits safetyCertificate displayOrder",
      )
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

    const visibleEquipment = equipment.filter((item) => item.category);

    return res.status(200).json({
      success: true,
      count: visibleEquipment.length,
      data: visibleEquipment,
    });
  };

  // ==================================================
  // Get Public Equipment By Slug
  // ==================================================

  getPublicEquipmentBySlug = async (req, res) => {
    const equipment = await Equipment.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate({
        path: "category",
        select: "name slug",
        match: {
          isActive: true,
        },
      })
      .select("-image.publicId -createdBy -updatedBy")
      .lean();

    if (!equipment || !equipment.category) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Dashboard Equipment
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get All Equipment
  // ==================================================

  getAllEquipment = async (req, res) => {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive;
    }

    if (req.query.search) {
      const searchTerm = escapeRegex(req.query.search);

      filter.$or = [
        {
          title: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          location: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    const equipment = await Equipment.find(filter)
      .populate("category", "name slug isActive")
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  };

  // ==================================================
  // Get Equipment By ID
  // ==================================================

  getEquipmentById = async (req, res) => {
    const equipment = await Equipment.findById(req.params.id)
      .populate("category", "name slug isActive")
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .lean();

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  };

  // ==================================================
  // Create Equipment
  // ==================================================

  createEquipment = async (req, res) => {
    const {
      title,
      slug,
      category,
      shortDescription,
      description,
      primarySpecification,
      location,
      availableUnits,
      safetyCertificate,
      displayOrder,
      isActive,
      imageAlt,
    } = req.body;

    const existingEquipment = await Equipment.findOne({
      slug,
    }).lean();

    if (existingEquipment) {
      return res.status(409).json({
        success: false,
        message: "Equipment with this slug already exists.",
      });
    }

    const existingCategory = await EquipmentCategory.findOne({
      _id: category,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Active equipment category not found.",
      });
    }

    let uploadedImage = null;

    try {
      uploadedImage = await uploadEquipmentImage(req.file, imageAlt || title);

      const currentUserId = getCurrentUserId(req);

      const equipment = await Equipment.create({
        title,
        slug,
        category,
        shortDescription,
        description,
        image: uploadedImage,
        primarySpecification,
        location,
        availableUnits,
        safetyCertificate,
        displayOrder,
        isActive,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      });

      await equipment.populate("category", "name slug");

      return res.status(201).json({
        success: true,
        message: "Equipment created successfully.",
        data: equipment,
      });
    } catch (error) {
      if (uploadedImage?.publicId) {
        await deleteEquipmentImageSafely(uploadedImage.publicId);
      }

      throw error;
    }
  };

  // ==================================================
  // Update Equipment
  // ==================================================

  updateEquipment = async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    const {
      title,
      slug,
      category,
      shortDescription,
      description,
      primarySpecification,
      location,
      availableUnits,
      safetyCertificate,
      displayOrder,
      isActive,
      imageAlt,
    } = req.body;

    if (slug !== undefined && slug !== equipment.slug) {
      const existingEquipment = await Equipment.findOne({
        slug,
        _id: {
          $ne: equipment._id,
        },
      }).lean();

      if (existingEquipment) {
        return res.status(409).json({
          success: false,
          message: "Equipment with this slug already exists.",
        });
      }
    }

    if (category !== undefined) {
      const existingCategory = await EquipmentCategory.findOne({
        _id: category,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: "Active equipment category not found.",
        });
      }
    }

    const oldImagePublicId = equipment.image?.publicId;

    let newUploadedImage = null;

    try {
      if (req.file) {
        newUploadedImage = await uploadEquipmentImage(
          req.file,
          imageAlt !== undefined ? imageAlt : equipment.image?.alt || title || equipment.title,
        );

        equipment.image = newUploadedImage;
      } else if (imageAlt !== undefined) {
        equipment.image.alt = imageAlt;
      }

      if (title !== undefined) {
        equipment.title = title;
      }

      if (slug !== undefined) {
        equipment.slug = slug;
      }

      if (category !== undefined) {
        equipment.category = category;
      }

      if (shortDescription !== undefined) {
        equipment.shortDescription = shortDescription;
      }

      if (description !== undefined) {
        equipment.description = description;
      }

      if (primarySpecification !== undefined) {
        equipment.primarySpecification = primarySpecification;
      }

      if (location !== undefined) {
        equipment.location = location;
      }

      if (availableUnits !== undefined) {
        equipment.availableUnits = availableUnits;
      }

      if (safetyCertificate !== undefined) {
        equipment.safetyCertificate = safetyCertificate;
      }

      if (displayOrder !== undefined) {
        equipment.displayOrder = displayOrder;
      }

      if (isActive !== undefined) {
        equipment.isActive = isActive;
      }

      equipment.updatedBy = getCurrentUserId(req);

      await equipment.save();

      if (newUploadedImage?.publicId && oldImagePublicId && oldImagePublicId !== newUploadedImage.publicId) {
        await deleteEquipmentImageSafely(oldImagePublicId);
      }

      await equipment.populate("category", "name slug");

      return res.status(200).json({
        success: true,
        message: "Equipment updated successfully.",
        data: equipment,
      });
    } catch (error) {
      if (newUploadedImage?.publicId) {
        await deleteEquipmentImageSafely(newUploadedImage.publicId);
      }

      throw error;
    }
  };

  // ==================================================
  // Delete Equipment
  // ==================================================

  deleteEquipment = async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    const requestsCount = await EquipmentRequest.countDocuments({
      equipment: equipment._id,
    });

    if (requestsCount > 0) {
      equipment.isActive = false;
      equipment.updatedBy = getCurrentUserId(req);

      await equipment.save();

      return res.status(200).json({
        success: true,
        message: "Equipment has existing requests and was deactivated instead of permanently deleted.",
        data: equipment,
      });
    }

    const imagePublicId = equipment.image?.publicId;

    await equipment.deleteOne();

    await deleteEquipmentImageSafely(imagePublicId);

    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully.",
    });
  };
}

module.exports = new EquipmentController();
