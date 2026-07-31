const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
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

const safetyCertificateSchema = new mongoose.Schema(
  {
    isAvailable: {
      type: Boolean,
      default: false,
    },

    url: {
      type: String,
      default: null,
    },

    publicId: {
      type: String,
      default: null,
    },

    originalName: {
      type: String,
      trim: true,
      default: null,
    },

    resourceType: {
      type: String,
      enum: ["image", "raw"],
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

/*
|--------------------------------------------------------------------------
| Equipment Schema
|--------------------------------------------------------------------------
*/

const equipmentSchema = new mongoose.Schema(
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
      lowercase: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EquipmentCategory",
  default: null,
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

    /*
    |--------------------------------------------------------------------------
    | Main Image
    |--------------------------------------------------------------------------
    */

    image: {
      type: imageSchema,
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Primary Specification
    |--------------------------------------------------------------------------
    |
    | Examples:
    |
    | label: Capacity
    | value: 50 Tons
    |
    | label: Power
    | value: 500 KVA
    |
    */

    primarySpecification: {
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      value: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    availableUnits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Safety Certificate
    |--------------------------------------------------------------------------
    */

    safetyCertificate: {
      type: safetyCertificateSchema,

      default: () => ({
        isAvailable: false,
        url: null,
        publicId: null,
        originalName: null,
        resourceType: null,
        expiresAt: null,
      }),
    },

    /*
    |--------------------------------------------------------------------------
    | Display Settings
    |--------------------------------------------------------------------------
    */

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
  title: "text",
  shortDescription: "text",
  location: "text",
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Equipment =
  mongoose.models.Equipment || mongoose.model("Equipment", equipmentSchema);

module.exports = Equipment;
