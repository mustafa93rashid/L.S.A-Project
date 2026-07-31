const mongoose = require("mongoose");

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
      lowercase: true,
      trim: true,
    },

    categoryLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    hero: {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      image: {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },
      },
    },

    cardImage: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },
    },

    projectDetails: {
      client: {
        type: String,
        trim: true,
      },

      location: {
        type: String,
        trim: true,
      },

      completionDate: Date,

      duration: {
        type: String,
        trim: true,
      },

      status: {
        type: String,
        trim: true,
      },
    },

    detailedScope: {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      items: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },

          description: {
            type: String,
            required: true,
            trim: true,
          },

          icon: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
    },

    gallery: [
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
        },

        displayOrder: {
          type: Number,
          default: 0,
        },
      },
    ],

    certificates: [
      {
        title: {
          type: String,
          trim: true,
        },

        description: {
          type: String,
          trim: true,
        },

        image: {
          url: String,
          publicId: String,
        },
      },
    ],

    displayOrder: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

projectSchema.index({
  isActive: 1,
  displayOrder: 1,
});

projectSchema.index({
  isFeatured: 1,
  isActive: 1,
});


module.exports = mongoose.model("Project", projectSchema,);