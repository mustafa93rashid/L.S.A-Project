const {
  body,
  param,
} = require("express-validator");

const validate = require(
  "../middlewares/validate",
);

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const slugRegex =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;



/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const parseJson = (
  fieldName,
  expectedType,
) => {
  return body(fieldName)
    .customSanitizer((value) => {
      if (value === undefined) {
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
      if (value === undefined) {
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

const validateStringArray = (
  value,
  fieldName,
) => {
  if (!Array.isArray(value)) {
    throw new Error(
      `${fieldName} must be an array.`,
    );
  }

  const hasInvalidItem = value.some(
    (item) =>
      typeof item !== "string" ||
      item.trim().length === 0,
  );

  if (hasInvalidItem) {
    throw new Error(
      `${fieldName} must contain non-empty strings only.`,
    );
  }

  return true;
};

const validateProcessSection = (
  value,
) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "processSection must be an object.",
    );
  }

  if (!value.title?.trim()) {
    throw new Error(
      "processSection.title is required.",
    );
  }

  if (!value.description?.trim()) {
    throw new Error(
      "processSection.description is required.",
    );
  }

  if (!Array.isArray(value.steps)) {
    throw new Error(
      "processSection.steps must be an array.",
    );
  }

  value.steps.forEach((step, index) => {
    if (
      typeof step !== "object" ||
      step === null ||
      Array.isArray(step)
    ) {
      throw new Error(
        `processSection.steps.${index} must be an object.`,
      );
    }

    if (!step.title?.trim()) {
      throw new Error(
        `processSection.steps.${index}.title is required.`,
      );
    }

    if (!step.description?.trim()) {
      throw new Error(
        `processSection.steps.${index}.description is required.`,
      );
    }

    if (!step.icon?.trim()) {
      throw new Error(
        `processSection.steps.${index}.icon is required.`,
      );
    }

if (
  typeof step.icon !== "string" ||
  !step.icon.trim()
) {
  throw new Error(
    `processSection.steps.${index}.icon is required.`,
  );
}
  });

  return true;
};

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

  if (!value.title?.trim()) {
    throw new Error(
      "capabilitiesSection.title is required.",
    );
  }

  if (!value.description?.trim()) {
    throw new Error(
      "capabilitiesSection.description is required.",
    );
  }

  validateStringArray(
    value.items,
    "capabilitiesSection.items",
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
  );

  if (
    !Array.isArray(value.table.rows)
  ) {
    throw new Error(
      "capabilitiesSection.table.rows must be an array.",
    );
  }

  value.table.rows.forEach(
    (row, index) => {
      if (
        typeof row !== "object" ||
        row === null ||
        Array.isArray(row)
      ) {
        throw new Error(
          `capabilitiesSection.table.rows.${index} must be an object.`,
        );
      }

      validateStringArray(
        row.cells,
        `capabilitiesSection.table.rows.${index}.cells`,
      );

      if (
        row.cells.length !==
        value.table.headers.length
      ) {
        throw new Error(
          `capabilitiesSection.table.rows.${index}.cells count must match the headers count.`,
        );
      }
    },
  );

  return true;
};

/*
|--------------------------------------------------------------------------
| Shared Fields
|--------------------------------------------------------------------------
*/

const titleValidation = body("title")
  .isString()
  .withMessage(
    "Service title must be a string.",
  )
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

const slugFieldValidation =
  body("slug")
    .isString()
    .withMessage(
      "Service slug must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Service slug is required.",
    )
    .matches(slugRegex)
    .withMessage(
      "Service slug must contain lowercase letters, numbers, and hyphens only.",
    );

const categoryLabelValidation =
  body("categoryLabel")
    .isString()
    .withMessage(
      "Category label must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Category label is required.",
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Category label must be between 2 and 100 characters.",
    );

const shortDescriptionValidation =
  body("shortDescription")
    .isString()
    .withMessage(
      "Short description must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Short description is required.",
    )
    .isLength({
      min: 10,
      max: 1000,
    })
    .withMessage(
      "Short description must be between 10 and 1000 characters.",
    );

const heroTitleValidation =
  body("heroTitle")
    .isString()
    .withMessage(
      "Hero title must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Hero title is required.",
    )
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Hero title must be between 2 and 150 characters.",
    );

const heroDescriptionValidation =
  body("heroDescription")
    .isString()
    .withMessage(
      "Hero description must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Hero description is required.",
    )
    .isLength({
      min: 10,
      max: 1500,
    })
    .withMessage(
      "Hero description must be between 10 and 1500 characters.",
    );

    const highlightsValidation = [
  parseJson("highlights", "array"),

  body("highlights").custom((value) =>
    validateStringArray(
      value,
      "highlights",
    ),
  ),
];

const processSectionValidation = [
  parseJson(
    "processSection",
    "object",
  ),

  body("processSection").custom(
    validateProcessSection,
  ),
];

const capabilitiesSectionValidation = [
  parseJson(
    "capabilitiesSection",
    "object",
  ),

  body("capabilitiesSection").custom(
    validateCapabilitiesSection,
  ),
];

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

const isFeaturedValidation = body(
  "isFeatured",
)
  .optional()
  .isBoolean()
  .withMessage(
    "isFeatured must be true or false.",
  )
  .toBoolean();

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

  categoryLabelValidation,

  shortDescriptionValidation,

  heroTitleValidation,

  heroDescriptionValidation,

  ...highlightsValidation,

  ...processSectionValidation,

  ...capabilitiesSectionValidation,

  displayOrderValidation,

  isFeaturedValidation,

  isActiveValidation,

  validate,
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
    .matches(slugRegex)
    .withMessage(
      "Service slug must contain lowercase letters, numbers, and hyphens only.",
    ),

  body("categoryLabel")
    .optional()
    .isString()
    .withMessage(
      "Category label must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Category label cannot be empty.",
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Category label must be between 2 and 100 characters.",
    ),

  body("shortDescription")
    .optional()
    .isString()
    .withMessage(
      "Short description must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Short description cannot be empty.",
    )
    .isLength({
      min: 10,
      max: 1000,
    })
    .withMessage(
      "Short description must be between 10 and 1000 characters.",
    ),

  body("heroTitle")
    .optional()
    .isString()
    .withMessage(
      "Hero title must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Hero title cannot be empty.",
    )
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Hero title must be between 2 and 150 characters.",
    ),

  body("heroDescription")
    .optional()
    .isString()
    .withMessage(
      "Hero description must be a string.",
    )
    .notEmpty()
    .withMessage(
      "Hero description cannot be empty.",
    )
    .isLength({
      min: 10,
      max: 1500,
    })
    .withMessage(
      "Hero description must be between 10 and 1500 characters.",
    ),

  parseJson("highlights", "array")
    .optional(),

  body("highlights")
    .optional()
    .custom((value) =>
      validateStringArray(
        value,
        "highlights",
      ),
    ),

  parseJson(
    "processSection",
    "object",
  ).optional(),

  body("processSection")
    .optional()
    .custom(validateProcessSection),

  parseJson(
    "capabilitiesSection",
    "object",
  ).optional(),

  body("capabilitiesSection")
    .optional()
    .custom(
      validateCapabilitiesSection,
    ),

  displayOrderValidation,

  isFeaturedValidation,

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