'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Package, LogOut, X, Check, Trash2, Eye, Clock, CheckCircle, XCircle, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'group', label: 'Group Package' },
  { value: 'homestay', label: 'Home Stay' },
  { value: 'other', label: 'Other' },
]

const EMPTY_PKG = {
  id: '', destination: '', badge: '', badgeColor: '#2e9e7a',
  duration: '3 Days & 2 Nights', title: '', subtitle: '', hotels: '',
  originalPrice: '', salePrice: '', priceNote: 'Per Person',
  image: '', heroImage: '', overview: '', category: 'group',
  highlights: [''], inclusions: [''], exclusions: [''],
  itinerary: [{ day: 1, title: '', description: '', activities: [''] }],
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  approved: { label: 'Live',         color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle },
  rejected: { label: 'Rejected',     color: '#ef4444', bg: '#fef2f2', icon: XCircle },
}

export default function AgencyDashboard() {
  const router = useRouter()
  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_PKG)
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [agencyName, setAgencyName] = useState('')

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/agency/packages')
      if (res.status === 401) { router.push('/agency'); return }
      if (res.ok) setPackages(await res.json())
    } catch {}
    setLoaded(true)
  }, [router])

  useEffect(() => {
    fetchPackages()
    fetch('/api/destinations').then(r => r.ok ? r.json() : []).then(setDestinations).catch(() => {})
    // Read agency name from cookie-derived API call
    fetch('/api/agency/packages').then(r => {
      if (r.status === 401) router.push('/agency')
    })
  }, [fetchPackages, router])

  const S = {
    page:        { minHeight: '100vh', background: '#f0ece4' },
    topbar:      { position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #f3f4f6', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
    topbarInner: { maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:        { maxWidth: 1100, margin: '0 auto', padding: '28px 20px' },
    card:        { background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' },
    btn:         (bg = '#e8520a', col = '#fff') => ({ padding: '8px 16px', borderRadius: 10, background: bg, color: col, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
    input:       { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' },
    label:       { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' },
    overlay:     { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' },
    modal:       { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', marginBottom: 32 },
  }

  const logout = async () => {
    await fetch('/api/auth/agency-logout', { method: 'POST' })
    router.push('/agency')
  }

  const arrChange = (field, idx, val) => { const a = [...(form[field] || [])]; a[idx] = val; setForm(f => ({ ...f, [field]: a })) }
  const arrAdd = (field) => setForm(f => ({ ...f, [field]: [...(f[field] || []), ''] }))
  const arrDel = (field, idx) => setForm(f => ({ ...f, [field]: (f[field] || []).filter((_, i) => i !== idx) }))
  const itinChange = (di, field, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => i === di ? { ...d, [field]: val } : d) }))
  const actChange = (di, ai, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const a = [...(d.activities || [])]; a[ai] = val; return { ...d, activities: a } }) }))
  const addDay = () => setForm(f => ({ ...f, itinerary: [...(f.itinerary || []), { day: (f.itinerary || []).length + 1, title: '', description: '', activities: [''] }] }))
  const removeDay = (idx) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).filter((_, i) => i !== idx) }))

  const openAdd = () => {
    const first = destinations[0]
    setForm({ ...EMPTY_PKG, id: 'pkg-' + Date.now(), destination: first?.name ?? '', badgeColor: first?.color ?? '#2e9e7a' })
    setTab('basic')
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error('Package title is required'); return }
    if (!form.salePrice) { toast.error('Sale price is required'); return }
    const pkg = {
      ...form,
      originalPrice: Number(form.originalPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      highlights: (form.highlights || []).filter(Boolean),
      inclusions: (form.inclusions || []).filter(Boolean),
      exclusions: (form.exclusions || []).filter(Boolean),
      itinerary: (form.itinerary || []).map(d => ({ ...d, activities: (d.activities || []).filter(Boolean) })),
    }
    setSaving(true)
    try {
      const res = await fetch('/api/agency/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      await fetchPackages()
      setModal(null)
      toast.success('Package submitted for approval!')
    } catch (err) {
      toast.error(err.message || 'Failed to submit package')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: packages.length,
    pending: packages.filter(p => p.status === 'pending').length,
    approved: packages.filter(p => p.status === 'approved').length,
    rejected: packages.filter(p => p.status === 'rejected').length,
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ece4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #f0ebe1', borderTop: '3px solid #1e3a5f', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topbarInner}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Agency Dashboard</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Green Kerala Trips</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/" target="_blank" style={{ ...S.btn('#f3f4f6', '#555'), textDecoration: 'none' }}>
              <ExternalLink size={13} /> View Site
            </Link>
            <button onClick={logout} style={S.btn('#fef2f2', '#dc2626')}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: '#1e3a5f' },
            { label: 'Under Review', value: stats.pending, color: '#f59e0b' },
            { label: 'Live', value: stats.approved, color: '#22c55e' },
            { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#92400e' }}>
          <Clock size={15} style={{ flexShrink: 0, marginTop: 1, color: '#f59e0b' }} />
          <span>Packages you submit go to admin for review before appearing live on the website.</span>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={openAdd} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Package
          </button>
        </div>

        {/* Table */}
        <div style={S.card}>
          {packages.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: 15 }}>No packages yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Submit your first package to get started.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    {['Package', 'Category', 'Destination', 'Price', 'Status'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: i === 4 ? 'right' : 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, idx) => {
                    const sc = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending
                    const SI = sc.icon
                    const cat = CATEGORIES.find(c => c.value === pkg.category)
                    return (
                      <tr key={pkg.id} style={{ borderBottom: idx < packages.length - 1 ? '1px solid #f9fafb' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {pkg.image && <div style={{ width: 48, height: 38, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                              <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                            </div>}
                            <div>
                              <div style={{ fontWeight: 600, color: '#111' }}>{pkg.title}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>{pkg.subtitle}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{cat?.label || pkg.category}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280' }}>{pkg.destination}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700 }}>{fmt(pkg.salePrice)}</div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>
                            <SI size={11} /> {sc.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Package Modal */}
      {modal === 'form' && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Submit New Package</h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ background: '#fffbeb', padding: '8px 20px', fontSize: 12, color: '#92400e', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Clock size={12} /> Your package will be reviewed by admin before going live.
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
              {[['basic', 'Basic'], ['itinerary', 'Itinerary'], ['media', 'Media & Lists']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === k ? '#1e3a5f' : 'transparent'}`, color: tab === k ? '#1e3a5f' : '#9ca3af' }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ padding: 20, maxHeight: '55vh', overflowY: 'auto' }}>
              {tab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={S.input} placeholder="e.g. Munnar Tea Estate Trek" />
                  </div>
                  <div>
                    <label style={S.label}>Subtitle</label>
                    <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} style={S.input} placeholder="e.g. Misty mornings in the hills" />
                  </div>
                  <div>
                    <label style={S.label}>Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...S.input, cursor: 'pointer' }}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Destination</label>
                    <select value={form.destination} onChange={e => { const d = destinations.find(d => d.name === e.target.value); setForm(f => ({ ...f, destination: e.target.value, badgeColor: d?.color ?? f.badgeColor })) }} style={{ ...S.input, cursor: 'pointer' }}>
                      <option value="">Select destination</option>
                      {destinations.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Duration</label>
                    <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={S.input} placeholder="e.g. 3 Days & 2 Nights" />
                  </div>
                  <div>
                    <label style={S.label}>Stay / Hotels</label>
                    <input value={form.hotels} onChange={e => setForm(f => ({ ...f, hotels: e.target.value }))} style={S.input} placeholder="e.g. 2N Munnar · 1N Thekkady" />
                  </div>
                  <div>
                    <label style={S.label}>Original Price (₹) *</label>
                    <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} style={S.input} placeholder="15000" />
                  </div>
                  <div>
                    <label style={S.label}>Sale Price (₹) *</label>
                    <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} style={S.input} placeholder="12000" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Overview</label>
                    <textarea rows={3} value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} placeholder="Describe the package..." />
                  </div>
                </div>
              )}

              {tab === 'itinerary' && (
                <div>
                  {(form.itinerary || []).map((day, di) => (
                    <div key={di} style={{ border: '1px solid #f3f4f6', borderRadius: 12, padding: 14, marginBottom: 10, background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day}</div>
                        {(form.itinerary || []).length > 1 && (
                          <button onClick={() => removeDay(di)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                      <input value={day.title} onChange={e => itinChange(di, 'title', e.target.value)} style={{ ...S.input, marginBottom: 8 }} placeholder={`Day ${day.day} title`} />
                      <textarea rows={2} value={day.description} onChange={e => itinChange(di, 'description', e.target.value)} style={{ ...S.input, resize: 'none', marginBottom: 10, lineHeight: 1.5 }} placeholder="Day description..." />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Activities</div>
                      {(day.activities || []).map((act, ai) => (
                        <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input value={act} onChange={e => actChange(di, ai, e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Activity..." />
                          {(day.activities || []).length > 1 && (
                            <button onClick={() => { const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: (d.activities || []).filter((_, j) => j !== ai) }); setForm(f => ({ ...f, itinerary: it })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={13} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => { const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: [...(d.activities || []), ''] }); setForm(f => ({ ...f, itinerary: it })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a5f', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>+ Add activity</button>
                    </div>
                  ))}
                  <button onClick={addDay} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '2px dashed #c7d2e0', background: 'none', cursor: 'pointer', color: '#1e3a5f', fontSize: 13, fontWeight: 600 }}>+ Add Day</button>
                </div>
              )}

              {tab === 'media' && (
                <div>
                  {[{ l: 'Card Image URL', f: 'image', ph: 'https://images.unsplash.com/...' }, { l: 'Hero Image URL', f: 'heroImage', ph: 'Larger image for the package detail page' }].map(({ l, f, ph }) => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={S.label}>{l}</label>
                      <input value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} style={S.input} placeholder={ph} />
                      {form[f] && <img src={form[f]} alt="preview" onError={e => e.target.style.display = 'none'} style={{ marginTop: 6, width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />}
                    </div>
                  ))}
                  {[{ l: 'Highlights', f: 'highlights', ph: 'e.g. Tea estate walk' }, { l: 'Inclusions', f: 'inclusions', ph: 'e.g. Accommodation' }, { l: 'Exclusions', f: 'exclusions', ph: 'e.g. Flights' }].map(({ l, f, ph }) => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={S.label}>{l}</label>
                      {(form[f] || []).map((v, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input value={v} onChange={e => arrChange(f, i, e.target.value)} style={{ ...S.input, fontSize: 13 }} placeholder={ph} />
                          {(form[f] || []).length > 1 && <button onClick={() => arrDel(f, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={13} /></button>}
                        </div>
                      ))}
                      <button onClick={() => arrAdd(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a5f', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                {saving
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Submitting...</>
                  : <><Check size={14} /> Submit for Approval</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
