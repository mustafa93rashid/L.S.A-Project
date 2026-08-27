const mongoose = require("mongoose");

// ==================== Contact Message Constants ====================

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

const CONTACT_MESSAGE_STATUSES = ["new", "read", "replied", "archived"];

// ==================== Contact Message Schema ====================

const contactMessageSchema = new mongoose.Schema(
  {
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

        // ==================== Idempotency ====================

    clientRequestId: {
      type: String,
      required: true,
      trim: true,
    },

    // ==================== Inquiry Information ====================

    service: {
      type: String,
      enum: CONTACT_MESSAGE_SERVICES,
      required: true,
      default: "General Inquiry",
    },

    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    // ==================== Request Status ====================

    status: {
      type: String,
      enum: CONTACT_MESSAGE_STATUSES,
      required: true,
      default: "new",
    },

    // ==================== Status Timeline ====================

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

    // ==================== Customer Email Tracking ====================

    customerEmailSent: {
      type: Boolean,
      default: false,
    },

    customerEmailSentAt: {
      type: Date,
      default: null,
    },

    // ==================== Dashboard Notification Tracking ====================

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

contactMessageSchema.index(
  {
    clientRequestId: 1,
  },
  {
    unique: true,
    name: "contact_message_client_request_id_unique",
  },
);

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

contactMessageSchema.index({
  fullName: "text",
  email: "text",
  phone: "text",
  projectDescription: "text",
});

// ==================== Contact Message Model ====================

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);

// ==================== Exports ====================

module.exports = {
  ContactMessage,
  CONTACT_MESSAGE_SERVICES,
  CONTACT_MESSAGE_STATUSES,
};
