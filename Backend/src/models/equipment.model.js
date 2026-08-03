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
      maxlength: 250,
    },
  },
  {
    _id: false,
  },
);

// ==================== Safety Certificate Schema ====================

const safetyCertificateSchema = new mongoose.Schema(
  {
    isAvailable: {
      type: Boolean,
      default: false,
    },

    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  {
    _id: false,
  },
);

// ==================== Equipment Schema ====================

const equipmentSchema = new mongoose.Schema(
  {
    // ==================== Basic Information ====================

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
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EquipmentCategory",
      required: true,
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
      minlength: 10,
      maxlength: 5000,
    },

    // ==================== Main Image ====================

    image: {
      type: imageSchema,
      required: true,
    },

    // ==================== Primary Specification ====================

    primarySpecification: {
      label: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      value: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 150,
      },
    },

    // ==================== Location And Availability ====================

    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    availableUnits: {
      type: Number,
      default: 0,
      min: 0,
      max: 99999,

      validate: {
        validator: Number.isInteger,
        message: "Available units must be an integer",
      },
    },

    // ==================== Safety Certificate ====================

    safetyCertificate: {
      type: safetyCertificateSchema,

      default: () => ({
        isAvailable: false,
        message: "",
      }),
    },

    // ==================== Display Settings ====================

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
      max: 999,

      validate: {
        validator: Number.isInteger,
        message: "Display order must be an integer",
      },
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

// ==================== Indexes ====================

equipmentSchema.index({
  category: 1,
  isActive: 1,
  displayOrder: 1,
});

equipmentSchema.index({
  isActive: 1,
  displayOrder: 1,
});

equipmentSchema.index({
  "safetyCertificate.isAvailable": 1,
  isActive: 1,
});

equipmentSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
  location: "text",
  "primarySpecification.label": "text",
  "primarySpecification.value": "text",
});

// ==================== Equipment Model ====================

const Equipment =
  mongoose.models.Equipment || mongoose.model("Equipment", equipmentSchema);

module.exports = Equipment;
