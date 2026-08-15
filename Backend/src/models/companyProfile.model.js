const mongoose = require("mongoose");

const companyProfileSchema =
  new mongoose.Schema(
    {
      fileName: {
        type: String,
        required: true,
        trim: true,
      },

      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },

      resourceType: {
        type: String,
        required: true,
        default: "raw",
      },

      format: {
        type: String,
        default: "pdf",
      },

      size: {
        type: Number,
        required: true,
        min: 0,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

module.exports = mongoose.model(
  "CompanyProfile",
  companyProfileSchema,
);