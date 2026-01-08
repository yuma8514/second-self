import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '第二の自分',
  description: 'あなた専用の思索AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

