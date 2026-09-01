const {
  CLOUDINARY_FOLDERS,
  uploadMulterImage,
  deleteImageSafely,
} = require("../services/cloudinary.service");

// ==================== Get Current User ID ====================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// ==================== Escape Regex ====================

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================== Parse Boolean ====================

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

// ==================== Build Dashboard Filter ====================

const buildNewsDashboardFilter = (query = {}) => {
  const {
    status,
    category,
    isFeatured,
    search,
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  const featured = parseBoolean(isFeatured);

  if (featured !== undefined) {
    filter.isFeatured = featured;
  }

  if (search?.trim()) {
    const safeSearch = escapeRegex(
      search.trim()
    );

    filter.$or = [
      {
        title: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        shortDescription: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        content: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};

// ==================== Build Public Filter ====================

const buildPublicNewsFilter = (query = {}) => {
  const filter = {
    status: "published",

    publishedAt: {
      $lte: new Date(),
    },
  };

  if (query.category) {
    filter.category = query.category;
  }

  return filter;
};

// ==================== Resolve Published At ====================

const resolvePublishedAt = ({
  status,
  currentStatus,
  currentPublishedAt,
}) => {
  if (
    status === "published" &&
    currentStatus !== "published"
  ) {
    return new Date();
  }

  if (
    status === "published" &&
    currentPublishedAt
  ) {
    return currentPublishedAt;
  }

  if (
    status === "draft" ||
    status === "archived"
  ) {
    return null;
  }

  return currentPublishedAt || null;
};

// ==================== Upload News Image ====================

const uploadNewsImage = async (file) => {
  if (!file) {
    return null;
  }

  const uploadedImage =
    await uploadMulterImage({
      file,
      folder: CLOUDINARY_FOLDERS.NEWS,
      prefix: "news",
    });

  return {
    url: uploadedImage.url,
    publicId: uploadedImage.publicId,
  };
};

// ==================== Delete News Image ====================

const deleteNewsImage = async (image) => {
  if (!image?.publicId) {
    return;
  }

  await deleteImageSafely(
    image.publicId
  );
};

// ==================== Build Image Data ====================

const buildNewsImage = ({
  uploadedImage,
  alt,
  currentImage = null,
}) => {
  if (uploadedImage) {
    return {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
      alt: alt?.trim() || "",
    };
  }

  if (currentImage) {
    return {
      url: currentImage.url,
      publicId: currentImage.publicId,

      alt:
        alt !== undefined
          ? alt.trim()
          : currentImage.alt || "",
    };
  }

  return null;
};

// ==================== Exports ====================

module.exports = {
  getCurrentUserId,

  escapeRegex,

  parseBoolean,

  buildNewsDashboardFilter,

  buildPublicNewsFilter,

  resolvePublishedAt,

  uploadNewsImage,

  deleteNewsImage,

  buildNewsImage,
};