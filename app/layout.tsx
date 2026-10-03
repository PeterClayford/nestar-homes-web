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
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon.ico?v=3', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/apple-touch-icon.png?v=3',
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
        <link rel="icon" href="https://www.nestar.homes/favicon.ico?v=3" sizes="any" />
        <link rel="apple-touch-icon" href="https://www.nestar.homes/apple-touch-icon.png?v=3" />
      </head>
      <body className={`${inter.className} bg-gray-50 antialiased overflow-x-hidden`}>
        {children}
        <AbigailWidget />
      </body>
    </html>
  )
}
