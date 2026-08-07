export const JOURNEY_SIDES = ['left', 'right'] as const
export type JourneySide = (typeof JOURNEY_SIDES)[number]

export interface Journey {
  _id: string
  period: string
  title: string
  description: string
  icon: string
  side: JourneySide
  image: {
    url: string
    publicId: string
  }
  createdAt: string
  updatedAt: string
}
