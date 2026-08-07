export interface TeamMember {
  _id: string
  fullName: string
  position: string
  experience: string
  image: {
    url: string
    publicId: string
  }
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
