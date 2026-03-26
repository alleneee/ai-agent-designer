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
  imageData: Blob
  prompt: string
  selected: boolean
  createdAt: number
}

export interface Scene {
  projectId: string
  furniture: FurnitureItem[]
  cameraPosition: [number, number, number]
  depthMapBase64?: string
  roomImageUrl?: string
}

export interface FurnitureItem {
  id: string
  modelId: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface FurnitureMeta {
  id: string
  name: string
  category: 'living' | 'bedroom' | 'dining' | 'other'
  description: string
  modelPath: string
  thumbnail: string
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
