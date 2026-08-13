const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const NOTIFICATION_TYPES = [
  "equipmentRequest",
  "jobRequest",
  "contactMessage",
  "system",
];

const NOTIFICATION_REFERENCE_MODELS = [
  "EquipmentRequest",
  "JobRequest",
  "ContactMessage",
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
    | Recipient
    |--------------------------------------------------------------------------
    */

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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
        default: null,
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Extra Data
    |--------------------------------------------------------------------------
    */

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
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

    expiresAt: {
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
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  type: 1,
  createdAt: -1,
});

notificationSchema.index({
  "reference.model": 1,
  "reference.id": 1,
});

notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  Notification,
  NOTIFICATION_TYPES,
  NOTIFICATION_REFERENCE_MODELS,
};
