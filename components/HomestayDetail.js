'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Phone, MessageCircle, MapPin, Check, Star, Clock, Info, ArrowLeft,
  Wifi, Wind, Ban, Waves, Car, Utensils, Tv, Coffee, Plane, Train, Baby, BedDouble, Maximize, Users,
} from 'lucide-react'
import EnquiryForm from '@/components/EnquiryForm'

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }

function amenityIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('wifi') || n.includes('wi-fi')) return Wifi
  if (n.includes('smok')) return Ban
  if (n.includes('ac') || n.includes('air')) return Wind
  if (n.includes('pool')) return Waves
  if (n.includes('park')) return Car
  if (n.includes('break') || n.includes('meal') || n.includes('dining') || n.includes('restaurant')) return Utensils
  if (n.includes('tv')) return Tv
  if (n.includes('coffee') || n.includes('tea')) return Coffee
  return Check
}
function nearbyIcon(type, name = '') {
  if (type === 'transport') return name.toLowerCase().includes('airport') ? Plane : Train
  if (type === 'dining') return Utensils
  return MapPin
}

const NEARBY_TABS = [
  { value: 'transport', label: 'Transport' },
  { value: 'landmark', label: 'Landmarks' },
  { value: 'dining', label: 'Dining' },
]

export default function HomestayDetail({ pkg, phone, whatsapp, isMobile }) {
  const rooms = (pkg.roomTypes || []).filter(r => r.name || r.price)
  const gallery = [pkg.heroImage, pkg.image, ...rooms.map(r => r.image)].filter(Boolean)
  const [mainImg, setMainImg] = useState(gallery[0] || '')
  const nearby = pkg.nearby || []
  const firstNearbyType = NEARBY_TABS.find(t => nearby.some(n => n.type === t.value))?.value || 'landmark'
  const [nearbyTab, setNearbyTab] = useState(firstNearbyType)

  const star = Math.round(Number(pkg.starRating) || 0)
  const score = Number(pkg.rating) || 0
  const roomPrices = rooms.map(r => Number(r.price)).filter(p => p > 0)
  const fromPrice = roomPrices.length ? Math.min(...roomPrices) : Number(pkg.salePrice) || 0
  const mapHref = pkg.mapUrl || (pkg.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pkg.address)}` : '')

  const roomWa = (room) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'd like to book the "${room.name}" room at ${pkg.title} (${pkg.id})${room.price ? ` — ${fmt(room.price)}` : ''}.`)}`
  const heading = { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: isMobile ? 20 : 26, color: '#111', margin: 0 }
  const wrap = { maxWidth: 920, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }

  return (
    <div style={{ background: '#fff', paddingBottom: 90 }}>
      {/* Gallery (dark band clears the fixed navbar) */}
      <div style={{ background: '#0f172a', paddingTop: isMobile ? 68 : 88 }}>
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ position: 'relative', height: isMobile ? '40vh' : '56vh', minHeight: 260, background: '#0f172a', overflow: 'hidden' }}>
            {mainImg
              ? <img src={mainImg} alt={pkg.title} onError={e => { e.target.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No images</div>}
            <Link href="/packages" style={{ position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', textDecoration: 'none' }}>
              <ArrowLeft size={18} />
            </Link>
            {gallery.length > 1 && (
              <span style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                {Math.max(1, gallery.indexOf(mainImg) + 1)}/{gallery.length}
              </span>
            )}
          </div>
        </div>
      </div>
      {gallery.length > 1 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 14px' }}>
          {gallery.map((g, i) => (
            <img key={i} src={g} alt="" onClick={() => setMainImg(g)} onError={e => { e.target.style.display = 'none' }}
              style={{ width: 84, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'pointer', border: g === mainImg ? '2px solid #e8520a' : '2px solid transparent' }} />
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ ...wrap, paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', rowGap: 6 }}>
          <h1 style={{ ...heading, lineHeight: 1.2 }}>{pkg.title}</h1>
          {star > 0 && (
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
              {Array.from({ length: star }).map((_, i) => <Star key={i} size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />)}
            </span>
          )}
        </div>
        {pkg.address && (
          <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
            {pkg.address}
            {mapHref && <> · <a href={mapHref} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>View map</a></>}
          </p>
        )}
        {score > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 14, background: '#eef2ff', borderRadius: 999, padding: '6px 14px 6px 6px' }}>
            <span style={{ background: '#1d4ed8', color: '#fff', fontWeight: 800, fontSize: 14, borderRadius: 999, padding: '4px 10px' }}>{score}/10</span>
            {pkg.ratingLabel && <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 14 }}>{pkg.ratingLabel}</span>}
            <span style={{ color: '#6b7280', fontSize: 13 }}>Rating from third party</span>
          </div>
        )}
      </div>

      {/* Great Location */}
      {nearby.length > 0 && (
        <div style={{ ...wrap, marginTop: 28 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 14 }}>Great Location</h2>
          {nearby.slice(0, 3).map((n, i) => {
            const Icon = nearbyIcon(n.type, n.name)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: i < Math.min(3, nearby.length) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#374151', fontSize: 14 }}><Icon size={18} style={{ color: '#6b7280', flexShrink: 0 }} /> {n.name}</span>
                {n.distance && <span style={{ color: '#6b7280', fontSize: 14, whiteSpace: 'nowrap' }}>{n.distance}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Choose Your Room */}
      {rooms.length > 0 && (
        <div id="rooms" style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, marginBottom: 16 }}>Choose Your Room</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {rooms.map((room, i) => {
              const facts = [
                room.bed && { Icon: BedDouble, t: room.bed },
                room.size && { Icon: Maximize, t: `${room.size}m²` },
                Number(room.guests) > 0 && { Icon: Users, t: `${room.guests} guest${Number(room.guests) !== 1 ? 's' : ''}` },
              ].filter(Boolean)
              return (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  {room.image && <img src={room.image} alt={room.name} onError={e => { e.target.style.display = 'none' }} style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                  <div style={{ padding: 18 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 10 }}>{room.name}</h3>
                    {facts.length > 0 && (
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                        {facts.map(({ Icon, t }, j) => (
                          <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#374151', fontSize: 13.5 }}><Icon size={16} style={{ color: '#6b7280' }} /> {t}</span>
                        ))}
                      </div>
                    )}
                    {(room.amenities || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        {(room.amenities || []).map((a, j) => {
                          const Icon = amenityIcon(a)
                          return <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#374151', background: '#f5f0e8', borderRadius: 999, padding: '4px 10px' }}><Icon size={13} /> {a}</span>
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        {Number(room.guests) > 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>Price for {room.guests} guest{Number(room.guests) !== 1 ? 's' : ''}</div>}
                        {Number(room.price) > 0 && <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{fmt(room.price)}</div>}
                      </div>
                      <a href={roomWa(room)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                        <MessageCircle size={16} /> Book
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Amenities */}
      {(pkg.amenities || []).length > 0 && (
        <div style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 14 }}>Amenities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {(pkg.amenities || []).map((a, i) => {
              const Icon = amenityIcon(a)
              return <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14 }}><Icon size={17} style={{ color: '#16a34a' }} /> {a}</span>
            })}
          </div>
        </div>
      )}

      {/* Nearby Attractions */}
      {nearby.length > 0 && (
        <div style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 14 }}>Nearby Attractions</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {NEARBY_TABS.filter(t => nearby.some(n => n.type === t.value)).map(t => (
              <button key={t.value} onClick={() => setNearbyTab(t.value)}
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${nearbyTab === t.value ? '#2563eb' : '#e5e7eb'}`,
                  background: nearbyTab === t.value ? '#eef2ff' : '#fff', color: nearbyTab === t.value ? '#2563eb' : '#374151' }}>
                {t.label}
              </button>
            ))}
          </div>
          {nearby.filter(n => n.type === nearbyTab).map((n, i) => {
            const Icon = nearbyIcon(n.type, n.name)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#374151', fontSize: 14 }}><Icon size={18} style={{ color: '#6b7280', flexShrink: 0 }} /> {n.name}</span>
                {n.distance && <span style={{ color: '#6b7280', fontSize: 14, whiteSpace: 'nowrap' }}>{n.distance}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Hotel Policy */}
      {(pkg.checkIn || pkg.checkOut || pkg.frontDesk || pkg.childPolicy || pkg.cribsExtraBeds) && (
        <div style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 16 }}>Hotel Policy</h2>
          {(pkg.checkIn || pkg.checkOut) && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#111', marginBottom: 8 }}><Clock size={18} /> Check-in and Check-out Times</div>
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
                {pkg.checkIn && <div>Check-in: {pkg.checkIn}</div>}
                {pkg.checkOut && <div>Check-out: {pkg.checkOut}</div>}
              </div>
              {pkg.frontDesk && <p style={{ color: '#374151', fontSize: 14, marginTop: 10 }}>Front desk hours: {pkg.frontDesk}</p>}
            </div>
          )}
          {pkg.childPolicy && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#111', marginBottom: 8 }}><Baby size={18} /> Child policies</div>
              <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{pkg.childPolicy}</p>
            </div>
          )}
          {pkg.cribsExtraBeds && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#111', marginBottom: 8 }}><BedDouble size={18} /> Cribs and Extra Beds</div>
              <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{pkg.cribsExtraBeds}</p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {pkg.overview && (
        <div style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 14 }}>Description</h2>
          <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{pkg.overview}</p>
        </div>
      )}

      {/* Fine Print */}
      {pkg.finePrint && (
        <div style={{ ...wrap, marginTop: 36 }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 14 }}>Fine Print</h2>
          <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{pkg.finePrint}</p>
        </div>
      )}

      {/* Note */}
      {pkg.note?.trim() && (
        <div style={{ ...wrap, marginTop: 28 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Info size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: '#92400e', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}><strong>Note: </strong>{pkg.note}</p>
          </div>
        </div>
      )}

      {/* Enquiry */}
      <div id="enquiry" style={{ ...wrap, marginTop: 40 }}>
        <div style={{ background: '#f9fafb', borderRadius: 20, padding: isMobile ? 20 : 28, border: '1px solid #f3f4f6' }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>Send an Enquiry</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 18 }}>We&rsquo;ll get back to you within a few hours.</p>
          <EnquiryForm pkg={pkg} isMobile={isMobile} />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {fromPrice > 0 && <>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>From</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#e8520a', lineHeight: 1 }}>{fmt(fromPrice)}</div>
            </>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href={`tel:+${phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 999, border: '1.5px solid #e5e7eb', color: '#111', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <Phone size={16} /> Call
            </a>
            <a href={rooms.length ? '#rooms' : '#enquiry'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {rooms.length ? 'Select Room' : 'Enquire'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
