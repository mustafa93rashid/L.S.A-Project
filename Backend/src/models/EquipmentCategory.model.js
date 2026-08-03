const mongoose = require("mongoose");

// ==================== Equipment Category Schema ====================

const equipmentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

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

equipmentCategorySchema.index({
  isActive: 1,
  displayOrder: 1,
});

equipmentCategorySchema.index({
  name: 1,
});

// ==================== Equipment Category Model ====================

const EquipmentCategory =
  mongoose.models.EquipmentCategory ||
  mongoose.model(
    "EquipmentCategory",
    equipmentCategorySchema,
  );

module.exports = EquipmentCategory;