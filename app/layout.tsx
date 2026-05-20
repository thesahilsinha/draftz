import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DRAFTZ — Prodigy Pictures',
  description: 'The Screenplay & Production Management Platform for Prodigy Pictures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}