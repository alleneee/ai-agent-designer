import Dexie, { type EntityTable } from 'dexie'
import type { Project, GeneratedImage } from '@/types'

const db = new Dexie('FurnishDB') as Dexie & {
  projects: EntityTable<Project, 'id'>
  generatedImages: EntityTable<GeneratedImage, 'id'>
}

db.version(1).stores({
  projects: 'id, createdAt',
  generatedImages: 'id, projectId, createdAt',
  scenes: 'projectId',
})

db.version(2).stores({
  projects: 'id, createdAt',
  generatedImages: 'id, projectId, createdAt',
  scenes: 'projectId',
})

db.version(3).stores({
  projects: 'id, createdAt',
  generatedImages: 'id, projectId, createdAt',
  scenes: null,
})

export { db }
