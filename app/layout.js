import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Green Kerala Trips — Kerala Tour Packages & Homestays',
  description: 'Handcrafted travel experiences across Kerala. Curated group packages & homestay bookings with day-wise itineraries.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
