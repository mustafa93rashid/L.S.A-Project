import { z } from 'zod'

/** Mirrors Backend/src/validation/equipment.validate.js exactly. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const equipmentSchema = z
  .object({
    title: z.string().trim().min(2).max(150, 'Title must be at most 150 characters.'),
    slug: z
      .string()
      .trim()
      .regex(
        SLUG_REGEX,
        'Slug must contain lowercase letters, numbers, and hyphens only.',
      ),
    category: z.string().trim().min(1, 'Category is required.'),
    shortDescription: z
      .string()
      .trim()
      .min(10, 'Short description must be at least 10 characters.')
      .max(500),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters.')
      .max(5000),
    specLabel: z.string().trim().min(2, 'Specification label is required.').max(100),
    specValue: z.string().trim().min(1, 'Specification value is required.').max(150),
    location: z.string().trim().min(2).max(150),
    availableUnits: z.number().int().min(0).max(99999),
    safetyAvailable: z.boolean(),
    safetyMessage: z.string().trim().max(500).optional(),
    displayOrder: z.number().int().min(0).max(999).optional(),
    isActive: z.boolean().optional(),
    imageAlt: z.string().trim().max(250).optional(),
  })
  .refine((data) => !data.safetyAvailable || (data.safetyMessage ?? '').length > 0, {
    message: 'A message is required when the safety certificate is available.',
    path: ['safetyMessage'],
  })

export type EquipmentInput = z.infer<typeof equipmentSchema>
