'use client'
import { Plus, Trash2, X } from 'lucide-react'
import TagSelector from '@/components/TagSelector'

const NEARBY_TYPES = [
  { value: 'transport', label: 'Transport' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'dining', label: 'Dining' },
]

// Shared homestay form fields, used by both the admin and agency package forms.
// Props: form, setForm, S (shared style object with input/label), pkgOptions, onOptionsUpdate.
export default function HomestayFields({ form, setForm, S, pkgOptions = {}, onOptionsUpdate }) {
  // ── Room types ──
  const addRoom = () => setForm(f => ({ ...f, roomTypes: [...(f.roomTypes || []), { name: '', images: ['', '', ''], bed: '', size: '', guests: '', price: '', amenities: [] }] }))
  const removeRoom = (i) => setForm(f => ({ ...f, roomTypes: (f.roomTypes || []).filter((_, j) => j !== i) }))
  const roomChange = (i, field, val) => setForm(f => ({ ...f, roomTypes: (f.roomTypes || []).map((r, j) => j === i ? { ...r, [field]: val } : r) }))
  const roomImageChange = (i, idx, val) => setForm(f => ({ ...f, roomTypes: (f.roomTypes || []).map((r, j) => { if (j !== i) return r; const imgs = [...(r.images || ['', '', ''])]; while (imgs.length < 3) imgs.push(''); imgs[idx] = val; return { ...r, images: imgs } }) }))

  // ── Nearby places ──
  const addNearby = () => setForm(f => ({ ...f, nearby: [...(f.nearby || []), { type: 'landmark', name: '', distance: '' }] }))
  const removeNearby = (i) => setForm(f => ({ ...f, nearby: (f.nearby || []).filter((_, j) => j !== i) }))
  const nearbyChange = (i, field, val) => setForm(f => ({ ...f, nearby: (f.nearby || []).map((n, j) => j === i ? { ...n, [field]: val } : n) }))

  const sectionTitle = { fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 10, marginTop: 4 }

  return (
    <div>
      {/* Property basics */}
      <div style={sectionTitle}>Property</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Address</label>
          <input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={S.input} placeholder="e.g. 388 Thiruvampadi Road, Varkala, Kerala, 695141" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Map URL (optional)</label>
          <input value={form.mapUrl || ''} onChange={e => setForm(f => ({ ...f, mapUrl: e.target.value }))} style={S.input} placeholder="Google Maps link" />
        </div>
        <div>
          <label style={S.label}>Star Rating (1–5)</label>
          <input type="number" min="0" max="5" value={form.starRating || ''} onChange={e => setForm(f => ({ ...f, starRating: e.target.value }))} style={S.input} placeholder="3" />
        </div>
        <div>
          <label style={S.label}>Review Score (0–10)</label>
          <input type="number" min="0" max="10" step="0.1" value={form.rating || ''} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} style={S.input} placeholder="8.2" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Review Label</label>
          <input value={form.ratingLabel || ''} onChange={e => setForm(f => ({ ...f, ratingLabel: e.target.value }))} style={S.input} placeholder="e.g. Very good" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Amenities</label>
          <TagSelector
            type="amenity"
            selected={form.amenities || []}
            onChange={val => setForm(f => ({ ...f, amenities: val }))}
            options={pkgOptions.amenity || []}
            onOptionsUpdate={onOptionsUpdate}
            color="#2563eb"
            placeholder="Type to add an amenity (e.g. Pool)..."
          />
        </div>
      </div>

      {/* Rooms */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={sectionTitle}>Rooms</div>
        <button type="button" onClick={addRoom} style={{ fontSize: 12, fontWeight: 600, color: '#e8520a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add Room
        </button>
      </div>
      {(form.roomTypes || []).length === 0 && (
        <p style={{ fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, padding: '10px 14px', margin: '0 0 14px' }}>No rooms yet. Click &ldquo;Add Room&rdquo; to add room types guests can book.</p>
      )}
      {(form.roomTypes || []).map((room, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Room {i + 1}</span>
            <button type="button" onClick={() => removeRoom(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Room Name</label>
              <input value={room.name} onChange={e => roomChange(i, 'name', e.target.value)} style={S.input} placeholder="e.g. Executive Room" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Images (up to 3)</label>
              {[0, 1, 2].map(idx => {
                const val = (room.images || [])[idx] ?? (idx === 0 ? (room.image || '') : '')
                return (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <input value={val} onChange={e => roomImageChange(i, idx, e.target.value)} style={S.input} placeholder={`Image ${idx + 1} URL`} />
                    {val && <img src={val} alt="" onError={e => { e.target.style.display = 'none' }} style={{ marginTop: 6, width: '100%', height: 70, objectFit: 'cover', borderRadius: 8 }} />}
                  </div>
                )
              })}
            </div>
            <div>
              <label style={S.label}>Bed</label>
              <input value={room.bed} onChange={e => roomChange(i, 'bed', e.target.value)} style={S.input} placeholder="1 double bed" />
            </div>
            <div>
              <label style={S.label}>Size (m²)</label>
              <input value={room.size} onChange={e => roomChange(i, 'size', e.target.value)} style={S.input} placeholder="11" />
            </div>
            <div>
              <label style={S.label}>Max Guests</label>
              <input type="number" min="0" value={room.guests} onChange={e => roomChange(i, 'guests', e.target.value)} style={S.input} placeholder="2" />
            </div>
            <div>
              <label style={S.label}>Price (₹)</label>
              <input type="number" min="0" value={room.price} onChange={e => roomChange(i, 'price', e.target.value)} style={S.input} placeholder="2000" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Room Amenities</label>
              <TagSelector
                type="amenity"
                selected={room.amenities || []}
                onChange={val => roomChange(i, 'amenities', val)}
                options={pkgOptions.amenity || []}
                onOptionsUpdate={onOptionsUpdate}
                color="#2563eb"
                placeholder="Type to add an amenity..."
              />
            </div>
          </div>
        </div>
      ))}

      {/* Nearby */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 }}>
        <div style={sectionTitle}>Nearby Places</div>
        <button type="button" onClick={addNearby} style={{ fontSize: 12, fontWeight: 600, color: '#e8520a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add Place
        </button>
      </div>
      {(form.nearby || []).map((n, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <select value={n.type} onChange={e => nearbyChange(i, 'type', e.target.value)} style={{ ...S.input, width: 120, flexShrink: 0, cursor: 'pointer' }}>
            {NEARBY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={n.name} onChange={e => nearbyChange(i, 'name', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="Place name (e.g. Varkala Beach)" />
          <input value={n.distance} onChange={e => nearbyChange(i, 'distance', e.target.value)} style={{ ...S.input, width: 90, flexShrink: 0 }} placeholder="1.0 km" />
          <button type="button" onClick={() => removeNearby(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}><X size={14} /></button>
        </div>
      ))}

      {/* Policies */}
      <div style={{ ...sectionTitle, marginTop: 18 }}>Policies</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={S.label}>Check-in</label>
          <input value={form.checkIn || ''} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} style={S.input} placeholder="12:00–18:00" />
        </div>
        <div>
          <label style={S.label}>Check-out</label>
          <input value={form.checkOut || ''} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} style={S.input} placeholder="09:00–10:00" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Front Desk Hours</label>
          <input value={form.frontDesk || ''} onChange={e => setForm(f => ({ ...f, frontDesk: e.target.value }))} style={S.input} placeholder="24/7" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Child Policy</label>
          <textarea rows={2} value={form.childPolicy || ''} onChange={e => setForm(f => ({ ...f, childPolicy: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }} placeholder="e.g. Children of all ages are welcome. Additional fees may apply for extra beds." />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Cribs & Extra Beds</label>
          <textarea rows={2} value={form.cribsExtraBeds || ''} onChange={e => setForm(f => ({ ...f, cribsExtraBeds: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }} placeholder="e.g. For all room types, cribs and extra beds cannot be added." />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Fine Print</label>
          <textarea rows={2} value={form.finePrint || ''} onChange={e => setForm(f => ({ ...f, finePrint: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }} placeholder="e.g. No pets and no service animals are allowed at this property." />
        </div>
      </div>
    </div>
  )
}
