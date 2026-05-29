'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { usePhone } from '@/hooks/useSettings'
import { Phone, MessageCircle, Clock, MapPin, Check, X, ChevronDown, ChevronUp, ArrowLeft, Send, User } from 'lucide-react'
import Link from 'next/link'

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

function fmtRange(dr) {
  if (typeof dr === 'string') return dr
  const { start, end } = dr || {}
  if (!start && !end) return ''
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const f = d => { const dt = new Date(d + 'T00:00:00'); return `${dt.getDate()} ${M[dt.getMonth()]}, ${dt.getFullYear()}` }
  const s = start ? f(start) : '', e = end ? f(end) : ''
  return s && e ? `${s} – ${e}` : s || e
}
function groupMonth(group) {
  if (group.month) return group.month
  const first = group.dates?.[0]
  const start = first ? (typeof first === 'string' ? '' : first.start) : ''
  if (!start) return ''
  const dt = new Date(start + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const INPUT = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111',
  background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function PackagePage({ params }) {
  const { id } = use(params)
  const [pkg, setPkg] = useState(null)
  const [openDay, setOpenDay] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const phone = usePhone()

  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', message: '' })
  const [enquiryStatus, setEnquiryStatus] = useState(null) // null | 'sending' | 'sent' | 'error'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then(all => setPkg(all.find(p => p.id === id) || null))
      .catch(() => setPkg(null))
      .finally(() => setLoading(false))
  }, [id])

  const submitEnquiry = async (e) => {
    e.preventDefault()
    if (!enquiry.name.trim() || !enquiry.phone.trim()) return
    setEnquiryStatus('sending')
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          package_title: pkg.title,
          ...enquiry,
        }),
      })
      if (res.ok) {
        setEnquiryStatus('sent')
        setEnquiry({ name: '', phone: '', email: '', message: '' })
      } else {
        setEnquiryStatus('error')
      }
    } catch {
      setEnquiryStatus('error')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f0ebe1', borderTop: '3px solid #e8520a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#9ca3af' }}>Loading package...</p>
      </div>
    </div>
  )

  if (!pkg) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Package not found</h2>
        <Link href="/" style={{ color: '#e8520a', textDecoration: 'underline' }}>← Back to home</Link>
      </div>
    </main>
  )

  const waMsg = `Hi! I want to book ${pkg.title} (${pkg.duration}) — ${fmt(pkg.salePrice)}/person`

  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ position: 'relative', height: isMobile ? '45vh' : '55vh', minHeight: 280, overflow: 'hidden' }}>
        <img
          src={pkg.heroImage || pkg.image}
          alt={pkg.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=85' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 16px 24px' : '0 24px 40px', width: '100%' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16, textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to packages
            </Link>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: pkg.badgeColor + 'cc', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                <MapPin size={10} /> {pkg.destination}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                <Clock size={10} /> {pkg.duration}
              </span>
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: isMobile ? 'clamp(1.5rem, 6vw, 2.2rem)' : 'clamp(1.8rem, 5vw, 3.5rem)', color: '#fff', marginBottom: 6, lineHeight: 1.1 }}>
              {pkg.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 14 : 18 }}>{pkg.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)', gap: isMobile ? 32 : 40 }}>

          {/* Left column */}
          <div style={{ minWidth: 0 }}>

            {/* Overview */}
            <section style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 12 }}>Overview</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.8, fontSize: 15 }}>{pkg.overview}</p>
            </section>

            {/* Highlights */}
            {pkg.highlights?.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 14 }}>Highlights</h2>
                <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                  {pkg.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Check size={10} style={{ color: '#e8520a' }} strokeWidth={3} />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Available Dates — Group Packages */}
            {pkg.category === 'group' && pkg.availableDates?.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 16 }}>Available Dates</h2>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available Dates</div>
                    <div style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Reserve</div>
                  </div>
                  {pkg.availableDates.map((group, gi) => {
                    const month = groupMonth(group)
                    const validDates = (group.dates || []).filter(dr => fmtRange(dr))
                    if (!validDates.length && !month) return null
                    return (
                    <div key={gi} style={{ borderBottom: gi < pkg.availableDates.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '14px 18px', gap: 16 }}>
                        <div>
                          {month && <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{month}</div>}
                          {validDates.map((dr, di) => (
                            <div key={di} style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>{fmtRange(dr)}</div>
                          ))}
                        </div>
                        <a
                          href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi! I want to reserve ${pkg.title} — ${groupMonth(group) || ''}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ padding: '9px 22px', borderRadius: 999, background: 'linear-gradient(135deg,#2e9e7a,#1e7a5e)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}
                        >
                          Reserve
                        </a>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {pkg.itinerary?.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 18 }}>
                  Day-wise Itinerary
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pkg.itinerary.map((day, i) => (
                    <div key={i} style={{ border: '1px solid', borderColor: openDay === i ? '#fbd0b5' : '#f3f4f6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <button
                        onClick={() => setOpenDay(openDay === i ? -1 : i)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: openDay === i ? '#fff8f5' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#e8520a,#c93d00)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {day.day}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Day {day.day}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{day.title}</div>
                          </div>
                        </div>
                        {openDay === i ? <ChevronUp size={16} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                      </button>
                      {openDay === i && (
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f9f0eb' }}>
                          {day.image && (
                            <img
                              src={day.image}
                              alt={day.title}
                              onError={e => e.target.style.display = 'none'}
                              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginTop: 14, marginBottom: 12 }}
                            />
                          )}
                          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: day.image ? '0 0 14px' : '14px 0' }}>{day.description}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {day.activities?.map((a, j) => (
                              <span key={j} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#f5f0e8', color: '#555' }}>{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inclusions / Exclusions */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                {[
                  { label: 'Inclusions', items: pkg.inclusions, icon: Check, color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Exclusions', items: pkg.exclusions, icon: X,     color: '#dc2626', bg: '#fee2e2' },
                ].map(({ label, items, icon: Icon, color, bg }) => (
                  <div key={label}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={12} style={{ color }} strokeWidth={3} />
                      </span>
                      {label}
                    </h3>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 7, listStyle: 'none', padding: 0, margin: 0 }}>
                      {items?.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6b7280' }}>
                          <Icon size={13} style={{ color, flexShrink: 0, marginTop: 1 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Enquiry Form ── */}
            <section style={{ background: '#f9fafb', borderRadius: 20, padding: isMobile ? 20 : 28, border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#e8520a,#c93d00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={16} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: '#111', margin: 0 }}>Send an Enquiry</h2>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>We&apos;ll get back to you within a few hours</p>
                </div>
              </div>

              {enquiryStatus === 'sent' ? (
                <div style={{ marginTop: 20, padding: '20px', background: '#dcfce7', borderRadius: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ fontWeight: 700, color: '#15803d', fontSize: 15, margin: 0 }}>Enquiry sent successfully!</p>
                  <p style={{ fontSize: 13, color: '#166534', margin: '4px 0 0' }}>Our team will contact you shortly.</p>
                  <button onClick={() => setEnquiryStatus(null)} style={{ marginTop: 14, padding: '8px 20px', borderRadius: 999, border: 'none', background: '#15803d', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={submitEnquiry} style={{ marginTop: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Your Name *</label>
                      <input
                        required
                        value={enquiry.name}
                        onChange={e => setEnquiry(q => ({ ...q, name: e.target.value }))}
                        placeholder="e.g. Rahul Sharma"
                        style={INPUT}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={enquiry.phone}
                        onChange={e => setEnquiry(q => ({ ...q, phone: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        style={INPUT}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Email (optional)</label>
                    <input
                      type="email"
                      value={enquiry.email}
                      onChange={e => setEnquiry(q => ({ ...q, email: e.target.value }))}
                      placeholder="e.g. rahul@email.com"
                      style={INPUT}
                    />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Message (optional)</label>
                    <textarea
                      rows={3}
                      value={enquiry.message}
                      onChange={e => setEnquiry(q => ({ ...q, message: e.target.value }))}
                      placeholder="Any specific dates, group size, or questions?"
                      style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                  {enquiryStatus === 'error' && (
                    <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>Something went wrong. Please try again.</p>
                  )}
                  <button
                    type="submit"
                    disabled={enquiryStatus === 'sending'}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
                      background: enquiryStatus === 'sending' ? '#e5e7eb' : 'linear-gradient(135deg,#e8520a,#c93d00)',
                      color: enquiryStatus === 'sending' ? '#9ca3af' : '#fff',
                      fontWeight: 700, fontSize: 15, cursor: enquiryStatus === 'sending' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {enquiryStatus === 'sending'
                      ? <><span style={{ width: 14, height: 14, border: '2px solid #d1d5db', borderTop: '2px solid #9ca3af', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Sending...</>
                      : <><Send size={15} /> Send Enquiry</>
                    }
                  </button>
                </form>
              )}
            </section>
          </div>

          {/* Right: Booking card (sticky, hidden on mobile) */}
          {!isMobile && (
            <div>
              <div style={{ position: 'sticky', top: 88 }}>
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                  <div style={{ padding: '24px', background: 'linear-gradient(135deg,#e8520a,#c93d00)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'line-through' }}>{fmt(pkg.originalPrice)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                        SAVE {fmt(pkg.originalPrice - pkg.salePrice)}
                      </span>
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(pkg.salePrice)}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>per {pkg.priceNote}</div>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {[
                      { l: 'Duration', v: pkg.duration },
                      { l: 'Destination', v: pkg.destination },
                      { l: 'Stay', v: pkg.hotels },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, fontSize: 13 }}>
                        <span style={{ color: '#9ca3af' }}>{l}</span>
                        <span style={{ fontWeight: 600, color: '#111', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                      </div>
                    ))}

                    <div style={{ height: 1, background: '#f3f4f6', margin: '16px 0' }} />

                    <a
                      href={`tel:+${phone}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 10 }}
                    >
                      <Phone size={16} /> Call to Book
                    </a>
                    <a
                      href={`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                    >
                      <MessageCircle size={16} /> WhatsApp Enquiry
                    </a>
                    <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
                      No booking fees · Instant confirmation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Mobile sticky bottom bar */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#fff', borderTop: '1px solid #f3f4f6', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(pkg.originalPrice)}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e8520a' }}>
              {fmt(pkg.salePrice)}<span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>/person</span>
            </div>
          </div>
          <a
            href={`tel:+${phone}`}
            style={{ padding: '12px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Phone size={14} /> Call
          </a>
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ padding: '12px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      )}
    </main>
  )
}
