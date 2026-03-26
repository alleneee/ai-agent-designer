import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Furnish - AI 装修效果预览',
  description: 'AI 驱动的装修效果预览平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
