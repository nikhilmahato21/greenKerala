'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

const SLIDES = [
  {
    destination: 'Goa',
    tagline: 'Sun, Sand & Endless Shacks',
    desc: 'Golden beaches, Portuguese heritage & legendary nightlife — where every moment feels like a celebration.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&q=85',
    accent: '#2e9e7a',
    tag: 'Beach Paradise',
  },
  {
    destination: 'Gokarna',
    tagline: 'Sacred Shores & Clifftop Sunsets',
    desc: 'Where ancient temples meet untouched beaches — the perfect escape from the ordinary.',
    image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=1600&q=85',
    accent: '#e8520a',
    tag: 'Offbeat Coastal',
  },
  {
    destination: 'Chikmagalur',
    tagline: 'Misty Hills & Coffee-Scented Mornings',
    desc: 'Trek through shola forests, taste freshly brewed estate coffee, and wake up to clouds at your doorstep.',
    image: 'https://images.pexels.com/photos/11532473/pexels-photo-11532473.jpeg',
    accent: '#2e3da8',
    tag: 'Hill Retreat',
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const [textKey, setTextKey] = useState(0)

  const go = useCallback((idx) => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setTextKey(k => k + 1)
      setFading(false)
    }, 400)
  }, [fading])

  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go])

  useEffect(() => {
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next])

  const slide = SLIDES[current]

  return (
    <section
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      {/* Background images */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: 0,
            transition: 'opacity 0.6s ease',
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        >
          <img
            src={s.image}
            alt={s.destination}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'brightness(0.5)',
            }}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
        }}
      />

      {/* Text content */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', alignItems: 'center',
        }}
      >
        <div
          style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}
        >
          <div
            key={textKey}
            style={{ maxWidth: 640, animation: 'slideUp 0.65s ease-out' }}
          >
            {/* Tag pill */}
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 999, padding: '6px 14px', marginBottom: 20,
                background: slide.accent + '30',
                border: `1px solid ${slide.accent}60`,
                color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: slide.accent }}
              />
              {slide.tag}
            </div>

            {/* Destination name */}
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 8vw, 5.5rem)',
                lineHeight: 1,
                color: '#fff',
                marginBottom: 10,
              }}
            >
              {slide.destination}
            </h1>

            {/* Tagline */}
            <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.35rem)', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: 14 }}>
              {slide.tagline}
            </p>

            {/* Description */}
            <p style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.05rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 32, maxWidth: 500 }}>
              {slide.desc}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a
                href="#packages"
                style={{
                  padding: '12px 28px', borderRadius: 999,
                  background: 'linear-gradient(135deg,#e8520a,#c93d00)',
                  color: '#fff', fontWeight: 600, fontSize: 14,
                  letterSpacing: '0.03em', textDecoration: 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                View Packages
              </a>
              <a
                href="#destinations"
                style={{
                  padding: '12px 28px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', fontWeight: 600, fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Explore More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: prev / dots / next */}
      <div
        style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}
      >
        <button
          onClick={() => go((current - 1 + SLIDES.length) % SLIDES.length)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              style={{
                height: 8, borderRadius: 999,
                width: i === current ? 28 : 8,
                background: i === current ? '#e8520a' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Destination pills (right side) */}
      <div
        style={{
          position: 'absolute', bottom: 120, right: 24, zIndex: 4,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              background: i === current ? s.accent + 'cc' : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${i === current ? s.accent : 'rgba(255,255,255,0.2)'}`,
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.25s',
            }}
          >
            <MapPin size={11} />
            {s.destination}
          </button>
        ))}
      </div>
    </section>
  )
}
