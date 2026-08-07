import { z } from 'zod'
import { JOURNEY_SIDES } from '@/features/journeys/types'

/** Mirrors Backend/src/validation/journey.validate.js exactly. */
const PERIOD_REGEX = /^\d{4}( - \d{4})?$/

export const journeySchema = z
  .object({
    period: z
      .string()
      .trim()
      .min(1, 'Journey period is required.')
      .regex(PERIOD_REGEX, 'Year must be YYYY or YYYY - YYYY.'),
    title: z.string().trim().min(2).max(50, 'Title must be at most 50 characters.'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters.')
      .max(160, 'Description must be at most 160 characters.'),
    icon: z.string().trim().min(1, 'Icon is required.').max(100),
    side: z.enum(JOURNEY_SIDES),
  })
  .refine(
    (data) => {
      if (!data.period.includes(' - ')) return true
      const [startYear, endYear] = data.period.split(' - ').map(Number)
      return endYear >= startYear
    },
    {
      message: 'End year must be greater than or equal to start year.',
      path: ['period'],
    },
  )

export type JourneyInput = z.infer<typeof journeySchema>
