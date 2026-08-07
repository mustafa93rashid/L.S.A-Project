import { z } from 'zod'

/** Mirrors Backend/src/validation/equipment.validate.js's category rules. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const equipmentCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  slug: z
    .string()
    .trim()
    .regex(SLUG_REGEX, 'Slug must contain lowercase letters, numbers, and hyphens only.'),
  displayOrder: z
    .number()
    .int()
    .min(0)
    .max(999, 'Display order must be between 0 and 999.')
    .optional(),
  isActive: z.boolean().optional(),
})

export type EquipmentCategoryInput = z.infer<typeof equipmentCategorySchema>
