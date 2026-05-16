'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Phone, MessageCircle } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { label: 'Home',         href: '/' },
    { label: 'Destinations', href: '/#destinations' },
    { label: 'Packages',     href: '/#packages' },
    { label: 'About',        href: '/#about' },
    { label: 'Contact',      href: '/#contact' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-1 group">
            <div className="w-16 h-16 overflow-hidden shrink-0">
              <Image
                src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1778949528/WhatsApp_Image_2026-05-15_at_08.35.52-removebg-preview_g7xcil.png"
                alt="Namaste Nomads"
                width={64} height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="h-9 pt-3 relative">
              <Image
                src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1778949528/WhatsApp_Image_2026-05-15_at_08.35.25-removebg-preview_jfct8b.png"
                alt="Namaste Nomads"
                width={80} height={28}
                className="h-full w-auto object-contain"
                style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium tracking-wide relative group transition-colors duration-200"
                style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.9)' }}
              >
                {l.label}
                <span
                  className="absolute -bottom-0.5 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full"
                  style={{ background: '#e8520a' }}
                />
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="tel:+918062179246"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200"
              style={{
                borderColor: scrolled ? '#e8520a' : 'rgba(255,255,255,0.6)',
                color: scrolled ? '#e8520a' : '#fff',
              }}
            >
              <Phone size={14} /> Call Us
            </a>
            <a
              href="https://wa.me/919999999999?text=Hi! I want to book a trip!"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: scrolled ? '#374151' : '#fff' }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 px-3 text-gray-700 font-medium rounded-xl transition-colors"
                style={{}}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              <a
                href="tel:+918062179246"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold border"
                style={{ borderColor: '#e8520a', color: '#e8520a' }}
              >
                <Phone size={14} /> Call
              </a>
              <a
                href="https://wa.me/919999999999"
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
