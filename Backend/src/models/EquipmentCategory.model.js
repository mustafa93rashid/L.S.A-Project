const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Equipment Category Schema
|--------------------------------------------------------------------------
*/

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
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Audit Fields
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

equipmentCategorySchema.index({
  isActive: 1,
  displayOrder: 1,
});

equipmentCategorySchema.index({
  name: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const EquipmentCategory =
  mongoose.models.EquipmentCategory ||
  mongoose.model(
    "EquipmentCategory",
    equipmentCategorySchema,
  );

module.exports = EquipmentCategory;