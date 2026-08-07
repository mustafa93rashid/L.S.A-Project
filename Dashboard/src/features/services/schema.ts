import { z } from 'zod'

/** Mirrors Backend/src/validation/service.validate.js exactly. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const highlightsSchema = z
  .array(z.string().trim().min(1).max(150))
  .min(1, 'At least one highlight is required.')
  .max(10, 'At most 10 highlights are allowed.')

const serviceCardSchema = z.object({
  label: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1000),
  highlights: highlightsSchema,
  imageAlt: z.string().trim().max(250).optional(),
})

const heroSectionSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(1500),
  imageAlt: z.string().trim().max(250).optional(),
})

const deliveryStepSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(1000),
  icon: z.string().trim().min(2).max(100),
})

const deliveryProcessSectionSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(1500),
  steps: z
    .array(deliveryStepSchema)
    .min(1, 'At least one delivery step is required.')
    .max(12, 'At most 12 delivery steps are allowed.'),
})

const capabilitiesItemsSchema = z
  .array(z.string().trim().min(1).max(200))
  .min(1, 'At least one capability item is required.')
  .max(20, 'At most 20 capability items are allowed.')

const tableRowSchema = z.object({
  cells: z.array(z.string().trim().min(1).max(250)),
})

const capabilitiesSectionSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().min(10).max(1500),
    items: capabilitiesItemsSchema,
    table: z.object({
      headers: z
        .array(z.string().trim().min(1).max(150))
        .min(1, 'At least one column header is required.')
        .max(10, 'At most 10 columns are allowed.'),
      rows: z.array(tableRowSchema).max(30, 'At most 30 rows are allowed.'),
    }),
  })
  .refine(
    (data) =>
      data.table.rows.every((row) => row.cells.length === data.table.headers.length),
    {
      message: 'Each row must have a value for every column.',
      path: ['table', 'rows'],
    },
  )

const homeCapabilitySchema = z
  .object({
    isVisible: z.boolean(),
    title: z.string().trim().max(150).optional(),
    shortDescription: z.string().trim().max(500).optional(),
    displayOrder: z.number().int().min(0),
  })
  .refine((data) => !data.isVisible || (data.title ?? '').trim().length >= 2, {
    message: 'Title is required when shown in Home Capabilities.',
    path: ['title'],
  })
  .refine(
    (data) => !data.isVisible || (data.shortDescription ?? '').trim().length >= 10,
    {
      message:
        'Short description (10+ characters) is required when shown in Home Capabilities.',
      path: ['shortDescription'],
    },
  )

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .regex(SLUG_REGEX, 'Slug must contain lowercase letters, numbers, and hyphens only.'),
  serviceCard: serviceCardSchema,
  heroSection: heroSectionSchema,
  deliveryProcessSection: deliveryProcessSectionSchema,
  capabilitiesSection: capabilitiesSectionSchema,
  homeCapability: homeCapabilitySchema,
  displayOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
