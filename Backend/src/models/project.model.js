const mongoose = require("mongoose");

// ==================== Shared Image Schema ====================

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },
  },
  {
    _id: false,
  },
);

// ==================== Scope Item Schema ====================

const scopeItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 600,
    },

    icon: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  {
    _id: false,
  },
);

// ==================== Gallery Image Schema ====================

const galleryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

// ==================== Certificate Image Schema ====================

const certificateImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

// ==================== Project Schema ====================

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },

    categoryLabel: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },

    // ==================== Related Services ====================

    services: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      default: [],
    },

    // ==================== Hero Section ====================

    hero: {
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1500,
      },

      image: {
        type: imageSchema,
        required: true,
      },
    },

    // ==================== Card Image ====================

    cardImage: {
      type: imageSchema,
      required: true,
    },

    // ==================== Project Details ====================

    projectDetails: {
      client: {
        type: String,
        trim: true,
        default: null,
        maxlength: 150,
      },

      location: {
        type: String,
        trim: true,
        default: null,
        maxlength: 150,
      },

      completionDate: {
        type: Date,
        default: null,
      },

      duration: {
        type: String,
        trim: true,
        default: null,
        maxlength: 100,
      },

      status: {
        type: String,
        trim: true,
        default: null,
        maxlength: 100,
      },
    },

    // ==================== Detailed Scope ====================

    detailedScope: {
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1500,
      },

      items: {
        type: [scopeItemSchema],
        default: [],
      },
    },

    // ==================== Gallery ====================

    gallery: {
      type: [galleryImageSchema],
      default: [],
    },

    // ==================== Certificates ====================

    certificates: {
      type: [certificateImageSchema],
      default: [],
    },

    // ==================== General Settings ====================

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==================== Audit Information ====================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  },
);

// ==================== Remove Duplicate Services ====================

projectSchema.pre("validate", function () {
  if (Array.isArray(this.services)) {
    const uniqueServiceIds = [
      ...new Set(this.services.map((serviceId) => serviceId.toString())),
    ];

    this.services = uniqueServiceIds;
  }
});

// ==================== Indexes ====================

projectSchema.index({
  isActive: 1,
  displayOrder: 1,
});

projectSchema.index({
  isFeatured: 1,
  isActive: 1,
  displayOrder: 1,
});

projectSchema.index({
  services: 1,
  isActive: 1,
});

// ==================== Project Model ====================

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

module.exports = Project;
