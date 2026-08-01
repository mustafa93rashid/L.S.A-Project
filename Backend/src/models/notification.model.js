const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const NOTIFICATION_TYPES = [
  "equipmentRequest",
  "careerApplication",
  "contactMessage",
  "system",
];

const NOTIFICATION_REFERENCE_MODELS = [
  "EquipmentRequest",
  "Career",
  "Contact",
];

/*
|--------------------------------------------------------------------------
| Notification Schema
|--------------------------------------------------------------------------
*/

const notificationSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Notification Type
    |--------------------------------------------------------------------------
    */

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Content
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    /*
    |--------------------------------------------------------------------------
    | Reference
    |--------------------------------------------------------------------------
    */

    reference: {
      model: {
        type: String,
        enum: NOTIFICATION_REFERENCE_MODELS,
        required: true,
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Extra Data
    |--------------------------------------------------------------------------
    */

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    |--------------------------------------------------------------------------
    | Read Status
    |--------------------------------------------------------------------------
    */

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | Audit
    |--------------------------------------------------------------------------
    */

    createdBy: {
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

notificationSchema.index({
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  type: 1,
  createdAt: -1,
});

notificationSchema.index({
  "reference.model": 1,
  "reference.id": 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema,
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  Notification,
  NOTIFICATION_TYPES,
};