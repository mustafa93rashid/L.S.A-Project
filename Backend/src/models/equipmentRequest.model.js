const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EQUIPMENT_REQUEST_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "approved",
  "rejected",
  "completed",
];

/*
|--------------------------------------------------------------------------
| Email Delivery Schema
|--------------------------------------------------------------------------
|
| يحتفظ فقط بنتيجة إرسال رسالة تأكيد استلام الطلب.
| عملية الإرسال نفسها ستكون داخل Email Service.
|
*/

const emailDeliverySchema =
  new mongoose.Schema(
    {
      confirmationSent: {
        type: Boolean,
        default: false,
      },

      sentAt: {
        type: Date,
        default: null,
      },

      errorMessage: {
        type: String,
        default: null,
      },
    },
    {
      _id: false,
    },
  );

/*
|--------------------------------------------------------------------------
| Equipment Request Schema
|--------------------------------------------------------------------------
*/

const equipmentRequestSchema =
  new mongoose.Schema(
    {
      equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
      },

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

      workLocation: {
        type: String,
        required: true,
        trim: true,
        maxlength: 250,
      },

      estimatedRequiredDays: {
        type: Number,
        required: true,
        min: 1,
      },

      workDescription: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000,
      },

      status: {
        type: String,
        enum: EQUIPMENT_REQUEST_STATUSES,
        default: "new",
      },

      adminNotes: {
        type: String,
        trim: true,
        default: "",
        maxlength: 5000,
      },

      handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      contactedAt: {
        type: Date,
        default: null,
      },

      emailDelivery: {
        type: emailDeliverySchema,
        default: () => ({
          confirmationSent: false,
        }),
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

equipmentRequestSchema.index({
  status: 1,
  createdAt: -1,
});

equipmentRequestSchema.index({
  equipment: 1,
  createdAt: -1,
});

equipmentRequestSchema.index({
  handledBy: 1,
  status: 1,
});

equipmentRequestSchema.index({
  email: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const EquipmentRequest =
  mongoose.models.EquipmentRequest ||
  mongoose.model(
    "EquipmentRequest",
    equipmentRequestSchema,
  );

module.exports = {
  EquipmentRequest,
  EQUIPMENT_REQUEST_STATUSES,
};