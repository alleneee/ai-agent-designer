'use client'

import { useEditorStore } from '@/store/editorStore'
import { FURNITURE_CATALOG } from '@/data/furniture'

export default function PropertyPanel() {
  const { furniture, selectedId, updateFurniture, removeFurniture } =
    useEditorStore()
  const selected = furniture.find((f) => f.id === selectedId)

  if (!selected) {
    return (
      <div className="w-56 bg-white border-l p-3">
        <p className="text-sm text-gray-400">点击家具以编辑属性</p>
      </div>
    )
  }

  const meta = FURNITURE_CATALOG.find((f) => f.id === selected.modelId)

  const handleChange = (
    field: 'position' | 'rotation' | 'scale',
    axis: number,
    value: string
  ) => {
    const arr = [...selected[field]] as [number, number, number]
    arr[axis] = parseFloat(value) || 0
    updateFurniture(selected.id, { [field]: arr })
  }

  const axes = ['X', 'Y', 'Z']

  return (
    <div className="w-56 bg-white border-l p-3 overflow-y-auto">
      <h2 className="font-semibold mb-1">{meta?.name ?? selected.modelId}</h2>
      <p className="text-xs text-gray-400 mb-4">{meta?.description}</p>

      {(['position', 'rotation', 'scale'] as const).map((field) => (
        <div key={field} className="mb-3">
          <p className="text-xs text-gray-500 mb-1">
            {field === 'position' ? '位置' : field === 'rotation' ? '旋转' : '缩放'}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {axes.map((axis, i) => (
              <div key={axis}>
                <label className="text-xs text-gray-400">{axis}</label>
                <input
                  type="number"
                  step={0.1}
                  value={selected[field][i]}
                  onChange={(e) => handleChange(field, i, e.target.value)}
                  className="w-full border rounded px-1 py-0.5 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => removeFurniture(selected.id)}
        className="w-full mt-4 text-sm text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
      >
        删除
      </button>
    </div>
  )
}
