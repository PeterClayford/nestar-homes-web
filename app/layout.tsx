import './globals.css'
import Navbar from '@/app/components/Navbar'

export const metadata = {
  title: 'Nestar Homes Uganda | Real Estate Marketplace',
  description: 'Verified property listings and instant viewing scheduling in Uganda.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
