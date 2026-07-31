const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
|--------------------------------------------------------------------------
| JSON Field Parser
|--------------------------------------------------------------------------
*/

const parseJsonField = (fieldName, expectedType) => {
  return body(fieldName)
    .customSanitizer((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch {
        throw new Error(
          `${fieldName} must contain valid JSON.`,
        );
      }
    })
    .custom((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return true;
      }

      if (
        expectedType === "array" &&
        !Array.isArray(value)
      ) {
        throw new Error(
          `${fieldName} must be an array.`,
        );
      }

      if (
        expectedType === "object" &&
        (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        )
      ) {
        throw new Error(
          `${fieldName} must be an object.`,
        );
      }

      return true;
    });
};

/*
|--------------------------------------------------------------------------
| Shared Helpers
|--------------------------------------------------------------------------
*/

const validateNonEmptyString = (
  value,
  fieldName,
  {
    min = 1,
    max = 1000,
  } = {},
) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} must be a non-empty string.`,
    );
  }

  const normalizedValue = value.trim();

  if (
    normalizedValue.length < min ||
    normalizedValue.length > max
  ) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max} characters.`,
    );
  }

  return true;
};

const validateStringArray = (
  value,
  fieldName,
  {
    minItems = 0,
    maxItems = 20,
    itemMaxLength = 250,
  } = {},
) => {
  if (!Array.isArray(value)) {
    throw new Error(
      `${fieldName} must be an array.`,
    );
  }

  if (
    value.length < minItems ||
    value.length > maxItems
  ) {
    throw new Error(
      `${fieldName} must contain between ${minItems} and ${maxItems} items.`,
    );
  }

  value.forEach((item, index) => {
    validateNonEmptyString(
      item,
      `${fieldName}.${index}`,
      {
        min: 1,
        max: itemMaxLength,
      },
    );
  });

  return true;
};

/*
|--------------------------------------------------------------------------
| Service Card Validation
|--------------------------------------------------------------------------
*/

const validateServiceCard = (value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "serviceCard must be an object.",
    );
  }

  validateNonEmptyString(
    value.label,
    "serviceCard.label",
    {
      min: 2,
      max: 100,
    },
  );

  validateNonEmptyString(
    value.description,
    "serviceCard.description",
    {
      min: 10,
      max: 1000,
    },
  );

  validateStringArray(
    value.highlights,
    "serviceCard.highlights",
    {
      minItems: 1,
      maxItems: 10,
      itemMaxLength: 150,
    },
  );

  if (value.imageAlt !== undefined) {
    validateNonEmptyString(
      value.imageAlt,
      "serviceCard.imageAlt",
      {
        min: 2,
        max: 250,
      },
    );
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Hero Section Validation
|--------------------------------------------------------------------------
*/

const validateHeroSection = (value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "heroSection must be an object.",
    );
  }

  validateNonEmptyString(
    value.title,
    "heroSection.title",
    {
      min: 2,
      max: 150,
    },
  );

  validateNonEmptyString(
    value.description,
    "heroSection.description",
    {
      min: 10,
      max: 1500,
    },
  );

  if (value.imageAlt !== undefined) {
    validateNonEmptyString(
      value.imageAlt,
      "heroSection.imageAlt",
      {
        min: 2,
        max: 250,
      },
    );
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Delivery Process Validation
|--------------------------------------------------------------------------
*/

const validateDeliveryProcessSection = (
  value,
) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "deliveryProcessSection must be an object.",
    );
  }

  validateNonEmptyString(
    value.title,
    "deliveryProcessSection.title",
    {
      min: 2,
      max: 150,
    },
  );

  validateNonEmptyString(
    value.description,
    "deliveryProcessSection.description",
    {
      min: 10,
      max: 1500,
    },
  );

  if (!Array.isArray(value.steps)) {
    throw new Error(
      "deliveryProcessSection.steps must be an array.",
    );
  }

  if (
    value.steps.length < 1 ||
    value.steps.length > 12
  ) {
    throw new Error(
      "deliveryProcessSection.steps must contain between 1 and 12 steps.",
    );
  }

  value.steps.forEach((step, index) => {
    if (
      typeof step !== "object" ||
      step === null ||
      Array.isArray(step)
    ) {
      throw new Error(
        `deliveryProcessSection.steps.${index} must be an object.`,
      );
    }

    validateNonEmptyString(
      step.title,
      `deliveryProcessSection.steps.${index}.title`,
      {
        min: 2,
        max: 100,
      },
    );

    validateNonEmptyString(
      step.description,
      `deliveryProcessSection.steps.${index}.description`,
      {
        min: 5,
        max: 1000,
      },
    );

    validateNonEmptyString(
      step.icon,
      `deliveryProcessSection.steps.${index}.icon`,
      {
        min: 2,
        max: 100,
      },
    );
  });

  return true;
};

/*
|--------------------------------------------------------------------------
| Capabilities Section Validation
|--------------------------------------------------------------------------
*/

const validateCapabilitiesSection = (
  value,
) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "capabilitiesSection must be an object.",
    );
  }

  validateNonEmptyString(
    value.title,
    "capabilitiesSection.title",
    {
      min: 2,
      max: 150,
    },
  );

  validateNonEmptyString(
    value.description,
    "capabilitiesSection.description",
    {
      min: 10,
      max: 1500,
    },
  );

  validateStringArray(
    value.items,
    "capabilitiesSection.items",
    {
      minItems: 1,
      maxItems: 20,
      itemMaxLength: 200,
    },
  );

  if (
    typeof value.table !== "object" ||
    value.table === null ||
    Array.isArray(value.table)
  ) {
    throw new Error(
      "capabilitiesSection.table must be an object.",
    );
  }

  validateStringArray(
    value.table.headers,
    "capabilitiesSection.table.headers",
    {
      minItems: 1,
      maxItems: 10,
      itemMaxLength: 150,
    },
  );

  if (!Array.isArray(value.table.rows)) {
    throw new Error(
      "capabilitiesSection.table.rows must be an array.",
    );
  }

  if (value.table.rows.length > 30) {
    throw new Error(
      "capabilitiesSection.table.rows cannot contain more than 30 rows.",
    );
  }

  value.table.rows.forEach(
    (row, rowIndex) => {
      if (
        typeof row !== "object" ||
        row === null ||
        Array.isArray(row)
      ) {
        throw new Error(
          `capabilitiesSection.table.rows.${rowIndex} must be an object.`,
        );
      }

      validateStringArray(
        row.cells,
        `capabilitiesSection.table.rows.${rowIndex}.cells`,
        {
          minItems:
            value.table.headers.length,

          maxItems:
            value.table.headers.length,

          itemMaxLength: 250,
        },
      );

      if (
        row.cells.length !==
        value.table.headers.length
      ) {
        throw new Error(
          `capabilitiesSection.table.rows.${rowIndex}.cells count must match the table headers count.`,
        );
      }
    },
  );

  return true;
};

/*
|--------------------------------------------------------------------------
| Home Capability Validation
|--------------------------------------------------------------------------
*/

const validateHomeCapability = (value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "homeCapability must be an object.",
    );
  }

  if (
    typeof value.isVisible !== "boolean"
  ) {
    throw new Error(
      "homeCapability.isVisible must be true or false.",
    );
  }

  if (value.isVisible) {
    validateNonEmptyString(
      value.title,
      "homeCapability.title",
      {
        min: 2,
        max: 150,
      },
    );

    validateNonEmptyString(
      value.shortDescription,
      "homeCapability.shortDescription",
      {
        min: 10,
        max: 500,
      },
    );
  } else {
    if (
      value.title !== undefined &&
      value.title !== ""
    ) {
      validateNonEmptyString(
        value.title,
        "homeCapability.title",
        {
          min: 2,
          max: 150,
        },
      );
    }

    if (
      value.shortDescription !==
        undefined &&
      value.shortDescription !== ""
    ) {
      validateNonEmptyString(
        value.shortDescription,
        "homeCapability.shortDescription",
        {
          min: 10,
          max: 500,
        },
      );
    }
  }

  if (
    !Number.isInteger(
      value.displayOrder,
    ) ||
    value.displayOrder < 0
  ) {
    throw new Error(
      "homeCapability.displayOrder must be a non-negative integer.",
    );
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Required Images Validation
|--------------------------------------------------------------------------
*/

const requiredServiceImagesValidation = (
  req,
  res,
  next,
) => {
  const cardImage =
    req.files?.cardImage?.[0];

  const heroImage =
    req.files?.heroImage?.[0];

  const errors = [];

  if (!cardImage) {
    errors.push({
      field: "cardImage",
      message:
        "Service card image is required.",
    });
  }

  if (!heroImage) {
    errors.push({
      field: "heroImage",
      message:
        "Service hero image is required.",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  return next();
};

/*
|--------------------------------------------------------------------------
| Shared Body Fields
|--------------------------------------------------------------------------
*/

const titleValidation = body("title")
  .isString()
  .withMessage(
    "Service title must be a string.",
  )
  .bail()
  .trim()
  .notEmpty()
  .withMessage(
    "Service title is required.",
  )
  .isLength({
    min: 2,
    max: 150,
  })
  .withMessage(
    "Service title must be between 2 and 150 characters.",
  );

const slugFieldValidation = body("slug")
  .isString()
  .withMessage(
    "Service slug must be a string.",
  )
  .bail()
  .trim()
  .notEmpty()
  .withMessage(
    "Service slug is required.",
  )
  .matches(slugRegex)
  .withMessage(
    "Service slug must contain lowercase letters, numbers, and hyphens only.",
  );

const displayOrderValidation = body(
  "displayOrder",
)
  .optional()
  .isInt({
    min: 0,
  })
  .withMessage(
    "Display order must be a non-negative integer.",
  )
  .toInt();

const isActiveValidation = body(
  "isActive",
)
  .optional()
  .isBoolean()
  .withMessage(
    "isActive must be true or false.",
  )
  .toBoolean();

/*
|--------------------------------------------------------------------------
| Create Service Validation
|--------------------------------------------------------------------------
*/

const createServiceValidation = [
  titleValidation,

  slugFieldValidation,

  parseJsonField(
    "serviceCard",
    "object",
  ),

  body("serviceCard")
    .notEmpty()
    .withMessage(
      "serviceCard is required.",
    )
    .bail()
    .custom(validateServiceCard),

  parseJsonField(
    "heroSection",
    "object",
  ),

  body("heroSection")
    .notEmpty()
    .withMessage(
      "heroSection is required.",
    )
    .bail()
    .custom(validateHeroSection),

  parseJsonField(
    "deliveryProcessSection",
    "object",
  ),

  body("deliveryProcessSection")
    .notEmpty()
    .withMessage(
      "deliveryProcessSection is required.",
    )
    .bail()
    .custom(
      validateDeliveryProcessSection,
    ),

  parseJsonField(
    "capabilitiesSection",
    "object",
  ),

  body("capabilitiesSection")
    .notEmpty()
    .withMessage(
      "capabilitiesSection is required.",
    )
    .bail()
    .custom(
      validateCapabilitiesSection,
    ),

  parseJsonField(
    "homeCapability",
    "object",
  ),

  body("homeCapability")
    .notEmpty()
    .withMessage(
      "homeCapability is required.",
    )
    .bail()
    .custom(validateHomeCapability),

  displayOrderValidation,

  isActiveValidation,

  validate,

  requiredServiceImagesValidation,
];

/*
|--------------------------------------------------------------------------
| Update Service Validation
|--------------------------------------------------------------------------
*/

const updateServiceValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage(
      "Service title must be a string.",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Service title cannot be empty.",
    )
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Service title must be between 2 and 150 characters.",
    ),

  body("slug")
    .optional()
    .isString()
    .withMessage(
      "Service slug must be a string.",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Service slug cannot be empty.",
    )
    .matches(slugRegex)
    .withMessage(
      "Service slug must contain lowercase letters, numbers, and hyphens only.",
    ),

  parseJsonField(
    "serviceCard",
    "object",
  ).optional(),

  body("serviceCard")
    .optional()
    .custom(validateServiceCard),

  parseJsonField(
    "heroSection",
    "object",
  ).optional(),

  body("heroSection")
    .optional()
    .custom(validateHeroSection),

  parseJsonField(
    "deliveryProcessSection",
    "object",
  ).optional(),

  body("deliveryProcessSection")
    .optional()
    .custom(
      validateDeliveryProcessSection,
    ),

  parseJsonField(
    "capabilitiesSection",
    "object",
  ).optional(),

  body("capabilitiesSection")
    .optional()
    .custom(
      validateCapabilitiesSection,
    ),

  parseJsonField(
    "homeCapability",
    "object",
  ).optional(),

  body("homeCapability")
    .optional()
    .custom(validateHomeCapability),

  displayOrderValidation,

  isActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Route Parameters Validation
|--------------------------------------------------------------------------
*/

const idValidation = [
  param("id")
    .isMongoId()
    .withMessage(
      "Invalid service ID.",
    ),

  validate,
];

const slugValidation = [
  param("slug")
    .trim()
    .matches(slugRegex)
    .withMessage(
      "Invalid service slug.",
    ),

  validate,
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createServiceValidation,
  updateServiceValidation,
  idValidation,
  slugValidation,
};