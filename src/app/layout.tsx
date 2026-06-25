import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '순천팔마고 선택과목 안내',
  description: '2022 개정 교육과정 선택과목 안내 - 순천팔마고등학교',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
