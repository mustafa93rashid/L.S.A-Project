const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const JOB_REQUEST_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "accepted",
  "rejected",
  "ignored",
];

/*
|--------------------------------------------------------------------------
| Job Request Schema
|--------------------------------------------------------------------------
*/

const jobRequestSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Job
    |--------------------------------------------------------------------------
    */

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Applicant Information
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CV
    |--------------------------------------------------------------------------
    */

    cv: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },

      originalName: {
        type: String,
        required: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Request Status
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: JOB_REQUEST_STATUSES,
      default: "new",
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Timeline
    |--------------------------------------------------------------------------
    */

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
| Indexes
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const JobRequest =
  mongoose.models.JobRequest ||
  mongoose.model(
    "JobRequest",
    jobRequestSchema,
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  JobRequest,
  JOB_REQUEST_STATUSES,
};