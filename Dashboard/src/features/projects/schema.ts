import { z } from 'zod'

/** Mirrors Backend/src/validation/project.validate.js and the
 * scopeItemSchema constraints enforced by Backend/src/models/project.model.js
 * (express-validator only checks detailedScope.items is an array; the
 * per-item title/description/icon lengths are Mongoose-only, so the
 * frontend validates them here too rather than letting an invalid item
 * surface as a generic 500). */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const scopeItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  icon: z.string().trim().min(1).max(100),
})

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .regex(SLUG_REGEX, 'Slug must contain lowercase letters, numbers, and hyphens only.'),
  categoryLabel: z.string().trim().min(2).max(100),
  shortDescription: z.string().trim().min(10).max(500),
  description: z.string().trim().min(20).max(5000),
  services: z.array(z.string()),
  heroTitle: z.string().trim().min(2).max(150),
  heroDescription: z.string().trim().min(10).max(1500),
  cardImageAlt: z.string().trim().max(150).optional(),
  heroImageAlt: z.string().trim().max(150).optional(),
  client: z.string().trim().max(150).optional(),
  location: z.string().trim().max(150).optional(),
  completionDate: z.string().trim().optional(),
  duration: z.string().trim().max(100).optional(),
  status: z.string().trim().max(100).optional(),
  detailedScopeTitle: z.string().trim().min(2).max(150),
  detailedScopeDescription: z.string().trim().min(10).max(1500),
  detailedScopeItems: z
    .array(scopeItemSchema)
    .max(20, 'At most 20 scope items are allowed.'),
  displayOrder: z.number().int().min(0).max(999).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>
