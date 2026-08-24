export interface Partner {
  _id: string

  logo: {
    url: string
    publicId: string
  }

  website: string | null

  displayOrder: number

  createdAt: string
  updatedAt: string
}