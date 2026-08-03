const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    logo: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },
    },

    website: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Partner", partnerSchema);