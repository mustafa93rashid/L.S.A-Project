const mongoose = require("mongoose");

// ==================== Equipment Request Statuses ====================

const EQUIPMENT_REQUEST_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "approved",
  "rejected",
  "completed",
];

// ==================== Equipment Request Schema ====================

const equipmentRequestSchema = new mongoose.Schema(
  {
    // ==================== Requested Equipment ====================

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    // ==================== Customer Information ====================

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
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // ==================== Work Information ====================

    workLocation: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 250,
    },

    estimatedRequiredDays: {
      type: Number,
      required: true,
      min: 1,
      max: 3650,

      validate: {
        validator: Number.isInteger,
        message: "Estimated required days must be an integer",
      },
    },

    workDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    // ==================== Request Status ====================

    status: {
      type: String,
      enum: EQUIPMENT_REQUEST_STATUSES,
      required: true,
      default: "new",
    },

    // ==================== Timeline ====================

    contactedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ==================== Email Tracking ====================

    customerEmailSent: {
      type: Boolean,
      default: false,
    },

    customerEmailSentAt: {
      type: Date,
      default: null,
    },

    // ==================== Notification Tracking ====================

    dashboardNotificationCreated: {
      type: Boolean,
      default: false,
    },

    dashboardNotificationCreatedAt: {
      type: Date,
      default: null,
    },

    // ==================== Audit Information ====================

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

// ==================== Indexes ====================

equipmentRequestSchema.index({
  status: 1,
  createdAt: -1,
});

equipmentRequestSchema.index({
  equipment: 1,
  createdAt: -1,
});

equipmentRequestSchema.index({
  email: 1,
  createdAt: -1,
});

// ==================== Equipment Request Model ====================

const EquipmentRequest =
  mongoose.models.EquipmentRequest ||
  mongoose.model("EquipmentRequest", equipmentRequestSchema);

// ==================== Exports ====================

module.exports = {
  EquipmentRequest,
  EQUIPMENT_REQUEST_STATUSES,
};
