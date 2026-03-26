'use client'

import { useRef } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { FurnitureItem } from '@/types'
import { FURNITURE_CATALOG } from '@/data/furniture'

interface FurnitureModelProps {
  item: FurnitureItem
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function FurnitureModel({
  item,
  isSelected,
  onSelect,
}: FurnitureModelProps) {
  const meta = FURNITURE_CATALOG.find((f) => f.id === item.modelId)
  const groupRef = useRef<THREE.Group>(null)

  if (!meta) return null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(item.id)
  }

  return (
    <group
      ref={groupRef}
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onClick={handleClick}
    >
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={isSelected ? '#60a5fa' : '#94a3b8'}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}
