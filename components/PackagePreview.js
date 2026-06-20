'use client'
import { Clock, MapPin, Tag, Check, CalendarDays, Users, Baby, BedDouble, Info } from 'lucide-react'

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }

function fmtRange(start, end) {
  if (!start && !end) return ''
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const f = d => { const dt = new Date(d + 'T00:00:00'); return `${dt.getDate()} ${M[dt.getMonth()]}, ${dt.getFullYear()}` }
  const s = start ? f(start) : '', e = end ? f(end) : ''
  return s && e ? `${s} – ${e}` : s || e
}
function getDR(dr) { return (dr && typeof dr === 'object') ? dr : { start: '', end: dr || '' } }

// Read-only rendering of a package form, used to preview before submitting.
export default function PackagePreview({ pkg }) {
  const hero = pkg.heroImage || pkg.image
  const orig = Number(pkg.originalPrice) || 0
  const sale = Number(pkg.salePrice) || 0
  const save = orig > sale ? orig - sale : 0
  const lists = [
    { label: 'Highlights', items: pkg.highlights, icon: '★', color: '#1e3a5f' },
    { label: 'Inclusions', items: pkg.inclusions, icon: '✓', color: '#22c55e' },
    { label: 'Exclusions', items: pkg.exclusions, icon: '✕', color: '#ef4444' },
  ].filter(l => (l.items || []).filter(Boolean).length)

  return (
    <div style={{ fontSize: 14, color: '#111' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 200, borderRadius: 14, overflow: 'hidden', background: '#f3f4f6' }}>
        {hero
          ? <img src={hero} alt={pkg.title} onError={e => { e.target.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>No image added</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />
        {pkg.destination && (
          <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: (pkg.badgeColor || '#2e9e7a') + 'dd', color: '#fff', fontSize: 11, fontWeight: 600 }}>
            <MapPin size={10} /> {pkg.destination}
          </span>
        )}
      </div>

      {/* Title block */}
      <div style={{ marginTop: 16 }}>
        {pkg.duration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
            <Clock size={12} /> {pkg.duration}
          </div>
        )}
        <h2 style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.25, color: '#111' }}>{pkg.title || 'Untitled package'}</h2>
        {pkg.subtitle && <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{pkg.subtitle}</p>}
        {pkg.hotels && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f5f0e8', borderRadius: 999, fontSize: 12, color: '#6b7280', marginTop: 10 }}>
            <Tag size={11} /> {pkg.hotels}
          </div>
        )}
        {(Number(pkg.adults) > 0 || Number(pkg.children) > 0 || Number(pkg.rooms) > 0) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {Number(pkg.adults) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f0f4f8', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#1e3a5f' }}><Users size={12} /> {pkg.adults} Adult{Number(pkg.adults) !== 1 ? 's' : ''}</span>}
            {Number(pkg.children) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f0f4f8', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#1e3a5f' }}><Baby size={12} /> {pkg.children} Child{Number(pkg.children) !== 1 ? 'ren' : ''}</span>}
            {Number(pkg.rooms) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f0f4f8', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#1e3a5f' }}><BedDouble size={12} /> {pkg.rooms} Room{Number(pkg.rooms) !== 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
        {orig > 0 && orig !== sale && <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(orig)}</span>}
        <span style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>{fmt(sale)}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>/ {pkg.priceNote || 'Per Person'}</span>
        {save > 0 && <span style={{ fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 999 }}>SAVE {fmt(save)}</span>}
      </div>

      {/* Price breakdown */}
      {Number(pkg.childPrice) > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 13, color: '#374151' }}>
          <span>Adult: <strong style={{ color: '#111' }}>{fmt(sale)}</strong></span>
          <span>Child: <strong style={{ color: '#111' }}>{fmt(pkg.childPrice)}</strong></span>
        </div>
      )}

      {/* Homestay / Houseboat details */}
      {(pkg.category === 'homestay' || pkg.category === 'houseboat') && (
        <>
          {pkg.address && (
            <div style={{ marginTop: 14, fontSize: 13, color: '#374151', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <MapPin size={14} style={{ color: '#9ca3af', flexShrink: 0, marginTop: 2 }} /> {pkg.address}
            </div>
          )}
          {(pkg.amenities || []).length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Amenities</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(pkg.amenities || []).map((a, i) => <span key={i} style={{ fontSize: 12, color: '#374151', background: '#f5f0e8', borderRadius: 999, padding: '3px 10px' }}>{a}</span>)}
              </div>
            </div>
          )}
          {(pkg.roomTypes || []).filter(r => r.name || r.price).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Rooms</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(pkg.roomTypes || []).filter(r => r.name || r.price).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, border: '1px solid #f3f4f6', borderRadius: 10, padding: 8, background: '#fafafa' }}>
                    {(() => { const im = (r.images || []).filter(Boolean)[0] || r.image; return im ? <img src={im} alt="" onError={e => { e.target.style.display = 'none' }} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> : null })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{r.name || 'Room'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{[r.bed, r.size && `${r.size}m²`, Number(r.guests) > 0 && `${r.guests} guests`].filter(Boolean).join(' · ')}</div>
                    </div>
                    {Number(r.price) > 0 && <div style={{ fontWeight: 700, fontSize: 14, color: '#111', whiteSpace: 'nowrap' }}>{fmt(r.price)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(pkg.checkIn || pkg.checkOut) && (
            <div style={{ marginTop: 14, fontSize: 13, color: '#374151' }}>
              <span style={{ fontWeight: 700 }}>Check-in/out: </span>{[pkg.checkIn, pkg.checkOut].filter(Boolean).join(' → ')}
            </div>
          )}
        </>
      )}

      {/* Overview */}
      {pkg.overview && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{(pkg.category === 'homestay' || pkg.category === 'houseboat') ? 'Description' : 'Overview'}</div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{pkg.overview}</p>
        </div>
      )}

      {/* Note */}
      {pkg.note?.trim() && (
        <div style={{ marginTop: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Note</div>
            <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{pkg.note}</p>
          </div>
        </div>
      )}

      {/* Lists */}
      {lists.map(({ label, items, icon, color }) => (
        <div key={label} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(items || []).filter(Boolean).map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                <span style={{ color, fontWeight: 700, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                <span>{it}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Available dates */}
      {(pkg.availableDates || []).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Available Dates</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(pkg.availableDates || []).map((g, gi) => (
              <div key={gi} style={{ border: '1px solid #f3f4f6', borderRadius: 10, padding: 10, background: '#fafafa' }}>
                {g.month && <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>{g.month}</div>}
                {(g.dates || []).map((dr, di) => {
                  const d = getDR(dr)
                  return (d.start || d.end) ? (
                    <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                      <CalendarDays size={12} style={{ color: '#9ca3af' }} /> {fmtRange(d.start, d.end)}
                    </div>
                  ) : null
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary */}
      {(pkg.itinerary || []).some(d => d.title || d.description || (d.activities || []).some(a => (typeof a === 'string' ? a : a.title))) && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Itinerary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(pkg.itinerary || []).map((day, di) => (
              <div key={di} style={{ border: '1px solid #f3f4f6', borderRadius: 12, padding: 14, background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: day.description ? 6 : 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{day.day}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{day.title || `Day ${day.day}`}</div>
                </div>
                {day.description && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 8 }}>{day.description}</p>}
                {day.image && <img src={day.image} alt={`Day ${day.day}`} onError={e => { e.target.style.display = 'none' }} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                {day.hotel && <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>🛏 {day.hotel}</div>}
                {(day.activities || []).map((act, ai) => {
                  const a = typeof act === 'string' ? { title: act, details: [], tags: [] } : act
                  if (!a.title && !(a.details || []).filter(Boolean).length) return null
                  return (
                    <div key={ai} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.time && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>{a.time}</span>}
                        {a.emoji && <span style={{ fontSize: 15 }}>{a.emoji}</span>}
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{a.title}</span>
                      </div>
                      {(a.details || []).filter(Boolean).map((det, ki) => (
                        <div key={ki} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          <Check size={12} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} /> {det}
                        </div>
                      ))}
                      {(a.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                          {(a.tags || []).map((tag, ti) => (
                            <span key={ti} style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
