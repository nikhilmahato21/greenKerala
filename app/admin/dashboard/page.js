'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePackages } from '@/hooks/usePackages'
import { invalidateSettingsCache } from '@/hooks/useSettings'
import {
  Plus, Pencil, Trash2, LogOut, Eye, X, Check, ExternalLink, AlertTriangle,
  Package, MapPin, Inbox, Settings, Phone, MessageCircle, Mail, Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const EMPTY_PKG = {
  id: '', destination: '', badge: '', badgeColor: '#2e9e7a',
  duration: '3 Days & 2 Nights', title: '', subtitle: '', hotels: '',
  originalPrice: '', salePrice: '', priceNote: 'Per Person',
  image: '', heroImage: '', overview: '',
  highlights: [''], inclusions: [''], exclusions: [''],
  itinerary: [{ day: 1, title: '', description: '', activities: [''] }],
}

export default function Dashboard() {
  const router = useRouter()
  const { packages, add, update, remove, loaded } = usePackages()
  const [destinations, setDestinations] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [section, setSection] = useState('packages') // 'packages' | 'enquiries' | 'settings'
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_PKG)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [filter, setFilter] = useState('All')
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [newDest, setNewDest] = useState({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [destSaving, setDestSaving] = useState(false)
  const [editDestId, setEditDestId] = useState(null)
  const [editDestForm, setEditDestForm] = useState({ color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [settingsForm, setSettingsForm] = useState({ phone: '' })
  const [settingsSaving, setSettingsSaving] = useState(false)

  const fetchDestinations = useCallback(async () => {
    try {
      const res = await fetch('/api/destinations')
      if (res.ok) setDestinations(await res.json())
    } catch {}
  }, [])

  const fetchEnquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/enquiries')
      if (res.ok) setEnquiries(await res.json())
    } catch {}
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const s = await res.json()
        setSettingsForm({ phone: s.phone || '' })
      }
    } catch {}
  }, [])

  useEffect(() => { fetchDestinations() }, [fetchDestinations])
  useEffect(() => { if (section === 'enquiries') fetchEnquiries() }, [section, fetchEnquiries])
  useEffect(() => { if (section === 'settings') fetchSettings() }, [section, fetchSettings])

  const destColor = (name) => destinations.find(d => d.name === name)?.color ?? '#9ca3af'

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  const openAdd = () => {
    const first = destinations[0]
    setForm({ ...EMPTY_PKG, id: 'pkg-' + Date.now(), destination: first?.name ?? '', badgeColor: first?.color ?? '#2e9e7a' })
    setEditId(null)
    setTab('basic')
    setModal('form')
  }

  const openEdit = (pkg) => {
    setForm({
      ...pkg,
      highlights: pkg.highlights?.length ? pkg.highlights : [''],
      inclusions: pkg.inclusions?.length ? pkg.inclusions : [''],
      exclusions: pkg.exclusions?.length ? pkg.exclusions : [''],
      itinerary: pkg.itinerary?.length ? pkg.itinerary.map(d => ({ ...d, activities: d.activities?.length ? d.activities : [''] })) : [{ day: 1, title: '', description: '', activities: [''] }],
    })
    setEditId(pkg.id)
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
      if (editId) await update(editId, pkg)
      else await add(pkg)
      setModal(null)
      toast.success(editId ? 'Package updated!' : 'Package added!')
    } catch {
      toast.error('Failed to save package. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await remove(deleteId)
      setModal(null)
      setDeleteId(null)
      toast.success('Package deleted')
    } catch {
      toast.error('Failed to delete package. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDestination = async () => {
    if (!newDest.name.trim()) { toast.error('Destination name is required'); return }
    setDestSaving(true)
    try {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDest),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to add destination')
        return
      }
      await fetchDestinations()
      setNewDest({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' })
      toast.success('Destination added!')
    } catch {
      toast.error('Failed to add destination. Please try again.')
    } finally {
      setDestSaving(false)
    }
  }

  const handleUpdateDestination = async (id) => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDestForm),
      })
      if (!res.ok) throw new Error()
      await fetchDestinations()
      setEditDestId(null)
      toast.success('Destination updated!')
    } catch {
      toast.error('Failed to update destination.')
    }
  }

  const handleDeleteDestination = (id, name) => {
    setConfirm({
      message: `Delete "${name}"? Existing packages will not be affected.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          const res = await fetch(`/api/destinations/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          await fetchDestinations()
          toast.success('Destination deleted')
        } catch {
          toast.error('Failed to delete destination.')
        }
      },
    })
  }

  const handleDeleteEnquiry = (id) => {
    setConfirm({
      message: 'Delete this enquiry? This cannot be undone.',
      onConfirm: async () => {
        setConfirm(null)
        try {
          const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          setEnquiries(prev => prev.filter(e => e.id !== id))
          toast.success('Enquiry deleted')
        } catch {
          toast.error('Failed to delete enquiry.')
        }
      },
    })
  }

  const handleSaveSettings = async () => {
    if (!settingsForm.phone.trim()) { toast.error('Phone number is required'); return }
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: settingsForm.phone.trim().replace(/\D/g, '') }),
      })
      if (!res.ok) throw new Error()
      invalidateSettingsCache()
      toast.success('Settings saved!')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Array helpers
  const arrChange = (field, idx, val) => {
    const a = [...(form[field] || [])]
    a[idx] = val
    setForm(f => ({ ...f, [field]: a }))
  }
  const arrAdd = (field) => setForm(f => ({ ...f, [field]: [...(f[field] || []), ''] }))
  const arrDel = (field, idx) => setForm(f => ({ ...f, [field]: (f[field] || []).filter((_, i) => i !== idx) }))

  const itinChange = (di, field, val) => {
    const it = (form.itinerary || []).map((d, i) => i === di ? { ...d, [field]: val } : d)
    setForm(f => ({ ...f, itinerary: it }))
  }
  const actChange = (di, ai, val) => {
    const it = (form.itinerary || []).map((d, i) => {
      if (i !== di) return d
      const a = [...(d.activities || [])]
      a[ai] = val
      return { ...d, activities: a }
    })
    setForm(f => ({ ...f, itinerary: it }))
  }
  const addDay = () => {
    const n = (form.itinerary || []).length + 1
    setForm(f => ({ ...f, itinerary: [...(f.itinerary || []), { day: n, title: '', description: '', activities: [''] }] }))
  }
  const removeDay = (idx) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).filter((_, i) => i !== idx) }))

  const shown = filter === 'All' ? packages : packages.filter(p => p.destination === filter)

  const S = {
    page:        { minHeight: '100vh', background: '#f5f1eb' },
    topbar:      { position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #f3f4f6', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
    topbarInner: { maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:        { maxWidth: 1280, margin: '0 auto', padding: '28px 20px' },
    card:        { background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' },
    btn:         (bg = '#e8520a', col = '#fff') => ({ padding: '8px 16px', borderRadius: 10, background: bg, color: col, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
    input:       { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' },
    label:       { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' },
    tag:         (active) => ({
                   padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                   background: active ? 'linear-gradient(135deg,#e8520a,#c93d00)' : '#fff',
                   color: active ? '#fff' : '#555',
                   boxShadow: active ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                 }),
    overlay:     { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' },
    modal:       { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', marginBottom: 32 },
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f1eb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #f0ebe1', borderTop: '3px solid #e8520a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topbarInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 64, height: 64, overflow: 'hidden', flexShrink: 0 }}>
              <Image src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1778949528/WhatsApp_Image_2026-05-15_at_08.35.52-removebg-preview_g7xcil.png" alt="NN" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1 }}>Admin Dashboard</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Namaste Nomads</div>
            </div>
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

      {/* Section nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0 }}>
          {[
            { key: 'packages',  label: 'Packages',  icon: Package },
            { key: 'enquiries', label: 'Enquiries', icon: Inbox, badge: enquiries.length > 0 && section !== 'enquiries' ? enquiries.length : null },
            { key: 'settings',  label: 'Settings',  icon: Settings },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px',
                fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${section === key ? '#e8520a' : 'transparent'}`,
                color: section === key ? '#e8520a' : '#6b7280',
                position: 'relative',
              }}
            >
              <Icon size={14} /> {label}
              {badge && (
                <span style={{ marginLeft: 2, background: '#e8520a', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={S.body}>

        {/* ── Packages Section ── */}
        {section === 'packages' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#e8520a', lineHeight: 1 }}>{packages.length}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Total</div>
              </div>
              {destinations.map(d => (
                <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: d.color, lineHeight: 1 }}>{packages.filter(p => p.destination === d.name).length}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{d.name}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('All')} style={S.tag(filter === 'All')}>All</button>
                {destinations.map(d => (
                  <button key={d.id} onClick={() => setFilter(d.name)} style={S.tag(filter === d.name)}>{d.name}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setNewDest({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' }); setEditDestId(null); setModal('destination') }} style={S.btn('#f3f4f6', '#555')}>
                  <MapPin size={13} /> Manage Destinations
                </button>
                <button onClick={openAdd}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Add Package
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={S.card}>
              {shown.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                  <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No packages for this destination.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        {['Package', 'Destination', 'Duration', 'Price', 'Actions'].map((h, i) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: i === 4 ? 'right' : 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((pkg, idx) => (
                        <tr key={pkg.id} style={{ borderBottom: idx < shown.length - 1 ? '1px solid #f9fafb' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 48, height: 38, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                                <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#111' }}>{pkg.title}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{pkg.subtitle}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#fff', background: pkg.badgeColor || destColor(pkg.destination) }}>{pkg.destination}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{pkg.duration}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#111' }}>{fmt(pkg.salePrice)}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(pkg.originalPrice)}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                              <Link href={`/packages/${pkg.id}`} target="_blank"
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none' }}>
                                <Eye size={14} />
                              </Link>
                              <button onClick={() => openEdit(pkg)}
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => { setDeleteId(pkg.id); setModal('delete') }}
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Enquiries Section ── */}
        {section === 'enquiries' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Customer Enquiries</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{enquiries.length} total enquiri{enquiries.length === 1 ? 'y' : 'es'}</p>
              </div>
              <button onClick={fetchEnquiries} style={S.btn('#f3f4f6', '#555')}>Refresh</button>
            </div>

            {enquiries.length === 0 ? (
              <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <Inbox size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: 15 }}>No enquiries yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Customer enquiries from the package pages will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enquiries.map(enq => (
                  <div key={enq.id} style={{ ...S.card, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{enq.name}</span>
                          {enq.package_title && (
                            <span style={{ fontSize: 11, background: '#fff5ef', color: '#e8520a', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>
                              {enq.package_title}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={10} /> {fmtDate(enq.created_at)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: enq.message ? 10 : 0 }}>
                          <a href={`tel:+${enq.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                            <Phone size={13} style={{ color: '#e8520a' }} /> {enq.phone}
                          </a>
                          <a href={`https://wa.me/${enq.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#25d366', textDecoration: 'none' }}>
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                          {enq.email && (
                            <a href={`mailto:${enq.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                              <Mail size={13} style={{ color: '#6b7280' }} /> {enq.email}
                            </a>
                          )}
                        </div>
                        {enq.message && (
                          <p style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', borderRadius: 10, padding: '10px 12px', margin: 0, lineHeight: 1.6 }}>
                            &ldquo;{enq.message}&rdquo;
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleDeleteEnquiry(enq.id)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Settings Section ── */}
        {section === 'settings' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Business Settings</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Changes are reflected instantly across the entire website.</p>
            </div>

            <div style={{ maxWidth: 540 }}>
              <div style={{ ...S.card, padding: '24px' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} style={{ color: '#e8520a' }} /> Contact Number
                </h3>
                <label style={S.label}>WhatsApp & Call Number (with country code, no +)</label>
                <input
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm(s => ({ ...s, phone: e.target.value }))}
                  style={{ ...S.input, marginBottom: 8 }}
                  placeholder="e.g. 918062179246"
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>
                  Format: country code + number (e.g. 91 for India + 10-digit mobile = 918062179246)
                </p>
                {settingsForm.phone && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <a href={`tel:+${settingsForm.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e8520a', textDecoration: 'none', padding: '6px 14px', borderRadius: 999, border: '1px solid #fbd0b5', background: '#fff5ef' }}>
                      <Phone size={13} /> Preview call link
                    </a>
                    <a href={`https://wa.me/${settingsForm.phone}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25d366', textDecoration: 'none', padding: '6px 14px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                      <MessageCircle size={13} /> Preview WA link
                    </a>
                  </div>
                )}
                <button onClick={handleSaveSettings} disabled={settingsSaving}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: settingsSaving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: settingsSaving ? 0.7 : 1 }}>
                  {settingsSaving
                    ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Saving...</>
                    : <><Check size={14} /> Save Settings</>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Package Modal ── */}
      {modal === 'form' && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#e8520a,#c93d00)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{editId ? 'Edit Package' : 'Add Package'}</h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
              {[['basic', 'Basic'], ['itinerary', 'Itinerary'], ['media', 'Media & Lists']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === k ? '#e8520a' : 'transparent'}`, color: tab === k ? '#e8520a' : '#9ca3af' }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
              {tab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={S.input} placeholder="e.g. Goa Beach Bliss" />
                  </div>
                  <div>
                    <label style={S.label}>Subtitle</label>
                    <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} style={S.input} placeholder="e.g. Sun, Sand & Shacks" />
                  </div>
                  <div>
                    <label style={S.label}>Destination *</label>
                    <select value={form.destination} onChange={e => { const d = destinations.find(d => d.name === e.target.value); setForm(f => ({ ...f, destination: e.target.value, badgeColor: d?.color ?? f.badgeColor })) }} style={{ ...S.input, cursor: 'pointer' }}>
                      {destinations.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Duration</label>
                    <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={S.input} placeholder="e.g. 3 Days & 2 Nights" />
                  </div>
                  <div>
                    <label style={S.label}>Badge Label</label>
                    <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} style={S.input} placeholder="e.g. Weekend Special" />
                  </div>
                  <div>
                    <label style={S.label}>Stay / Hotels</label>
                    <input value={form.hotels} onChange={e => setForm(f => ({ ...f, hotels: e.target.value }))} style={S.input} placeholder="e.g. 2N North Goa · 1N South" />
                  </div>
                  <div>
                    <label style={S.label}>Original Price (Rs) *</label>
                    <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} style={S.input} placeholder="18000" />
                  </div>
                  <div>
                    <label style={S.label}>Sale Price (Rs) *</label>
                    <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} style={S.input} placeholder="12500" />
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
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day}</div>
                        {(form.itinerary || []).length > 1 && (
                          <button onClick={() => removeDay(di)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                      <input value={day.title} onChange={e => itinChange(di, 'title', e.target.value)} style={{ ...S.input, marginBottom: 8 }} placeholder={`Day ${day.day} — e.g. Arrival & Beach`} />
                      <textarea rows={2} value={day.description} onChange={e => itinChange(di, 'description', e.target.value)} style={{ ...S.input, resize: 'none', marginBottom: 10, lineHeight: 1.5 }} placeholder="Day description..." />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Activities</div>
                      {(day.activities || []).map((act, ai) => (
                        <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input value={act} onChange={e => actChange(di, ai, e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Activity..." />
                          {(day.activities || []).length > 1 && (
                            <button onClick={() => {
                              const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: (d.activities || []).filter((_, j) => j !== ai) })
                              setForm(f => ({ ...f, itinerary: it }))
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}>
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => {
                        const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: [...(d.activities || []), ''] })
                        setForm(f => ({ ...f, itinerary: it }))
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>
                        + Add activity
                      </button>
                    </div>
                  ))}
                  <button onClick={addDay} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '2px dashed #fbd0b5', background: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 13, fontWeight: 600 }}>
                    + Add Day
                  </button>
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
                  {[
                    { l: 'Highlights', f: 'highlights', ph: 'e.g. Baga Beach visit' },
                    { l: 'Inclusions', f: 'inclusions', ph: 'e.g. Daily breakfast' },
                    { l: 'Exclusions', f: 'exclusions', ph: 'e.g. Flights not included' },
                  ].map(({ l, f, ph }) => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={S.label}>{l}</label>
                      {(form[f] || []).map((v, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input value={v} onChange={e => arrChange(f, i, e.target.value)} style={{ ...S.input, fontSize: 13 }} placeholder={ph} />
                          {(form[f] || []).length > 1 && (
                            <button onClick={() => arrDel(f, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={13} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => arrAdd(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                {saving
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Saving...</>
                  : <><Check size={14} /> {editId ? 'Save Changes' : 'Add Package'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Destinations Modal ── */}
      {modal === 'destination' && (
        <div style={{ ...S.overlay, alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#2e3da8,#1c2575)', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} /> Manage Destinations
              </h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {/* Existing destinations */}
              {destinations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={S.label}>Existing Destinations</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {destinations.map(d => (
                      <div key={d.id} style={{ borderRadius: 12, border: '1px solid #f3f4f6', background: '#fafafa', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{d.emoji || '📍'} {d.name}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{packages.filter(p => p.destination === d.name).length} packages</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => {
                                if (editDestId === d.id) { setEditDestId(null); return }
                                setEditDestId(d.id)
                                setEditDestForm({ color: d.color, image_url: d.image_url || '', description: d.description || '', emoji: d.emoji || '📍' })
                              }}
                              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e7eb', background: editDestId === d.id ? '#fff5ef' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: editDestId === d.id ? '#e8520a' : '#9ca3af' }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDeleteDestination(d.id, d.name)}
                              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {editDestId === d.id && (
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, marginTop: 12 }}>
                              <div>
                                <label style={{ ...S.label, marginBottom: 4 }}>Emoji</label>
                                <input value={editDestForm.emoji} onChange={e => setEditDestForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...S.input, fontSize: 18, textAlign: 'center' }} placeholder="📍" maxLength={2} />
                              </div>
                              <div>
                                <label style={{ ...S.label, marginBottom: 4 }}>Color</label>
                                <input type="color" value={editDestForm.color} onChange={e => setEditDestForm(f => ({ ...f, color: e.target.value }))} style={{ width: 50, height: 42, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
                              </div>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ ...S.label, marginBottom: 4 }}>Image URL</label>
                              <input value={editDestForm.image_url} onChange={e => setEditDestForm(f => ({ ...f, image_url: e.target.value }))} style={S.input} placeholder="https://images.unsplash.com/..." />
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <label style={{ ...S.label, marginBottom: 4 }}>Description</label>
                              <input value={editDestForm.description} onChange={e => setEditDestForm(f => ({ ...f, description: e.target.value }))} style={S.input} placeholder="Short description for the destination card" />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setEditDestId(null)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                              <button onClick={() => handleUpdateDestination(d.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2e3da8,#1c2575)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new destination */}
              <label style={S.label}>Add New Destination</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                <input value={newDest.name} onChange={e => setNewDest(d => ({ ...d, name: e.target.value }))} style={S.input} placeholder="e.g. Kerala" onKeyDown={e => e.key === 'Enter' && handleAddDestination()} />
                <input type="color" value={newDest.color} onChange={e => setNewDest(d => ({ ...d, color: e.target.value }))} style={{ width: 50, height: 42, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2, background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ ...S.label, marginBottom: 4 }}>Emoji</label>
                  <input value={newDest.emoji} onChange={e => setNewDest(d => ({ ...d, emoji: e.target.value }))} style={{ ...S.input, textAlign: 'center', fontSize: 18 }} placeholder="📍" maxLength={2} />
                </div>
                <div>
                  <label style={{ ...S.label, marginBottom: 4 }}>Description</label>
                  <input value={newDest.description} onChange={e => setNewDest(d => ({ ...d, description: e.target.value }))} style={S.input} placeholder="Short tagline" />
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={{ ...S.label, marginBottom: 4 }}>Card Image URL</label>
                <input value={newDest.image_url} onChange={e => setNewDest(d => ({ ...d, image_url: e.target.value }))} style={S.input} placeholder="https://images.unsplash.com/..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa', flexShrink: 0 }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Close</button>
              <button onClick={handleAddDestination} disabled={destSaving}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: destSaving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#2e3da8,#1c2575)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: destSaving ? 0.7 : 1 }}>
                {destSaving
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Adding...</>
                  : <><Plus size={14} /> Add Destination</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirm && (
        <div style={{ ...S.overlay, alignItems: 'center', zIndex: 70 }} onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 8 }}>Are you sure?</h3>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirm.onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Package Confirm ── */}
      {modal === 'delete' && (
        <div style={{ ...S.overlay, alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>Delete Package?</h3>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
              This will permanently remove the package from the database. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setModal(null); setDeleteId(null) }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
