import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gamify Journal',
  description: 'Gamefy your life story.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })


