'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSlider from '@/components/HeroSlider'
import PackageCard from '@/components/PackageCard'
import Footer from '@/components/Footer'
import { usePackages } from '@/hooks/usePackages'
import { usePhone, useWhatsapp, useEmail, useEmail2 } from '@/hooks/useSettings'
import {
  Phone, MessageCircle, MapPin, Mail, Star, Shield, Clock, Users,
  Building2, ArrowRight, CheckCircle, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'

const CATEGORY_TABS = [
  { value: 'all',      label: 'All Packages' },
  { value: 'package',  label: 'Packages' },
  { value: 'group',    label: 'Group Packages' },
  { value: 'homestay', label: 'Home Stays' },
  { value: 'other',    label: 'Other' },
]

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeDest, setActiveDest] = useState('all')
  const [destinations, setDestinations] = useState([])
  const { packages } = usePackages()
  const phone = usePhone()
  const whatsapp = useWhatsapp()
  const email = useEmail()
  const email2 = useEmail2()
  useEffect(() => {
    fetch('/api/destinations')
      .then(r => r.ok ? r.json() : [])
      .then(setDestinations)
      .catch(() => {})
  }, [])

  const visibleDestinations = destinations.filter(d => d.featured !== false)
  const featuredDestNames = new Set(visibleDestinations.map(d => d.name))

  const shown = packages.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchDest = activeDest === 'all' || p.destination === activeDest
    const matchFeatured = !p.destination || featuredDestNames.has(p.destination)
    return matchCat && matchDest && matchFeatured
  })

  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <HeroSlider />

      {/* ── Destinations ── */}
      <section id="destinations" style={{ padding: '80px 24px', background: '#f0ebe1' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#e8520a', marginBottom: 10 }}>
              Where We Go
            </p>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#111', marginBottom: 12 }}>
              Our Most Beautiful <span style={{ color: '#e8520a' }}>Destinations</span>
            </h2>
            <p style={{ color: '#6b7280', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Handpicked spots across God&apos;s Own Country — from misty hill stations to sun-lit backwaters.
            </p>
          </div>

          {visibleDestinations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {visibleDestinations.map(dest => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setActiveDest(dest.name)
                    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 280, cursor: 'pointer', border: 'none', padding: 0, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)' }}
                >
                  <img src={dest.image_url || 'https://images.unsplash.com/photo-1637066742971-726bee8d9f56?q=80'} alt={dest.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <MapPin size={13} style={{ color: dest.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: dest.color }}>{dest.emoji || '📍'} Explore</span>
                    </div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 6, lineHeight: 1.1 }}>{dest.name}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{dest.description || ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Packages ── */}
      <section id="packages" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#e8520a', marginBottom: 10 }}>
              Curated Experiences
            </p>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#111', marginBottom: 12 }}>
              Our <span style={{ color: '#e8520a' }}>Packages</span>
            </h2>
            <p style={{ color: '#9ca3af', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Every package includes a day-wise itinerary, accommodation & transfers.
            </p>

            {/* Category tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setActiveCategory(tab.value); setActiveDest('all') }}
                  style={{
                    padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: activeCategory === tab.value ? 'linear-gradient(135deg,#e8520a,#c93d00)' : '#f5f0e8',
                    color: activeCategory === tab.value ? '#fff' : '#555',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Destination dropdown filter */}
            {visibleDestinations.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <MapPin size={13} style={{ position: 'absolute', left: 12, color: activeDest !== 'all' ? '#e8520a' : '#9ca3af', pointerEvents: 'none', zIndex: 1 }} />
                  <select
                    value={activeDest}
                    onChange={e => setActiveDest(e.target.value)}
                    style={{
                      padding: '8px 36px 8px 30px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${activeDest !== 'all' ? '#e8520a' : '#e5e7eb'}`,
                      background: activeDest !== 'all' ? '#fff5ef' : '#f5f0e8',
                      color: activeDest !== 'all' ? '#e8520a' : '#555',
                      appearance: 'none', outline: 'none',
                    }}
                  >
                    <option value="all">All Destinations</option>
                    {visibleDestinations.map(d => (
                      <option key={d.id} value={d.name}>{d.emoji} {d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 12, color: activeDest !== 'all' ? '#e8520a' : '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
              <p>No packages available for this selection.</p>
              <button onClick={() => { setActiveCategory('all'); setActiveDest('all') }} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 999, border: 'none', background: '#f5f0e8', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {shown.map(pkg => <PackageCard key={pkg.id} pkg={pkg} phone={phone} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="about" style={{ padding: '80px 24px', background: '#f0ebe1' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#e8520a', marginBottom: 12 }}>Why Green Kerala Trips</p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#111', marginBottom: 16, lineHeight: 1.1 }}>
                Travel <span style={{ color: '#e8520a' }}>Thoughtfully</span>
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 32 }}>
                We&apos;re not just a travel company — we&apos;re a community of explorers who believe tourists deserve more than a postcard visit. From houseboat nights to spice-farm mornings, we craft journeys that go beyond the tourist trail.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { icon: Star,   t: 'Curated Packages', d: 'Every detail handpicked' },
                  { icon: Clock,  t: 'Day-wise Plans',   d: 'Hour by hour clarity' },
                  { icon: Shield, t: 'Safe Travels',     d: 'Verified accommodations' },
                  { icon: Users,  t: 'Small Groups',     d: 'Intimate experiences' },
                ].map(({ icon: I, t, d }) => (
                  <div key={t} style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <I size={17} style={{ color: '#e8520a' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', aspectRatio: '1/1', maxWidth: 480, margin: '0 auto' }}>
                <img src="https://images.unsplash.com/photo-1589983846997-04788035bc83?q=80" alt="Kerala" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', padding: '16px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e8520a' }}>500+</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Happy travellers</div>
              </div>
              <div style={{ position: 'absolute', top: -16, right: -16, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Rated 4.9/5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Join as Agency ── */}
      <section id="join-agency" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
            {/* Left — copy */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2e3da8', marginBottom: 12 }}>
                For Travel Agencies
              </p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#111', marginBottom: 16, lineHeight: 1.1 }}>
                Partner With Us &<br /><span style={{ color: '#e8520a' }}>Grow Together</span>
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
                Are you a Kerala travel agency with great packages? List them on our platform, reach thousands of travellers, and grow your business with zero upfront cost.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {[
                  'Submit packages directly from your agency dashboard',
                  'Each package is reviewed and published by our team',
                  'Get enquiries from travellers looking for experiences',
                  'Completely free to join — just apply below',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/agency/register"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  <Building2 size={16} /> Apply to Join
                </Link>
                <Link href="/agency"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999, background: '#f0ebe1', color: '#555', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Agency Login <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right — visual card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: Building2, title: 'Register', desc: 'Submit your agency details and credentials', color: '#e8520a', bg: '#fff5ef' },
                { icon: Clock,     title: 'Review',   desc: 'Our admin reviews and approves your application', color: '#f59e0b', bg: '#fffbeb' },
                { icon: Star,      title: 'List',     desc: 'Create and submit packages from your dashboard', color: '#2e3da8', bg: '#eff1ff' },
                { icon: Users,     title: 'Connect',  desc: 'Travellers discover your packages and enquire', color: '#22c55e', bg: '#f0fdf4' },
              ].map(({ icon: I, title, desc, color, bg }) => (
                <div key={title} style={{ background: bg, borderRadius: 16, padding: '20px', border: `1px solid ${color}20` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <I size={20} style={{ color }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" style={{ padding: '80px 24px', background: '#2e3da8' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Ready to Go?</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', marginBottom: 14, lineHeight: 1.1 }}>
            Let&apos;s Plan Your <span style={{ color: '#fbbf24' }}> Journey</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.6, marginBottom: 16 }}>
            Tell us your dates and preferred destination — we&apos;ll craft the perfect  itinerary for you.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32 }}>
            <MapPin size={14} /> Kerala, India
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:+${phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#1c1c1c', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              <Phone size={18} /> Call Us Now
            </a>
            <a href={`https://wa.me/${whatsapp}?text=Hi! I want to book a Kerala trip`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              <MessageCircle size={18} /> WhatsApp Us
            </a>
            {email && (
              <a href={`mailto:${email}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                <Mail size={18} /> Email Us
              </a>
            )}
            {email2 && (
              <a href={`mailto:${email2}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                <Mail size={18} /> Email Us (2)
              </a>
            )}
          </div>
        </div>
      </section>

      <Footer />

      <a href={`https://wa.me/${whatsapp}?text=Hi! I want to book a Kerala trip!`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#25d366,#128c7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(37,211,102,0.5)', textDecoration: 'none' }}>
        <MessageCircle size={26} />
      </a>
    </main>
  )
}
