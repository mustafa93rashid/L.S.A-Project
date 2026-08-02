const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CONTACT_MESSAGE_SERVICES = [
  "General Inquiry",
  "EPC Projects",
  "Pipeline Services",
  "Process Piping",
  "Hot Tapping",
  "Pipeline Integrity",
  "Storage Tanks",
  "Mechanical Works",
  "Cathodic Protection",
  "Civil Works",
  "Electrical and Instrumentation",
  "Auger Boring & HDD",
];

const CONTACT_MESSAGE_STATUSES = [
  "new",
  "read",
  "replied",
  "archived",
];

/*
|--------------------------------------------------------------------------
| Contact Message Schema
|--------------------------------------------------------------------------
*/

const contactMessageSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Customer Information
    |--------------------------------------------------------------------------
    */

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    /*
    |--------------------------------------------------------------------------
    | Inquiry
    |--------------------------------------------------------------------------
    */

    service: {
      type: String,
      enum: CONTACT_MESSAGE_SERVICES,
      default: "General Inquiry",
      index: true,
    },

    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: CONTACT_MESSAGE_STATUSES,
      default: "new",
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    repliedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
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

contactMessageSchema.index({
  status: 1,
  createdAt: -1,
});

contactMessageSchema.index({
  service: 1,
  createdAt: -1,
});

contactMessageSchema.index({
  email: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model(
    "ContactMessage",
    contactMessageSchema,
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  ContactMessage,
  CONTACT_MESSAGE_SERVICES,
  CONTACT_MESSAGE_STATUSES,
};