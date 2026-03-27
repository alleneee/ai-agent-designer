'use client'

import { DoubleSide } from 'three'
import { useTexture } from '@react-three/drei'
import { useEditorStore } from '@/store/editorStore'

export default function Room() {
  const { roomTextureUrl } = useEditorStore()

  if (!roomTextureUrl) {
    return <FallbackRoom />
  }

  return <PhotoRoom roomTextureUrl={roomTextureUrl} />
}

function FallbackRoom() {
  const width = 5
  const depth = 4
  const height = 2.8
  const wallThickness = 0.1

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#e8e0d8" />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  )
}

function PhotoRoom({ roomTextureUrl }: { roomTextureUrl: string }) {
  const colorMap = useTexture(roomTextureUrl)

  const img = colorMap.image as HTMLImageElement
  const aspect = img.width / img.height
  const wallWidth = 6
  const wallHeight = wallWidth / aspect
  const floorDepth = 5

  return (
    <group>
      <mesh position={[0, wallHeight / 2, -floorDepth / 2]} receiveShadow>
        <planeGeometry args={[wallWidth, wallHeight]} />
        <meshStandardMaterial map={colorMap} side={DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[wallWidth, floorDepth]} />
        <meshStandardMaterial color="#e8e0d8" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
