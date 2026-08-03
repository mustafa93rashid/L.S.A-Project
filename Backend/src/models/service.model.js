const mongoose = require("mongoose");

// ==================== Shared Schemas ====================

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

const deliveryStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
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

const capabilityTableRowSchema = new mongoose.Schema(
  {
    cells: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
  },
);

// ==================== Service Schema ====================

const serviceSchema = new mongoose.Schema(
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
      maxlength: 160,
    },

    // ==================== Service Card ====================

    serviceCard: {
      label: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1000,
      },

      highlights: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 150,
          },
        ],
        default: [],
      },

      image: {
        type: imageSchema,
        required: true,
      },
    },

    // ==================== Hero Section ====================

    heroSection: {
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

    // ==================== Delivery Process Section ====================

    deliveryProcessSection: {
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

      steps: {
        type: [deliveryStepSchema],
        default: [],
      },
    },

    // ==================== Capabilities Section ====================

    capabilitiesSection: {
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
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },

      table: {
        headers: {
          type: [
            {
              type: String,
              trim: true,
              maxlength: 100,
            },
          ],
          default: [],
        },

        rows: {
          type: [capabilityTableRowSchema],
          default: [],
        },
      },
    },

    // ==================== Home Capability ====================

    homeCapability: {
      isVisible: {
        type: Boolean,
        default: false,
      },

      title: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },

      shortDescription: {
        type: String,
        trim: true,
        default: "",
        maxlength: 500,
      },

      displayOrder: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // ==================== General Settings ====================

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ==================== Indexes ====================

serviceSchema.index({
  isActive: 1,
  displayOrder: 1,
});

serviceSchema.index({
  "homeCapability.isVisible": 1,
  "homeCapability.displayOrder": 1,
  isActive: 1,
});

// ==================== Service Model ====================

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

module.exports = Service;
