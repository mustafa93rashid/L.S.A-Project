import { z } from 'zod'


const SLUG_REGEX =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/


// =====================================================
// Shared
// =====================================================

const highlightItemSchema = z
  .string()
  .trim()
  .min(
    1,
    'Highlight cannot be empty.',
  )
  .max(
    150,
    'Highlight must not exceed 150 characters.',
  )


const capabilityItemSchema = z
  .string()
  .trim()
  .min(
    1,
    'Capability item cannot be empty.',
  )
  .max(
    200,
    'Capability item must not exceed 200 characters.',
  )


// =====================================================
// Service Card
// =====================================================

const highlightsSchema = z
  .array(
    highlightItemSchema,
  )
  .min(
    1,
    'At least one highlight is required.',
  )
  .max(
    10,
    'At most 10 highlights are allowed.',
  )


const serviceCardSchema =
  z.object({
    label: z
      .string()
      .trim()
      .min(
        2,
        'Card label must contain at least 2 characters.',
      )
      .max(
        100,
        'Card label must not exceed 100 characters.',
      ),

    description: z
      .string()
      .trim()
      .min(
        10,
        'Card description must contain at least 10 characters.',
      )
      .max(
        1000,
        'Card description must not exceed 1000 characters.',
      ),

    highlights:
      highlightsSchema,

    imageAlt: z
      .string()
      .trim()
      .max(
        250,
        'Image alt text must not exceed 250 characters.',
      )
      .optional(),
  })


// =====================================================
// Hero Section
// =====================================================

const heroSectionSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        'Hero title must contain at least 2 characters.',
      )
      .max(
        150,
        'Hero title must not exceed 150 characters.',
      ),

    description: z
      .string()
      .trim()
      .min(
        10,
        'Hero description must contain at least 10 characters.',
      )
      .max(
        1500,
        'Hero description must not exceed 1500 characters.',
      ),

    imageAlt: z
      .string()
      .trim()
      .max(
        250,
        'Image alt text must not exceed 250 characters.',
      )
      .optional(),
  })


// =====================================================
// Delivery Process
// =====================================================

const deliveryStepSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        'Step title must contain at least 2 characters.',
      )
      .max(
        100,
        'Step title must not exceed 100 characters.',
      ),

    description: z
      .string()
      .trim()
      .min(
        5,
        'Step description must contain at least 5 characters.',
      )
      .max(
        1000,
        'Step description must not exceed 1000 characters.',
      ),

    icon: z
      .string()
      .trim()
      .min(
        2,
        'Step icon is required.',
      )
      .max(
        100,
        'Step icon must not exceed 100 characters.',
      ),
  })


const deliveryProcessSectionSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        'Section title must contain at least 2 characters.',
      )
      .max(
        150,
        'Section title must not exceed 150 characters.',
      ),

    description: z
      .string()
      .trim()
      .min(
        10,
        'Section description must contain at least 10 characters.',
      )
      .max(
        1500,
        'Section description must not exceed 1500 characters.',
      ),

    steps: z
      .array(
        deliveryStepSchema,
      )
      .min(
        1,
        'At least one delivery step is required.',
      )
      .max(
        12,
        'At most 12 delivery steps are allowed.',
      ),
  })


// =====================================================
// Capabilities
// =====================================================

const capabilitiesItemsSchema =
  z
    .array(
      capabilityItemSchema,
    )
    .min(
      1,
      'At least one capability item is required.',
    )
    .max(
      20,
      'At most 20 capability items are allowed.',
    )


const tableCellSchema = z
  .string()
  .trim()
  .min(
    1,
    'Table cell cannot be empty.',
  )
  .max(
    250,
    'Table cell must not exceed 250 characters.',
  )


const tableRowSchema =
  z.object({
    cells: z.array(
      tableCellSchema,
    ),
  })


const tableHeaderSchema = z
  .string()
  .trim()
  .min(
    1,
    'Column header cannot be empty.',
  )
  .max(
    150,
    'Column header must not exceed 150 characters.',
  )


const capabilitiesSectionSchema =
  z
    .object({
      title: z
        .string()
        .trim()
        .min(
          2,
          'Capabilities title must contain at least 2 characters.',
        )
        .max(
          150,
          'Capabilities title must not exceed 150 characters.',
        ),

      description: z
        .string()
        .trim()
        .min(
          10,
          'Capabilities description must contain at least 10 characters.',
        )
        .max(
          1500,
          'Capabilities description must not exceed 1500 characters.',
        ),

      items:
        capabilitiesItemsSchema,

      table: z.object({
        headers: z
          .array(
            tableHeaderSchema,
          )
          .min(
            1,
            'At least one column header is required.',
          )
          .max(
            10,
            'At most 10 columns are allowed.',
          ),

        rows: z
          .array(
            tableRowSchema,
          )
          .max(
            30,
            'At most 30 rows are allowed.',
          ),
      }),
    })
    .refine(
      (data) =>
        data.table.rows.every(
          (row) =>
            row.cells
              .length ===
            data.table
              .headers
              .length,
        ),
      {
        message:
          'Each row must have a value for every column.',
        path: [
          'table',
          'rows',
        ],
      },
    )


// =====================================================
// Home Capability
// =====================================================

const homeCapabilitySchema =
  z
    .object({
      isVisible:
        z.boolean(),

      title: z
        .string()
        .trim()
        .max(
          150,
          'Home title must not exceed 150 characters.',
        )
        .optional(),

      shortDescription:
        z
          .string()
          .trim()
          .max(
            500,
            'Home short description must not exceed 500 characters.',
          )
          .optional(),

      displayOrder: z
        .number()
        .int(
          'Display order must be a whole number.',
        )
        .min(
          0,
          'Display order cannot be negative.',
        ),
    })
    .refine(
      (data) =>
        !data.isVisible ||
        (
          data.title ??
          ''
        ).trim()
          .length >= 2,
      {
        message:
          'Title is required when shown in Home Capabilities.',
        path: [
          'title',
        ],
      },
    )
    .refine(
      (data) =>
        !data.isVisible ||
        (
          data.shortDescription ??
          ''
        ).trim()
          .length >=
          10,
      {
        message:
          'Short description (10+ characters) is required when shown in Home Capabilities.',
        path: [
          'shortDescription',
        ],
      },
    )


// =====================================================
// Service
// =====================================================

export const serviceSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        'Service title must contain at least 2 characters.',
      )
      .max(
        150,
        'Service title must not exceed 150 characters.',
      ),

    slug: z
      .string()
      .trim()
      .min(
        1,
        'Slug is required.',
      )
      .regex(
        SLUG_REGEX,
        'Slug must contain lowercase letters, numbers, and hyphens only.',
      ),

    serviceCard:
      serviceCardSchema,

    heroSection:
      heroSectionSchema,

    deliveryProcessSection:
      deliveryProcessSectionSchema,

    capabilitiesSection:
      capabilitiesSectionSchema,

    homeCapability:
      homeCapabilitySchema,

    displayOrder: z
      .number()
      .int(
        'Display order must be a whole number.',
      )
      .min(
        0,
        'Display order cannot be negative.',
      )
      .max(
        999,
        'Display order must not exceed 999.',
      )
      .optional(),

    isActive:
      z.boolean()
        .optional(),
  })


export type ServiceInput =
  z.infer<
    typeof serviceSchema
  >