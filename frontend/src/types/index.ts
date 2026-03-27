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

export interface Scene {
  projectId: string
  markers: FurnitureMarker[]
}

export interface FurnitureMarker {
  id: string
  catalogId: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface FurnitureMeta {
  id: string
  name: string
  category: 'living' | 'bedroom' | 'dining' | 'other'
  description: string
}

export interface GenerateRequest {
  room_image?: string
  style: string
  furniture: string[]
  furniture_images?: string[]
  prompt?: string
}

export interface GenerateResponse {
  images: string[]
}
