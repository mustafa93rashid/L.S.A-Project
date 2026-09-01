const mongoose = require("mongoose");

const NEWS_STATUSES = [
  "draft",
  "published",
  "archived",
];

const NEWS_CATEGORIES = [
  "projects",
  "company",
  "hse",
  "events",
  "partnerships",
  "achievements",
  "training",
  "equipment",
  "other",
];

// ==================== News Schema ====================

const newsSchema = new mongoose.Schema(
  {
    // ==================== Basic Information ====================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    // ==================== Category ====================

    category: {
      type: String,
      enum: NEWS_CATEGORIES,
      default: "company",
      index: true,
    },

    // ==================== Image ====================

    image: {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        default: null,
      },

      alt: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },
    },

    // ==================== Publishing ====================

    status: {
      type: String,
      enum: NEWS_STATUSES,
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================== Tracking ====================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==================== Indexes ====================

newsSchema.index({
  status: 1,
  publishedAt: -1,
});

newsSchema.index({
  isFeatured: 1,
  displayOrder: 1,
  publishedAt: -1,
});

// ==================== Model ====================

const News = mongoose.model("News", newsSchema);

module.exports = {
  News,
  NEWS_STATUSES,
  NEWS_CATEGORIES,
};