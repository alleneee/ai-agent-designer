export interface Project {
  id: string
  name: string
  roomImage: Blob
  style: string
  createdAt: number
  updatedAt: number
}

export interface GeneratedImage {
  id: string
  projectId: string
  imageUrl: string
  imageData?: Blob
  prompt: string
  selected: boolean
  createdAt: number
}

export interface FurnitureMeta {
  id: string
  name: string
  category: 'living' | 'bedroom' | 'dining' | 'other'
  description: string
}

export interface FurnitureItem {
  name: string
  image?: string
}

export interface GenerateRequest {
  room_image: string
  style: string
  furniture_items: FurnitureItem[]
}

export interface GenerateResponse {
  images: string[]
}
