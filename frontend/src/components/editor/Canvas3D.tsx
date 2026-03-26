'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Room from './Room'
import FurnitureModel from './FurnitureModel'
import { useEditorStore } from '@/store/editorStore'

export default function Canvas3D() {
  const { furniture, selectedId, selectFurniture, depthMapUrl } = useEditorStore()

  const cameraPos: [number, number, number] = depthMapUrl
    ? [0, 3, 6]
    : [5, 5, 5]

  return (
    <Canvas
      shadows
      camera={{ position: cameraPos, fov: 50 }}
      onPointerMissed={() => selectFurniture(null)}
      className="bg-gray-100"
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Room />

      {furniture.map((item) => (
        <FurnitureModel
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={selectFurniture}
        />
      ))}

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2}
      />

      {!depthMapUrl && (
        <Grid
          infiniteGrid
          fadeDistance={20}
          fadeStrength={5}
          cellSize={0.5}
          sectionSize={1}
        />
      )}
    </Canvas>
  )
}
