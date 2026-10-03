import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AbigailWidget from '@/components/AbigailWidget'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Nestar Homes Uganda | Real Estate Platform',
  description: 'Verified rental listings and direct property access in Uganda',
  metadataBase: new URL('https://www.nestar.homes'),
  icons: {
    icon: [
      { url: '/icon.png?v=4', type: 'image/png' },
      { url: '/favicon.ico?v=4' }
    ],
    shortcut: '/icon.png?v=4',
    apple: '/apple-icon.png?v=4',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png?v=4" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=4" />
      </head>
      <body className={`${inter.className} bg-gray-50 antialiased overflow-x-hidden`}>
        {children}
        <AbigailWidget />
      </body>
    </html>
  )
}
