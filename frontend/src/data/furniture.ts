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
  { id: 'window', name: '落地窗', category: 'other', description: '落地窗' },
  { id: 'door', name: '门', category: 'other', description: '门' },
]

export const FURNITURE_SIZES: Record<string, { w: number; h: number }> = {
  'sofa': { w: 80, h: 35 },
  'coffee-table': { w: 40, h: 25 },
  'tv-stand': { w: 50, h: 15 },
  'floor-lamp': { w: 15, h: 15 },
  'bed-double': { w: 60, h: 70 },
  'nightstand': { w: 18, h: 18 },
  'wardrobe': { w: 50, h: 22 },
  'desk': { w: 45, h: 25 },
  'dining-table': { w: 40, h: 40 },
  'dining-chair': { w: 16, h: 16 },
  'plant': { w: 15, h: 15 },
  'bookshelf': { w: 40, h: 12 },
  'window': { w: 60, h: 8 },
  'door': { w: 30, h: 8 },
}

export const STYLES = [
  { id: 'modern', name: '现代简约' },
  { id: 'nordic', name: '北欧' },
  { id: 'chinese', name: '中式' },
  { id: 'japanese', name: '日式' },
  { id: 'industrial', name: '工业风' },
  { id: 'minimalist', name: '极简' },
] as const

export type StyleId = (typeof STYLES)[number]['id']
