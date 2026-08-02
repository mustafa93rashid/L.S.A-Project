const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Contact Information Schema
|--------------------------------------------------------------------------
*/

const contactInfoSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Main Information
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,
      trim: true,
      default: "Basra Headquarters",
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    /*
    |--------------------------------------------------------------------------
    | Phone Numbers
    |--------------------------------------------------------------------------
    */

    phones: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 30,
        },
      ],
      default: [],
    },

    primaryPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    /*
    |--------------------------------------------------------------------------
    | Email
    |--------------------------------------------------------------------------
    */

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    /*
    |--------------------------------------------------------------------------
    | Working Hours
    |--------------------------------------------------------------------------
    */

    workingHours: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    emergencyHours: {
      type: String,
      trim: true,
      default: "",
      maxlength: 250,
    },

    /*
    |--------------------------------------------------------------------------
    | Social Links
    |--------------------------------------------------------------------------
    */

    socialLinks: {
      facebook: {
        type: String,
        trim: true,
        default: "",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },

      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      whatsapp: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Display Settings
    |--------------------------------------------------------------------------
    */

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Audit
    |--------------------------------------------------------------------------
    */

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
| Model
|--------------------------------------------------------------------------
*/

const ContactInfo =
  mongoose.models.ContactInfo ||
  mongoose.model(
    "ContactInfo",
    contactInfoSchema,
  );

module.exports = ContactInfo;