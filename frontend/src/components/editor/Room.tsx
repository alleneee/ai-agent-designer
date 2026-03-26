'use client'

import { useTexture } from '@react-three/drei'
import { useEditorStore } from '@/store/editorStore'

export default function Room() {
  const { depthMapUrl, roomTextureUrl } = useEditorStore()

  if (!depthMapUrl || !roomTextureUrl) {
    return <FallbackRoom />
  }

  return <DepthRoom depthMapUrl={depthMapUrl} roomTextureUrl={roomTextureUrl} />
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

function DepthRoom({
  depthMapUrl,
  roomTextureUrl,
}: {
  depthMapUrl: string
  roomTextureUrl: string
}) {
  const [colorMap, displacementMap] = useTexture([roomTextureUrl, depthMapUrl])

  const planeWidth = 6
  const img = colorMap.image as HTMLImageElement
  const planeHeight = (img.height / img.width) * planeWidth
  const segments = 256

  return (
    <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 1.5, 0]} receiveShadow>
      <planeGeometry args={[planeWidth, planeHeight, segments, segments]} />
      <meshStandardMaterial
        map={colorMap}
        displacementMap={displacementMap}
        displacementScale={-2.0}
        side={2}
      />
    </mesh>
  )
}
