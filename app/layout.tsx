import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "My App",
  description: "Secure web application",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "My App",
    description: "Secure web application",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
