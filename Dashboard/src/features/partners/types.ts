export interface Partner {
  _id: string
  logo: {
    url: string
    publicId: string
  }
  website: string | null
  createdAt: string
  updatedAt: string
}
