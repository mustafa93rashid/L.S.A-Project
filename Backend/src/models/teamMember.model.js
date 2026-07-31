// src/models/teamMember.model.js

const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Team member full name is required"],
      trim: true,
      minlength: [2, "Full name must contain at least 2 characters"],
      maxlength: [120, "Full name cannot exceed 120 characters"],
    },

    position: {
      type: String,
      required: [true, "Team member position is required"],
      trim: true,
      minlength: [2, "Position must contain at least 2 characters"],
      maxlength: [120, "Position cannot exceed 120 characters"],
    },

    experience: {
      type: String,
      required: [true, "Team member experience is required"],
      trim: true,
      maxlength: [50, "Experience cannot exceed 50 characters"],
    },

    image: {
      url: {
        type: String,
        required: [true, "Team member image URL is required"],
        trim: true,
      },

      publicId: {
        type: String,
        required: [true, "Team member image public ID is required"],
        trim: true,
      },
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: [0, "Display order cannot be less than 0"],
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

// ==================================================
// Indexes
// ==================================================

teamMemberSchema.index({
  isActive: 1,
  displayOrder: 1,
  createdAt: 1,
});

// ==================================================
// Model
// ==================================================

const TeamMember = mongoose.model(
  "TeamMember",
  teamMemberSchema,
);

module.exports = TeamMember;