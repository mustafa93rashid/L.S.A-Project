const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const JOB_STATUSES = [
  "draft",
  "published",
  "closed",
];

const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Temporary",
  "Internship",
];

const JOB_DEPARTMENTS = [
  "Engineering",
  "Mechanical",
  "Electrical",
  "Instrumentation",
  "Civil",
  "HSE",
  "Operations",
  "Maintenance",
  "Administration",
  "Procurement",
  "Finance",
  "Human Resources",
  "Information Technology",
  "Other",
];

/*
|--------------------------------------------------------------------------
| Job Schema
|--------------------------------------------------------------------------
*/

const jobSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Basic Information
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },

    /*
    |--------------------------------------------------------------------------
    | Job Details
    |--------------------------------------------------------------------------
    */

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    employmentType: {
      type: String,
      required: true,
      enum: EMPLOYMENT_TYPES,
    },

    department: {
      type: String,
      required: true,
      enum: JOB_DEPARTMENTS,
    },

    /*
    |--------------------------------------------------------------------------
    | Responsibilities
    |--------------------------------------------------------------------------
    */

    responsibilities: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 300,
        },
      ],

      validate: {
        validator: (value) =>
          value.length > 0,

        message:
          "At least one responsibility is required.",
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Requirements
    |--------------------------------------------------------------------------
    */

    requirements: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 300,
        },
      ],

      validate: {
        validator: (value) =>
          value.length > 0,

        message:
          "At least one requirement is required.",
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Publishing
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "draft",
      index: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    publishedAt: {
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
      required: true,
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

jobSchema.index({
  status: 1,
  publishedAt: -1,
});

jobSchema.index({
  department: 1,
  status: 1,
});

jobSchema.index({
  employmentType: 1,
  status: 1,
});

jobSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
  location: "text",
  department: "text",
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Job =
  mongoose.models.Job ||
  mongoose.model(
    "Job",
    jobSchema,
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  Job,
  JOB_STATUSES,
  EMPLOYMENT_TYPES,
  JOB_DEPARTMENTS,
};