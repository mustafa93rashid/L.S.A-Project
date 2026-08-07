import { z } from 'zod'
import { EMPLOYMENT_TYPES, JOB_DEPARTMENTS, JOB_STATUSES } from '@/features/jobs/types'

const listItemSchema = z.string().trim().min(2, 'Cannot be empty.').max(300)

/** Mirrors Backend/src/validation/job.validate.js exactly. */
export const jobSchema = z.object({
  title: z.string().trim().min(2).max(150),
  shortDescription: z.string().trim().min(10, 'Must be at least 10 characters.').max(500),
  description: z.string().trim().min(20, 'Must be at least 20 characters.').max(5000),
  location: z.string().trim().min(2).max(150),
  employmentType: z.enum(EMPLOYMENT_TYPES, { message: 'Select an employment type.' }),
  department: z.enum(JOB_DEPARTMENTS, { message: 'Select a department.' }),
  responsibilities: z
    .array(listItemSchema)
    .min(1, 'Add at least one responsibility.')
    .max(30, 'At most 30 items allowed.'),
  requirements: z
    .array(listItemSchema)
    .min(1, 'Add at least one requirement.')
    .max(30, 'At most 30 items allowed.'),
  status: z.enum(JOB_STATUSES).optional(),
  deadline: z.string().optional(),
})

export type JobInput = z.infer<typeof jobSchema>
