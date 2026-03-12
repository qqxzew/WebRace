import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jídelna Plus | Objednávky online',
  description: 'Objednej si jídlo ze školního bufetu online a vyhni se frontě.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased bg-[#fffef7] min-h-screen">
        {children}
        <Toaster
          position="top-center"
          richColors
          offset={64}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-dm-sans)',
              borderRadius: '1rem',
              fontSize: '1rem',
              padding: '16px 20px',
              minWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            },
          }}
        />
      </body>
    </html>
  )
}
