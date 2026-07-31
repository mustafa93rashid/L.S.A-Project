const mongoose = require("mongoose");

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
  },
  {
    _id: false,
  },
);

const processStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const tableRowSchema = new mongoose.Schema(
  {
    cells: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    categoryLabel: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      required: true,
    },

    hero: {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        required: true,
      },

      image: {
        type: imageSchema,
        required: true,
      },
    },

    cardImage: {
      type: imageSchema,
      required: true,
    },

    highlights: {
      type: [String],
      default: [],
    },

    processSection: {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        required: true,
      },

      steps: {
        type: [processStepSchema],
        default: [],
      },
    },

    capabilitiesSection: {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        required: true,
      },

      items: {
        type: [String],
        default: [],
      },

      table: {
        headers: {
          type: [String],
          default: [],
        },

        rows: {
          type: [tableRowSchema],
          default: [],
        },
      },
    },

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
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({
  isActive: 1,
  displayOrder: 1,
});

serviceSchema.index({
  isFeatured: 1,
  isActive: 1,
});

const Service =
  mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);

module.exports = Service;