const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const deliveryStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const capabilityTableRowSchema = new mongoose.Schema(
  {
    cells: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

/*
|--------------------------------------------------------------------------
| Service Schema
|--------------------------------------------------------------------------
*/

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Services Page Card
    |--------------------------------------------------------------------------
    |
    | تظهر هذه البيانات في الكارد الموجود في صفحة الخدمات الرئيسية.
    |
    */

    serviceCard: {
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      highlights: {
        type: [String],
        default: [],
      },

      image: {
        type: imageSchema,
        required: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Service Details Hero
    |--------------------------------------------------------------------------
    |
    | تظهر هذه البيانات في هيرو صفحة تفاصيل الخدمة.
    |
    */

    heroSection: {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      image: {
        type: imageSchema,
        required: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Delivery Process Section
    |--------------------------------------------------------------------------
    |
    | تظهر هذه البيانات في قسم خطوات تنفيذ الخدمة.
    |
    */

    deliveryProcessSection: {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      steps: {
        type: [deliveryStepSchema],
        default: [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Capabilities Section
    |--------------------------------------------------------------------------
    |
    | تظهر هذه البيانات في قسم إمكانيات الخدمة والجدول.
    |
    */

    capabilitiesSection: {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      items: {
        type: [String],
        default: [],
      },

      table: {
        headers: {
          type: [String],
          default: [],
        },

        rows: {
          type: [capabilityTableRowSchema],
          default: [],
        },
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Home Capability Card
    |--------------------------------------------------------------------------
    |
    | تظهر هذه البيانات في قسم Our Core Capabilities في الصفحة الرئيسية.
    | عند الضغط على الكارد يتم الانتقال إلى صفحة تفاصيل نفس الخدمة.
    |
    */

    homeCapability: {
      isVisible: {
        type: Boolean,
        default: false,
      },

      title: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },

      shortDescription: {
        type: String,
        trim: true,
        default: "",
        maxlength: 500,
      },

      displayOrder: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | General Settings
    |--------------------------------------------------------------------------
    */

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
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

serviceSchema.index({
  isActive: 1,
  displayOrder: 1,
});

serviceSchema.index({
  "homeCapability.isVisible": 1,
  "homeCapability.displayOrder": 1,
  isActive: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Service =
  mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);

module.exports = Service;