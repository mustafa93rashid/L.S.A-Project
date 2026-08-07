import { z } from 'zod'

/** Mirrors Backend/src/validation/teamMember.validate.js exactly. */
export const teamMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(32, 'Full name must be at most 32 characters.'),
  position: z.string().trim().min(2).max(32, 'Position must be at most 32 characters.'),
  experience: z
    .string()
    .trim()
    .min(2, 'Experience is required.')
    .max(15, 'Experience must be at most 15 characters.'),
  displayOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
})

export type TeamMemberInput = z.infer<typeof teamMemberSchema>
