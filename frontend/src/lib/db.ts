import Dexie, { type EntityTable } from 'dexie'
import type { Project, GeneratedImage, Scene } from '@/types'

const db = new Dexie('FurnishDB') as Dexie & {
  projects: EntityTable<Project, 'id'>
  generatedImages: EntityTable<GeneratedImage, 'id'>
  scenes: EntityTable<Scene, 'projectId'>
}

db.version(1).stores({
  projects: 'id, createdAt',
  generatedImages: 'id, projectId, createdAt',
  scenes: 'projectId',
})

export { db }
