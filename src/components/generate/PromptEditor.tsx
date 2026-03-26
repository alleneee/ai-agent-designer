'use client'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function PromptEditor({ value, onChange }: PromptEditorProps) {
  return (
    <div>
      <h3 className="font-medium mb-2">自定义描述（可选）</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：增加暖色灯光，窗户采用落地窗..."
        className="w-full border rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
