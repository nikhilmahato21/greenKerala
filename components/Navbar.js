'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Phone, MessageCircle } from 'lucide-react'
import { usePhone } from '@/hooks/useSettings'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const phone = usePhone()

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
          <Link href="/" className="flex items-center justify-center gap-2 group">
            <div className="w-16 h-16 overflow-hidden shrink-0">
              <Image
                src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1779855779/WhatsApp_Image_2026-05-22_at_15.06.01-removebg-preview_mr6pdc.png"
                alt="Green Kerala Trips"
                width={64} height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="font-bold text-base leading-tight hidden sm:block"
              style={{ fontFamily: 'Syne, sans-serif', color: scrolled ? '#1a3c2e' : '#fff' }}
            >
              Green Kerala<br />
              <span style={{ color: '#e8520a', fontWeight: 700 }}>Trips</span>
            </span>
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
                <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full" style={{ background: '#e8520a' }} />
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={`tel:+${phone}`}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200"
              style={{ borderColor: scrolled ? '#e8520a' : 'rgba(255,255,255,0.6)', color: scrolled ? '#e8520a' : '#fff' }}
            >
              <Phone size={14} /> Call Us
            </a>
            <a
              href={`https://wa.me/${phone}?text=Hi! I want to book a trip!`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg" style={{ color: scrolled ? '#374151' : '#fff' }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t" style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2.5 px-3 text-gray-700 font-medium rounded-xl transition-colors">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              <a
                href={`tel:+${phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold border"
                style={{ borderColor: '#e8520a', color: '#e8520a' }}
              >
                <Phone size={14} /> Call
              </a>
              <a
                href={`https://wa.me/${phone}?text=Hi! I want to book a trip!`}
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
