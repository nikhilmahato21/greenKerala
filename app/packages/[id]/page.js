'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomestayDetail from '@/components/HomestayDetail'
import { usePhone, useWhatsapp } from '@/hooks/useSettings'
import { Phone, MessageCircle, Clock, MapPin, Check, X, ChevronDown, ChevronUp, ArrowLeft, Send, User, Info, Users, Baby, BedDouble } from 'lucide-react'
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
  const whatsapp = useWhatsapp()

  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', message: '' })
  const [enquiryStatus, setEnquiryStatus] = useState(null) // null | 'sending' | 'sent' | 'error'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch(`/api/packages/${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setPkg(data && !data.error ? data : null))
      .catch(() => setPkg(null))
      .finally(() => setLoading(false))
  }, [id])

  const submitEnquiry = async (e) => {
    e.preventDefault()
    if (!enquiry.name.trim() || !enquiry.phone.trim()) return
    setEnquiryStatus('sending')
    const msgWithId = enquiry.message.trim()
      ? `${enquiry.message.trim()}\n\nPackage ID: ${pkg.id}`
      : `Package ID: ${pkg.id}`
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          package_title: pkg.title,
          ...enquiry,
          message: msgWithId,
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

  if (pkg.category === 'homestay') return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <HomestayDetail pkg={pkg} phone={phone} whatsapp={whatsapp} isMobile={isMobile} />
      <Footer />
    </main>
  )

  const waMsg = `Hi! I want to book ${pkg.title} (${pkg.id}) — ${pkg.duration} — ${fmt(pkg.salePrice)}/person`

  const occParts = [
    Number(pkg.rooms) > 0 && `${pkg.rooms} room${Number(pkg.rooms) !== 1 ? 's' : ''}`,
    Number(pkg.adults) > 0 && `${pkg.adults} adult${Number(pkg.adults) !== 1 ? 's' : ''}`,
    Number(pkg.children) > 0 && `${pkg.children} child${Number(pkg.children) !== 1 ? 'ren' : ''}`,
  ].filter(Boolean)
  const occSummary = occParts.join(', ')
  const hasBreakdown = Number(pkg.salePrice) > 0 && (Number(pkg.adults) > 0 || Number(pkg.children) > 0)
  const waChanges = `Hi! I'd like to request changes for ${pkg.title} (${pkg.id})${occSummary ? ` — ${occSummary}` : ''}. Current rate: ₹${Number(pkg.salePrice).toLocaleString('en-IN')}/adult${Number(pkg.childPrice) > 0 ? `, ₹${Number(pkg.childPrice).toLocaleString('en-IN')}/child` : ''}.`

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

            {/* Note */}
            {pkg.note?.trim() && (
              <section style={{ marginBottom: 28 }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: '#92400e', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}><strong>Note: </strong>{pkg.note}</p>
                </div>
              </section>
            )}

            {/* Available Dates — Group Packages */}
            {pkg.category === 'group' && pkg.availableDates?.length > 0 && (() => {
              // Flatten all date ranges and re-group by actual calendar month
              const allDates = pkg.availableDates.flatMap(g => (g.dates || []))
              const validDates = allDates.filter(dr => fmtRange(dr))
              if (!validDates.length) return null

              const monthMap = {}
              const monthOrder = []
              for (const dr of validDates) {
                const d = typeof dr === 'object' ? dr : { start: '', end: dr || '' }
                const monthKey = d.start
                  ? new Date(d.start + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                  : 'Upcoming'
                if (!monthMap[monthKey]) { monthMap[monthKey] = []; monthOrder.push(monthKey) }
                monthMap[monthKey].push(dr)
              }

              return (
                <section style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 16 }}>Available Departures</h2>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                    {monthOrder.map((month, mi) => (
                      <div key={month} style={{ borderBottom: mi < monthOrder.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        {/* Month header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#fff5ef,#fef3ec)', borderBottom: '1px solid #fbd0b5' }}>
                          <span style={{ fontSize: 15 }}>📅</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#c93d00', letterSpacing: '0.03em' }}>{month}</span>
                        </div>
                        {/* Date rows */}
                        {monthMap[month].map((dr, di) => (
                          <div key={di} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: di % 2 === 0 ? '#fff' : '#fafafa', borderBottom: di < monthMap[month].length - 1 ? '1px solid #f3f4f6' : 'none', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2e9e7a', flexShrink: 0 }} />
                              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{fmtRange(dr)}</span>
                            </div>
                            <a
                              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I want to reserve the following package:\n\nPackage: ${pkg.title}\nPackage ID: ${pkg.id}\nDate: ${fmtRange(dr)}`)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ padding: '7px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#2e9e7a,#1e7a5e)', color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                            >
                              Reserve
                            </a>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Itinerary */}
            {pkg.itinerary?.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', marginBottom: 18 }}>
                  Day-wise Itinerary
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pkg.itinerary.map((day, i) => {
                    const acts = (day.activities || []).map(a => typeof a === 'string' ? { time: '', emoji: '', title: a, details: [], tags: [] } : a)
                    return (
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
                          <div style={{ padding: '0 16px 20px', borderTop: '1px solid #f9f0eb' }}>
                            {day.image && (
                              <img src={day.image} alt={day.title} onError={e => e.target.style.display = 'none'}
                                style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 10, marginTop: 14, marginBottom: 14 }} />
                            )}
                            {day.description && (
                              <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.7, marginTop: 14, marginBottom: acts.length ? 20 : 0, padding: '0 2px' }}>{day.description}</p>
                            )}
                            {/* Timeline */}
                            {acts.length > 0 && (
                              <div style={{ position: 'relative', paddingLeft: 0, marginTop: day.description ? 0 : 14 }}>
                                {/* Vertical line */}
                                <div style={{ position: 'absolute', left: 44, top: 0, bottom: day.hotel ? 40 : 0, width: 2, background: '#f0ebe1', zIndex: 0 }} />
                                {acts.map((act, ai) => (
                                  <div key={ai} style={{ display: 'flex', gap: 0, marginBottom: 20, position: 'relative' }}>
                                    {/* Time bubble */}
                                    <div style={{ flexShrink: 0, width: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1 }}>
                                      {act.time ? (
                                        <div style={{ background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                          {act.time}
                                        </div>
                                      ) : (
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e8520a', border: '2px solid #fff', boxShadow: '0 0 0 2px #fbd0b5', marginTop: 6 }} />
                                      )}
                                    </div>
                                    {/* Activity card */}
                                    <div style={{ flex: 1, background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                      {/* Title */}
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                                        {act.emoji && <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{act.emoji}</span>}
                                        <span style={{ fontWeight: 700, fontSize: 13, color: '#111', lineHeight: 1.4 }}>{act.title}</span>
                                      </div>
                                      {/* Checkmark details */}
                                      {(act.details || []).filter(Boolean).length > 0 && (
                                        <ul style={{ margin: '0 0 8px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          {act.details.filter(Boolean).map((det, ki) => (
                                            <li key={ki} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#6b7280' }}>
                                              <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                                              <span style={{ lineHeight: 1.5 }}>{det}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                      {/* Tags */}
                                      {(act.tags || []).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                          {act.tags.map((tag, ti) => (
                                            <span key={ti} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>{tag}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {/* Overnight stay */}
                                {day.hotel && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4 }}>
                                    <span style={{ fontSize: 16 }}>🛏</span>
                                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Overnight stay at <span style={{ color: '#111' }}>{day.hotel}</span></span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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

            {/* Price Breakdown */}
            {hasBreakdown && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: '#111', margin: 0 }}>Price Breakdown</h2>
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waChanges)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    <MessageCircle size={15} /> Request Changes
                  </a>
                </div>
                <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 16, padding: isMobile ? 18 : 22, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  {occSummary && <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>{occSummary}</div>}
                  {Number(pkg.adults) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottom: Number(pkg.childPrice) > 0 && Number(pkg.children) > 0 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ fontSize: 15, color: '#374151' }}>Price per adult</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{fmt(pkg.salePrice)}</span>
                    </div>
                  )}
                  {Number(pkg.childPrice) > 0 && Number(pkg.children) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, color: '#374151' }}>Price per child</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{fmt(pkg.childPrice)}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Note */}
            {pkg.note?.trim() && (
              <section style={{ marginBottom: 28 }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: '#92400e', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}><strong>Note: </strong>{pkg.note}</p>
                </div>
              </section>
            )}

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
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{Number(pkg.childPrice) > 0 ? 'Per Adult' : pkg.priceNote}</div>
                    {Number(pkg.childPrice) > 0 && (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 8 }}>
                        {fmt(pkg.childPrice)} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>Per Child</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.15)' }}>
                      <Info size={13} style={{ color: '#fff', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>Rate may change based on your customization.</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {(Number(pkg.rooms) > 0 || Number(pkg.adults) > 0 || Number(pkg.children) > 0) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        {[
                          { Icon: BedDouble, n: pkg.rooms, s: 'Room', p: 'Rooms' },
                          { Icon: Users, n: pkg.adults, s: 'Adult', p: 'Adults' },
                          { Icon: Baby, n: pkg.children, s: 'Child', p: 'Children' },
                        ].filter(({ n }) => Number(n) > 0).map(({ Icon, n, s, p }) => (
                          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: '#f5f0e8', color: '#9a3412', fontSize: 12.5, fontWeight: 700 }}>
                            <Icon size={14} /> {n} {Number(n) !== 1 ? p : s}
                          </span>
                        ))}
                      </div>
                    )}
                    {[
                      { l: 'Duration', v: pkg.duration },
                      { l: 'Destination', v: pkg.destination },
                      { l: 'Stay', v: pkg.hotels },
                    ].filter(({ v }) => v).map(({ l, v }) => (
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
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waMsg)}`}
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
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waMsg)}`}
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
