const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "superadmin",
        "equipmentManager",
        "hrManager",
        "contentManager",
      ],
      required: true,
    },

    department: {
      type: String,
      trim: true,
      default: null,
    },

    avatar: {
      url: {
        type: String,
        default: null,
      },

      publicId: {
        type: String,
        default: null,
      },
    },

    passwordChangeCode: {
      type: String,
      select: false,
      default: undefined,
    },

    passwordChangeCodeExpires: {
      type: Date,
      select: false,
      default: undefined,
    },

    pendingPassword: {
      type: String,
      select: false,
      default: undefined,
    },

    activationToken: {
      type: String,
      select: false,
      default: undefined,
    },

    activationTokenExpires: {
      type: Date,
      select: false,
      default: undefined,
    },

    isAccountActivated: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;