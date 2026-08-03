const mongoose = require("mongoose");

// ==================== Job Request Statuses ====================

const JOB_REQUEST_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "accepted",
  "rejected",
  "ignored",
];

// ==================== Job Request Schema ====================

const jobRequestSchema = new mongoose.Schema(
  {
    // ==================== Related Job ====================

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    // ==================== Applicant Information ====================

    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
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

    // ==================== CV Document ====================

    cv: {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      mimeType: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      size: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    // ==================== Request Status ====================

    status: {
      type: String,
      enum: JOB_REQUEST_STATUSES,
      required: true,
      default: "new",
    },

    // ==================== Timeline ====================

    reviewedAt: {
      type: Date,
      default: null,
    },

    shortlistedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    ignoredAt: {
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

jobRequestSchema.index({
  status: 1,
  createdAt: -1,
});

jobRequestSchema.index({
  job: 1,
  createdAt: -1,
});

jobRequestSchema.index({
  email: 1,
  createdAt: -1,
});

// ==================== Job Request Model ====================

const JobRequest =
  mongoose.models.JobRequest ||
  mongoose.model(
    "JobRequest",
    jobRequestSchema,
  );

// ==================== Exports ====================

module.exports = {
  JobRequest,
  JOB_REQUEST_STATUSES,
};