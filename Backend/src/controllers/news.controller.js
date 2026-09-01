const {
  News,
} = require("../models/news.model");

const {
  getCurrentUserId,
  buildNewsDashboardFilter,
  buildPublicNewsFilter,
  resolvePublishedAt,
  uploadNewsImage,
  deleteNewsImage,
  buildNewsImage,
} = require("../helpers/news.helper");

// ==================== Constants ====================

const NEWS_POPULATE_FIELDS = [
  {
    path: "createdBy",
    select: "fullName email role",
  },
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

// ============================================================
// PUBLIC
// ============================================================

// ==================== Get Public News ====================

const getPublicNews = async (req, res, next) => {
  try {
    const filter = buildPublicNewsFilter(req.query);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 3, 1),
      20
    );

    const news = await News.find(filter)
      .sort({
        displayOrder: 1,
        publishedAt: -1,
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Get Public News By ID ====================

const getPublicNewsById = async (req, res, next) => {
  try {
    const news = await News.findOne({
      _id: req.params.id,
      status: "published",
      publishedAt: {
        $lte: new Date(),
      },
    }).lean();

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DASHBOARD
// ============================================================

// ==================== Get All News ====================

const getAllNews = async (req, res, next) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter =
      buildNewsDashboardFilter(req.query);

    const [news, total] = await Promise.all([
      News.find(filter)
        .populate(NEWS_POPULATE_FIELDS)
        .sort({
          displayOrder: 1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      News.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },

      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Get News By ID ====================

const getNewsById = async (req, res, next) => {
  try {
    const news = await News.findById(
      req.params.id
    ).populate(NEWS_POPULATE_FIELDS);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Create News ====================

const createNews = async (req, res, next) => {
  let uploadedImage = null;

  try {
    const {
      title,
      shortDescription,
      content,
      category,
      status,
      isFeatured,
      displayOrder,
      imageAlt,
    } = req.body;

    // ==================== Upload Image ====================

    uploadedImage = await uploadNewsImage(
      req.file
    );

    if (!uploadedImage) {
      return res.status(400).json({
        success: false,
        message: "News image is required",
      });
    }

    // ==================== Published At ====================

    const publishedAt =
      resolvePublishedAt({
        status: status || "draft",
        currentStatus: null,
        currentPublishedAt: null,
      });

    // ==================== Create ====================

    const news = await News.create({
      title,
      shortDescription,
      content,

      category:
        category || "company",

      image: buildNewsImage({
        uploadedImage,
        alt: imageAlt,
      }),

      status:
        status || "draft",

      publishedAt,

      isFeatured:
        isFeatured === true ||
        isFeatured === "true",

      displayOrder:
        Number(displayOrder) || 0,

      createdBy:
        getCurrentUserId(req),

      updatedBy:
        getCurrentUserId(req),
    });

    await news.populate(
      NEWS_POPULATE_FIELDS
    );

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: news,
    });
  } catch (error) {
    // Clean up uploaded image if DB creation fails
    if (uploadedImage?.publicId) {
      await deleteNewsImage(uploadedImage);
    }

    next(error);
  }
};

// ==================== Update News ====================

const updateNews = async (req, res, next) => {
  let uploadedImage = null;

  try {
    const news = await News.findById(
      req.params.id
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    const {
      title,
      shortDescription,
      content,
      category,
      status,
      isFeatured,
      displayOrder,
      imageAlt,
    } = req.body;

    // ==================== Upload New Image ====================

    if (req.file) {
      uploadedImage =
        await uploadNewsImage(req.file);
    }

    const oldImage = news.image
      ? {
          url: news.image.url,
          publicId: news.image.publicId,
          alt: news.image.alt,
        }
      : null;

    // ==================== Basic Information ====================

    if (title !== undefined) {
      news.title = title;
    }

    if (shortDescription !== undefined) {
      news.shortDescription =
        shortDescription;
    }

    if (content !== undefined) {
      news.content = content;
    }

    if (category !== undefined) {
      news.category = category;
    }

    if (isFeatured !== undefined) {
      news.isFeatured =
        isFeatured === true ||
        isFeatured === "true";
    }

    if (displayOrder !== undefined) {
      news.displayOrder =
        Number(displayOrder);
    }

    // ==================== Image ====================

    news.image = buildNewsImage({
      uploadedImage,
      alt: imageAlt,
      currentImage: oldImage,
    });

    // ==================== Publishing ====================

    if (status !== undefined) {
      news.publishedAt =
        resolvePublishedAt({
          status,
          currentStatus: news.status,
          currentPublishedAt:
            news.publishedAt,
        });

      news.status = status;
    }

    // ==================== Tracking ====================

    news.updatedBy =
      getCurrentUserId(req);

    await news.save();

    // ==================== Delete Old Image ====================

    if (
      uploadedImage &&
      oldImage?.publicId &&
      oldImage.publicId !==
        uploadedImage.publicId
    ) {
      await deleteNewsImage(oldImage);
    }

    await news.populate(
      NEWS_POPULATE_FIELDS
    );

    return res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: news,
    });
  } catch (error) {
    // New image uploaded but update failed
    if (uploadedImage?.publicId) {
      await deleteNewsImage(uploadedImage);
    }

    next(error);
  }
};

// ==================== Delete News ====================

const deleteNews = async (req, res, next) => {
  try {
    const news = await News.findById(
      req.params.id
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    const image = news.image
      ? {
          publicId: news.image.publicId,
        }
      : null;

    await news.deleteOne();

    // Delete Cloudinary image after DB deletion
    await deleteNewsImage(image);

    return res.status(200).json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Public
  getPublicNews,
  getPublicNewsById,

  // Dashboard
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};