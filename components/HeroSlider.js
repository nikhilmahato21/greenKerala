'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react'

const FALLBACK_SLIDES = [
  {
    title: 'Explore Kerala',
    tagline: 'God\'s Own Country Awaits',
    desc: 'From misty hill stations to tranquil backwaters — discover the magic of Kerala with handcrafted packages.',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1600&q=85',
    accent: '#2e9e7a',
    tag: 'Kerala',
    badge: 'Discover',
  },
  {
    title: 'Backwater Bliss',
    tagline: 'Float Through Alleppey',
    desc: 'Glide through emerald backwaters on a traditional houseboat, surrounded by coconut palms and village life.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=85',
    accent: '#e8520a',
    tag: 'Alleppey',
    badge: 'Homestays',
  },
  {
    title: 'Munnar Tea Trails',
    tagline: 'Misty Hills & Green Carpets',
    desc: 'Wake up to tea-scented mist, trek through shola forests, and sip freshly brewed estate chai.',
    image: 'https://images.unsplash.com/photo-1637066742971-726bee8d9f56?q=80',
    accent: '#2e3da8',
    tag: 'Munnar',
    badge: 'Group Tours',
  },
]

function pkgToSlide(pkg) {
  return {
    title: pkg.title,
    tagline: pkg.subtitle || pkg.badge || '',
    desc: pkg.overview ? pkg.overview.slice(0, 160) + (pkg.overview.length > 160 ? '…' : '') : '',
    image: pkg.heroImage || pkg.image || '',
    accent: pkg.badgeColor || '#e8520a',
    tag: pkg.destination || '',
    badge: pkg.badge || '',
    pkgId: pkg.id,
    salePrice: pkg.salePrice,
  }
}

export default function HeroSlider() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const [textKey, setTextKey] = useState(0)

  useEffect(() => {
    fetch('/api/packages/featured')
      .then(r => r.ok ? r.json() : [])
      .then(pkgs => {
        if (pkgs.length > 0) setSlides(pkgs.map(pkgToSlide))
      })
      .catch(() => {})
  }, [])

  const go = useCallback((idx) => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setTextKey(k => k + 1)
      setFading(false)
    }, 400)
  }, [fading])

  const next = useCallback(() => go((current + 1) % slides.length), [current, go, slides.length])

  useEffect(() => {
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next])

  const slide = slides[current] || FALLBACK_SLIDES[0]

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden', background: '#111' }}>
      {/* Background images */}
      {slides.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.6s ease', opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}>
          {s.image && <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.48)' }} />}
        </div>
      ))}

      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div key={textKey} style={{ maxWidth: 640, animation: 'slideUp 0.65s ease-out' }}>
            {/* Tag pill */}
            {slide.tag && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 14px', marginBottom: 16, background: slide.accent + '30', border: `1px solid ${slide.accent}60`, color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: slide.accent }} />
                {slide.badge ? `${slide.badge} · ${slide.tag}` : slide.tag}
              </div>
            )}

            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1rem, 8vw, 3rem)', lineHeight: 1, color: '#fff', marginBottom: 10 }}>
              {slide.title}
            </h1>
            {slide.tagline && (
              <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.35rem)', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: 12 }}>{slide.tagline}</p>
            )}
            {slide.desc && (
              <p style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.05rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 28, maxWidth: 500 }}>{slide.desc}</p>
            )}

            {slide.salePrice && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 16px', marginBottom: 20, color: '#fff', fontSize: 14 }}>
                <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>₹{Number(slide.salePrice).toLocaleString('en-IN')}</span>
                <span style={{ opacity: 0.7 }}>onwards</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={slide.pkgId ? `/packages/${slide.pkgId}` : '#packages'}
                style={{ padding: '12px 28px', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                {slide.pkgId ? 'View Package' : 'View Packages'}
              </a>
              <a href="#packages"
                style={{ padding: '12px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Browse All
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <button onClick={() => go((current - 1 + slides.length) % slides.length)}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              style={{ height: 8, borderRadius: 999, width: i === current ? 28 : 8, background: i === current ? '#e8520a' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }} />
          ))}
        </div>
        <button onClick={next}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Destination pills */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 120, right: 24, zIndex: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slides.map((s, i) => (
            <button key={i} onClick={() => go(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: i === current ? (s.accent || '#e8520a') + 'cc' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: `1px solid ${i === current ? (s.accent || '#e8520a') : 'rgba(255,255,255,0.2)'}`, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}>
              <MapPin size={11} />
              {s.tag || s.title?.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
