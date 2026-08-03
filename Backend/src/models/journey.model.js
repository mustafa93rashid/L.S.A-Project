const mongoose = require("mongoose");

const journeySchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    icon: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    side: {
      type: String,
      enum: ["left", "right"],
      required: true,
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
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Journey", journeySchema);
