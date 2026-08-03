const EquipmentCategory = require("../models/equipmentCategory.model");
const Equipment = require("../models/equipment.model");

const {
  EquipmentRequest,
} = require("../models/equipmentRequest.model");

const {
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
} = require("../helpers/equipment.helper");

// ==================== Equipment Controller ====================

class EquipmentController {
  // ==================== Get Public Categories ====================

  getPublicCategories = async (
    req,
    res,
  ) => {
    const categories =
      await EquipmentCategory.find({
        isActive: true,
      })
        .select(
          "name slug displayOrder",
        )
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

  // ==================== Get Category Options ====================

  getCategoryOptions = async (
    req,
    res,
  ) => {
    const categories =
      await EquipmentCategory.find({
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

  // ==================== Get All Categories ====================

  getAllCategories = async (
    req,
    res,
  ) => {
    const categories =
      await EquipmentCategory.find()
        .populate(
          "createdBy",
          "fullName email role",
        )
        .populate(
          "updatedBy",
          "fullName email role",
        )
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

  // ==================== Get Category By ID ====================

  getCategoryById = async (
    req,
    res,
  ) => {
    const category =
      await EquipmentCategory.findById(
        req.params.id,
      )
        .populate(
          "createdBy",
          "fullName email role",
        )
        .populate(
          "updatedBy",
          "fullName email role",
        )
        .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment category not found",
      });
    }

    const equipment =
      await Equipment.find({
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

  // ==================== Create Category ====================

  createCategory = async (
    req,
    res,
  ) => {
    const {
      name,
      slug,
      displayOrder,
      isActive,
    } = req.body;

    const duplicateExists =
      await categoryDuplicateExists({
        name,
        slug,
      });

    if (duplicateExists) {
      return res.status(409).json({
        success: false,
        message:
          "An equipment category with this name or slug already exists",
      });
    }

    const currentUserId =
      getCurrentUserId(req);

    const category =
      await EquipmentCategory.create({
        name,
        slug: normalizeSlug(slug),
        displayOrder,
        isActive,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      });

    return res.status(201).json({
      success: true,
      message:
        "Equipment category created successfully",
      data: category,
    });
  };

  // ==================== Update Category ====================

  updateCategory = async (
    req,
    res,
  ) => {
    const category =
      await EquipmentCategory.findById(
        req.params.id,
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment category not found",
      });
    }

    const duplicateExists =
      await categoryDuplicateExists({
        name: req.body.name,
        slug: req.body.slug,

        excludedCategoryId:
          category._id,
      });

    if (duplicateExists) {
      return res.status(409).json({
        success: false,
        message:
          "An equipment category with this name or slug already exists",
      });
    }

    updateCategoryFields(
      category,
      req.body,
    );

    category.updatedBy =
      getCurrentUserId(req);

    await category.save();

    return res.status(200).json({
      success: true,
      message:
        "Equipment category updated successfully",
      data: category,
    });
  };

  // ==================== Delete Category ====================

  deleteCategory = async (
    req,
    res,
  ) => {
    const category =
      await EquipmentCategory.findById(
        req.params.id,
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment category not found",
      });
    }

    const equipmentCount =
      await Equipment.countDocuments({
        category: category._id,
      });

    if (equipmentCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category cannot be deleted because it contains equipment",
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Equipment category deleted successfully",
    });
  };

  // ==================== Get Public Equipment ====================

  getPublicEquipment = async (
    req,
    res,
  ) => {
    const filter = {
      isActive: true,
    };

    if (req.query.category) {
      const category =
        await EquipmentCategory.findOne({
          slug:
            req.query.category,
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

      filter.category =
        category._id;
    }

    if (req.query.search) {
      const searchTerm =
        escapeRegex(
          req.query.search,
        );

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

    const equipment =
      await Equipment.find(filter)
        .populate({
          path: "category",
          select:
            "name slug displayOrder",

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

    const visibleEquipment =
      equipment.filter(
        (item) => item.category,
      );

    return res.status(200).json({
      success: true,
      count:
        visibleEquipment.length,
      data: visibleEquipment,
    });
  };

  // ==================== Get Public Equipment By Slug ====================

  getPublicEquipmentBySlug =
    async (req, res) => {
      const equipment =
        await Equipment.findOne({
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
          .select(
            "-image.publicId -createdBy -updatedBy",
          )
          .lean();

      if (
        !equipment ||
        !equipment.category
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Equipment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: equipment,
      });
    };

  // ==================== Get All Equipment ====================

  getAllEquipment = async (
    req,
    res,
  ) => {
    const filter = {};

    if (req.query.category) {
      filter.category =
        req.query.category;
    }

    if (
      req.query.isActive !==
      undefined
    ) {
      filter.isActive =
        req.query.isActive;
    }

    if (req.query.search) {
      const searchTerm =
        escapeRegex(
          req.query.search,
        );

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

    const equipment =
      await Equipment.find(filter)
        .populate(
          "category",
          "name slug isActive",
        )
        .populate(
          "createdBy",
          "fullName email role",
        )
        .populate(
          "updatedBy",
          "fullName email role",
        )
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

  // ==================== Get Equipment By ID ====================

  getEquipmentById = async (
    req,
    res,
  ) => {
    const equipment =
      await Equipment.findById(
        req.params.id,
      )
        .populate(
          "category",
          "name slug isActive",
        )
        .populate(
          "createdBy",
          "fullName email role",
        )
        .populate(
          "updatedBy",
          "fullName email role",
        )
        .lean();

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  };

  // ==================== Create Equipment ====================

  createEquipment = async (
    req,
    res,
  ) => {
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

    const duplicateSlug =
      await equipmentSlugExists({
        slug,
      });

    if (duplicateSlug) {
      return res.status(409).json({
        success: false,
        message:
          "Equipment with this slug already exists",
      });
    }

    const activeCategory =
      await findActiveCategory(
        category,
      );

    if (!activeCategory) {
      return res.status(404).json({
        success: false,
        message:
          "Active equipment category not found",
      });
    }

    let uploadedImage = null;

    try {
      uploadedImage =
        await uploadEquipmentImage({
          file: req.file,
          alt:
            imageAlt || title,
        });

      const currentUserId =
        getCurrentUserId(req);

      const equipment =
        await Equipment.create({
          title,
          slug:
            normalizeSlug(slug),
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

          createdBy:
            currentUserId,

          updatedBy:
            currentUserId,
        });

      await equipment.populate(
        "category",
        "name slug",
      );

      return res.status(201).json({
        success: true,
        message:
          "Equipment created successfully",
        data: equipment,
      });
    } catch (error) {
      if (
        uploadedImage?.publicId
      ) {
        await deleteEquipmentImageSafely(
          uploadedImage.publicId,
        );
      }

      throw error;
    }
  };

  // ==================== Update Equipment ====================

  updateEquipment = async (
    req,
    res,
  ) => {
    const equipment =
      await Equipment.findById(
        req.params.id,
      );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found",
      });
    }

    const {
      slug,
      category,
      imageAlt,
    } = req.body;

    if (slug !== undefined) {
      const duplicateSlug =
        await equipmentSlugExists({
          slug,

          excludedEquipmentId:
            equipment._id,
        });

      if (duplicateSlug) {
        return res.status(409).json({
          success: false,
          message:
            "Equipment with this slug already exists",
        });
      }
    }

    if (category !== undefined) {
      const activeCategory =
        await findActiveCategory(
          category,
        );

      if (!activeCategory) {
        return res.status(404).json({
          success: false,
          message:
            "Active equipment category not found",
        });
      }
    }

    let imageReplacement = null;

    try {
      imageReplacement =
        await replaceEquipmentImage({
          equipment,
          file: req.file,
          imageAlt,

          fallbackAlt:
            req.body.title ||
            equipment.title,
        });

      updateEquipmentFields(
        equipment,
        req.body,
      );

      equipment.updatedBy =
        getCurrentUserId(req);

      await equipment.save();

      if (
        imageReplacement?.oldPublicId &&
        imageReplacement.oldPublicId !==
          imageReplacement.newPublicId
      ) {
        await deleteEquipmentImageSafely(
          imageReplacement.oldPublicId,
        );
      }

      await equipment.populate(
        "category",
        "name slug",
      );

      return res.status(200).json({
        success: true,
        message:
          "Equipment updated successfully",
        data: equipment,
      });
    } catch (error) {
      if (
        imageReplacement?.newPublicId
      ) {
        await deleteEquipmentImageSafely(
          imageReplacement.newPublicId,
        );
      }

      throw error;
    }
  };

  // ==================== Delete Equipment ====================

  deleteEquipment = async (
    req,
    res,
  ) => {
    const equipment =
      await Equipment.findById(
        req.params.id,
      );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found",
      });
    }

    const requestsCount =
      await EquipmentRequest.countDocuments(
        {
          equipment:
            equipment._id,
        },
      );

    if (requestsCount > 0) {
      equipment.isActive = false;

      equipment.updatedBy =
        getCurrentUserId(req);

      await equipment.save();

      return res.status(200).json({
        success: true,
        message:
          "Equipment has existing requests and was deactivated instead of permanently deleted",
        data: equipment,
      });
    }

    const imagePublicId =
      equipment.image?.publicId;

    await equipment.deleteOne();

    await deleteEquipmentImageSafely(
      imagePublicId,
    );

    return res.status(200).json({
      success: true,
      message:
        "Equipment deleted successfully",
    });
  };
}

module.exports =
  new EquipmentController();