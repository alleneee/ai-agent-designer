import type { FurnitureMeta } from '@/types'

export const FURNITURE_CATALOG: FurnitureMeta[] = [
  { id: 'sofa', name: '沙发', category: 'living', description: '三人沙发' },
  { id: 'coffee-table', name: '茶几', category: 'living', description: '茶几' },
  { id: 'tv-stand', name: '电视柜', category: 'living', description: '电视柜' },
  { id: 'floor-lamp', name: '落地灯', category: 'living', description: '落地灯' },
  { id: 'bed-double', name: '双人床', category: 'bedroom', description: '双人床' },
  { id: 'nightstand', name: '床头柜', category: 'bedroom', description: '床头柜' },
  { id: 'wardrobe', name: '衣柜', category: 'bedroom', description: '衣柜' },
  { id: 'desk', name: '书桌', category: 'bedroom', description: '书桌' },
  { id: 'dining-table', name: '餐桌', category: 'dining', description: '餐桌' },
  { id: 'dining-chair', name: '餐椅', category: 'dining', description: '餐椅' },
  { id: 'plant', name: '绿植', category: 'other', description: '绿植盆栽' },
  { id: 'bookshelf', name: '书架', category: 'other', description: '书架' },
]

export const STYLES = [
  { id: 'modern', name: '现代简约' },
  { id: 'nordic', name: '北欧' },
  { id: 'chinese', name: '中式' },
  { id: 'japanese', name: '日式' },
  { id: 'industrial', name: '工业风' },
  { id: 'minimalist', name: '极简' },
] as const

export type StyleId = (typeof STYLES)[number]['id']
