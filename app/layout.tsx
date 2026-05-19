import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DRAFTZ — Prodigy Pictures',
  description: 'The Screenplay & Production Management Platform for Prodigy Pictures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}