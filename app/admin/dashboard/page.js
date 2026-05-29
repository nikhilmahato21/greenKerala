'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { invalidateSettingsCache } from '@/hooks/useSettings'
import TagSelector from '@/components/TagSelector'
import {
  Plus, Pencil, Trash2, LogOut, Eye, X, Check, ExternalLink, AlertTriangle,
  Package, MapPin, Inbox, Settings, Phone, MessageCircle, Mail, Calendar,
  Building2, CheckCircle, XCircle, Star,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }
function fmtDate(ts) { return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

const CATEGORIES = [
  { value: 'package',  label: 'Package' },
  { value: 'group',    label: 'Group Package' },
  { value: 'homestay', label: 'Home Stay' },
  { value: 'other',    label: 'Other' },
]

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   color: '#f59e0b', bg: '#fffbeb' },
  approved: { label: 'Approved',  color: '#22c55e', bg: '#f0fdf4' },
  rejected: { label: 'Rejected',  color: '#ef4444', bg: '#fef2f2' },
}

const EMPTY_PKG = {
  id: '', destination: '', badge: '', badgeColor: '#2e9e7a',
  duration: '3 Days & 2 Nights', title: '', subtitle: '', hotels: '',
  originalPrice: '', salePrice: '', priceNote: 'Per Person',
  image: '', heroImage: '', overview: '', category: 'package',
  highlights: [], inclusions: [], exclusions: [],
  itinerary: [{ day: 1, title: '', description: '', activities: [''], image: '' }],
  availableDates: [],
}

function fmtRange(start, end) {
  if (!start && !end) return ''
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const f = d => { const dt = new Date(d + 'T00:00:00'); return `${dt.getDate()} ${M[dt.getMonth()]}, ${dt.getFullYear()}` }
  const s = start ? f(start) : '', e = end ? f(end) : ''
  return s && e ? `${s} – ${e}` : s || e
}
function autoMonth(dateStr) {
  if (!dateStr) return ''
  const dt = new Date(dateStr + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
function getDR(dr) { return (dr && typeof dr === 'object') ? dr : { start: '', end: dr || '' } }

export default function Dashboard() {
  const router = useRouter()
  const [allPackages, setAllPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [agencies, setAgencies] = useState([])
  const [loaded, setLoaded] = useState(false)

  const [section, setSection] = useState('packages')
  const [pkgFilter, setPkgFilter] = useState('all')      // 'all' | 'group' | 'homestay' | 'other'
  const [pkgStatus, setPkgStatus] = useState('approved') // 'approved' | 'pending' | 'rejected' | 'all'
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_PKG)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [pkgSearch, setPkgSearch] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [pkgOptions, setPkgOptions] = useState({ inclusion: [], exclusion: [], highlight: [] })

  const [newDest, setNewDest] = useState({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [destSaving, setDestSaving] = useState(false)
  const [editDestId, setEditDestId] = useState(null)
  const [editDestForm, setEditDestForm] = useState({ color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [settingsForm, setSettingsForm] = useState({ phone: '' })
  const [settingsSaving, setSettingsSaving] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/packages/admin')
      if (res.ok) setAllPackages(await res.json())
    } catch {}
    setLoaded(true)
  }, [])

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

  const fetchAgencies = useCallback(async () => {
    try {
      const res = await fetch('/api/agencies')
      if (res.ok) setAgencies(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchPackages()
    fetchDestinations()
    fetch('/api/package-options').then(r => r.ok ? r.json() : null).then(d => { if (d) setPkgOptions(d) }).catch(() => {})
  }, [fetchPackages, fetchDestinations])

  useEffect(() => {
    if (section === 'enquiries') fetchEnquiries()
    if (section === 'agencies') fetchAgencies()
    if (section === 'settings') {
      let ignore = false
      fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => { if (!ignore && s) setSettingsForm({ phone: s.phone || '' }) }).catch(() => {})
      return () => { ignore = true }
    }
  }, [section, fetchEnquiries, fetchAgencies])

  const destColor = (name) => destinations.find(d => d.name === name)?.color ?? '#9ca3af'

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  // ─── Package handlers ──────────────────────────────────────────────────────

  const openAdd = () => {
    const first = destinations[0]
    const pkgId = 'GKT-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    setForm({ ...EMPTY_PKG, id: pkgId, destination: first?.name ?? '', badgeColor: first?.color ?? '#2e9e7a' })
    setEditId(null); setTab('basic'); setModal('form')
  }

  const openEdit = (pkg) => {
    setForm({
      ...pkg,
      highlights: pkg.highlights || [],
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      itinerary: pkg.itinerary?.length ? pkg.itinerary.map(d => ({ ...d, activities: d.activities?.length ? d.activities : [''], image: d.image || '' })) : [{ day: 1, title: '', description: '', activities: [''], image: '' }],
      availableDates: pkg.availableDates || [],
    })
    setEditId(pkg.id); setTab('basic'); setModal('form')
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
      if (editId) {
        await fetch(`/api/packages/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pkg) })
      } else {
        await fetch('/api/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pkg) })
      }
      await fetchPackages()
      setModal(null)
      toast.success(editId ? 'Package updated!' : 'Package added!')
    } catch {
      toast.error('Failed to save package.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await fetch(`/api/packages/${deleteId}`, { method: 'DELETE' })
      await fetchPackages()
      setModal(null); setDeleteId(null)
      toast.success('Package deleted')
    } catch {
      toast.error('Failed to delete package.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id, status) => {
    setActionLoading(`approve-${id}-${status}`)
    try {
      const res = await fetch(`/api/packages/${id}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error()
      await fetchPackages()
      toast.success(`Package ${status}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFeature = async (id, featured, order) => {
    setActionLoading(`feature-${id}`)
    try {
      const res = await fetch(`/api/packages/${id}/feature`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured, order }) })
      if (!res.ok) throw new Error()
      await fetchPackages()
      toast.success(featured ? 'Package added to hero!' : 'Removed from hero')
    } catch {
      toast.error('Failed to update featured status')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Agency handlers ───────────────────────────────────────────────────────

  const handleAgencyStatus = async (id, status) => {
    setActionLoading(`agency-${id}-${status}`)
    try {
      const res = await fetch(`/api/agencies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error()
      await fetchAgencies()
      toast.success(`Agency ${status}`)
    } catch {
      toast.error('Failed to update agency')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAgency = (id, name) => {
    setConfirm({
      message: `Delete agency "${name}"? Their packages will remain but be unlinked.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch(`/api/agencies/${id}`, { method: 'DELETE' })
          await fetchAgencies()
          toast.success('Agency deleted')
        } catch { toast.error('Failed to delete agency') }
      },
    })
  }

  // ─── Destination handlers ──────────────────────────────────────────────────

  const handleAddDestination = async () => {
    if (!newDest.name.trim()) { toast.error('Destination name is required'); return }
    setDestSaving(true)
    try {
      const res = await fetch('/api/destinations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDest) })
      if (!res.ok) { const { error } = await res.json(); toast.error(error || 'Failed'); return }
      await fetchDestinations()
      setNewDest({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' })
      toast.success('Destination added!')
    } catch { toast.error('Failed to add destination.') }
    finally { setDestSaving(false) }
  }

  const handleUpdateDestination = async (id) => {
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDestForm) })
      if (!res.ok) throw new Error()
      await fetchDestinations(); setEditDestId(null)
      toast.success('Destination updated!')
    } catch { toast.error('Failed to update destination.') }
  }

  const handleDeleteDestination = (id, name) => {
    setConfirm({
      message: `Delete "${name}"? Existing packages will not be affected.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch(`/api/destinations/${id}`, { method: 'DELETE' })
          await fetchDestinations()
          toast.success('Destination deleted')
        } catch { toast.error('Failed to delete destination.') }
      },
    })
  }

  const handleDeleteEnquiry = (id) => {
    setConfirm({
      message: 'Delete this enquiry? This cannot be undone.',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
          setEnquiries(prev => prev.filter(e => e.id !== id))
          toast.success('Enquiry deleted')
        } catch { toast.error('Failed to delete enquiry.') }
      },
    })
  }

  const handleSaveSettings = async () => {
    if (!settingsForm.phone.trim()) { toast.error('Phone number is required'); return }
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: settingsForm.phone.trim().replace(/\D/g, '') }) })
      if (!res.ok) throw new Error()
      invalidateSettingsCache()
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings.') }
    finally { setSettingsSaving(false) }
  }

  // ─── Array helpers ────────────────────────────────────────────────────────
  const itinChange = (di, field, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => i === di ? { ...d, [field]: val } : d) }))
  const actChange = (di, ai, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const a = [...(d.activities || [])]; a[ai] = val; return { ...d, activities: a } }) }))
  const addDay = () => setForm(f => ({ ...f, itinerary: [...(f.itinerary || []), { day: (f.itinerary || []).length + 1, title: '', description: '', activities: [''], image: '' }] }))
  const removeDay = (idx) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).filter((_, i) => i !== idx) }))

  const addDateGroup = () => setForm(f => ({ ...f, availableDates: [...(f.availableDates || []), { month: '', dates: [{ start: '', end: '' }] }] }))
  const removeDateGroup = (gi) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).filter((_, i) => i !== gi) }))
  const dateGroupChange = (gi, field, val) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i === gi ? { ...g, [field]: val } : g) }))
  const addDateRange = (gi) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i === gi ? { ...g, dates: [...(g.dates || []), { start: '', end: '' }] } : g) }))
  const removeDateRange = (gi, di) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i !== gi ? g : { ...g, dates: (g.dates || []).filter((_, j) => j !== di) }) }))
  const setDateField = (gi, di, field, val) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i !== gi ? g : { ...g, dates: (g.dates || []).map((d, j) => j !== di ? d : { ...getDR(d), [field]: val }) }) }))

  // ─── Derived data ─────────────────────────────────────────────────────────
  const filteredPackages = allPackages
    .filter(p => pkgFilter === 'all' || p.category === pkgFilter)
    .filter(p => pkgStatus === 'all' || p.status === pkgStatus)
    .filter(p => !pkgSearch.trim() || p.id.toLowerCase().includes(pkgSearch.toLowerCase()) || (p.title || '').toLowerCase().includes(pkgSearch.toLowerCase()))

  const pendingCount = allPackages.filter(p => p.status === 'pending').length
  const pendingAgencies = agencies.filter(a => a.status === 'pending').length
  const featuredPackages = allPackages.filter(p => p.featured && p.status === 'approved')

  const filteredAgencies = agencyFilter === 'all' ? agencies : agencies.filter(a => a.status === agencyFilter)

  const S = {
    page:        { minHeight: '100vh', background: '#f5f1eb' },
    topbar:      { position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #f3f4f6', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
    topbarInner: { maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:        { maxWidth: 1280, margin: '0 auto', padding: '28px 20px' },
    card:        { background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' },
    btn:         (bg = '#e8520a', col = '#fff') => ({ padding: '8px 16px', borderRadius: 10, background: bg, color: col, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
    input:       { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' },
    label:       { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' },
    tag:         (active, color = '#e8520a') => ({
                   padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                   background: active ? color : '#fff', color: active ? '#fff' : '#555',
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
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topbarInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, overflow: 'hidden', flexShrink: 0 }}>
              <Image src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1779855779/WhatsApp_Image_2026-05-22_at_15.06.01-removebg-preview_mr6pdc.png" alt="Green Kerala Trips" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1 }}>Admin Dashboard</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Green Kerala Trips</div>
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[
            { key: 'packages',  label: 'Packages',  icon: Package,   badge: pendingCount > 0 ? pendingCount : null },
            { key: 'agencies',  label: 'Agencies',  icon: Building2, badge: pendingAgencies > 0 ? pendingAgencies : null },
            { key: 'enquiries', label: 'Enquiries', icon: Inbox,     badge: enquiries.length > 0 && section !== 'enquiries' ? enquiries.length : null },
            { key: 'settings',  label: 'Settings',  icon: Settings },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button key={key} onClick={() => setSection(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${section === key ? '#e8520a' : 'transparent'}`, color: section === key ? '#e8520a' : '#6b7280', whiteSpace: 'nowrap', position: 'relative' }}>
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

        {/* ── Packages ── */}
        {section === 'packages' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total', value: allPackages.length, color: '#111' },
                { label: 'Approved', value: allPackages.filter(p => p.status === 'approved').length, color: '#22c55e' },
                { label: 'Pending', value: pendingCount, color: '#f59e0b' },
                { label: 'Featured', value: featuredPackages.length, color: '#e8520a' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: 12 }}>
              <input
                value={pkgSearch}
                onChange={e => setPkgSearch(e.target.value)}
                placeholder="Search by Package ID or title..."
                style={{ width: '100%', maxWidth: 360, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Category filter */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPkgFilter('all')} style={S.tag(pkgFilter === 'all')}>All</button>
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setPkgFilter(c.value)} style={S.tag(pkgFilter === c.value)}>{c.label}</button>
                  ))}
                </div>
                <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />
                {/* Status filter */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['all','All','#6b7280'], ['approved','Approved','#22c55e'], ['pending','Pending','#f59e0b'], ['rejected','Rejected','#ef4444']].map(([v, l, c]) => (
                    <button key={v} onClick={() => setPkgStatus(v)} style={S.tag(pkgStatus === v, c)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setNewDest({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' }); setEditDestId(null); setModal('destination') }} style={S.btn('#f3f4f6', '#555')}>
                  <MapPin size={13} /> Destinations
                </button>
                <button onClick={openAdd} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Add Package
                </button>
              </div>
            </div>

            {/* Hero section manager */}
            {featuredPackages.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Star size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Hero Section ({featuredPackages.length} featured):</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {featuredPackages.map(p => (
                    <span key={p.id} style={{ fontSize: 12, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>{p.title}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Table */}
            <div style={S.card}>
              {filteredPackages.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                  <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No packages match the selected filters.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        {['Pkg ID', 'Package', 'Category', 'Destination', 'Price', 'Status', 'Hero', 'Actions'].map((h, i) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: i >= 6 ? 'center' : 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg, idx) => {
                        const sc = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending
                        const cat = CATEGORIES.find(c => c.value === pkg.category)
                        return (
                          <tr key={pkg.id} style={{ borderBottom: idx < filteredPackages.length - 1 ? '1px solid #f9fafb' : 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#e8520a', background: '#fff5ef', padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{pkg.id}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 44, height: 36, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                                  {pkg.image && <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#111', fontSize: 13 }}>{pkg.title}</div>
                                  {pkg.agencyName && <div style={{ fontSize: 10, color: '#e8520a', marginTop: 1, fontWeight: 600 }}>🏢 {pkg.agencyName}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{cat?.label || pkg.category}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#fff', background: pkg.badgeColor || destColor(pkg.destination) }}>{pkg.destination || '—'}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 700 }}>{fmt(pkg.salePrice)}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {pkg.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => handleApprove(pkg.id, 'approved')} disabled={actionLoading !== null} title="Approve"
                                    style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: '#f0fdf4', color: '#22c55e', fontWeight: 700, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading === `approve-${pkg.id}-approved` ? 0.7 : 1 }}>
                                    {actionLoading === `approve-${pkg.id}-approved` ? <span style={{ width: 10, height: 10, border: '2px solid #bbf7d0', borderTop: '2px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <CheckCircle size={12} />} Approve
                                  </button>
                                  <button onClick={() => handleApprove(pkg.id, 'rejected')} disabled={actionLoading !== null} title="Reject"
                                    style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading === `approve-${pkg.id}-rejected` ? 0.7 : 1 }}>
                                    {actionLoading === `approve-${pkg.id}-rejected` ? <span style={{ width: 10, height: 10, border: '2px solid #fecaca', borderTop: '2px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <XCircle size={12} />} Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>{sc.label}</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {pkg.status === 'approved' && (
                                <button
                                  onClick={() => handleFeature(pkg.id, !pkg.featured, pkg.featured ? 0 : featuredPackages.length)}
                                  disabled={actionLoading === `feature-${pkg.id}`}
                                  title={pkg.featured ? 'Remove from hero' : 'Push to hero'}
                                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${pkg.featured ? '#fde68a' : '#e5e7eb'}`, background: pkg.featured ? '#fffbeb' : 'none', cursor: actionLoading === `feature-${pkg.id}` ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                  {actionLoading === `feature-${pkg.id}`
                                    ? <span style={{ width: 10, height: 10, border: '2px solid #fde68a', borderTop: '2px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                    : <Star size={14} style={{ color: pkg.featured ? '#f59e0b' : '#d1d5db', fill: pkg.featured ? '#f59e0b' : 'none' }} />
                                  }
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                <Link href={`/packages/${pkg.id}`} target="_blank"
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none' }}>
                                  <Eye size={13} />
                                </Link>
                                <button onClick={() => openEdit(pkg)}
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => { setDeleteId(pkg.id); setModal('delete') }}
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Agencies ── */}
        {section === 'agencies' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Agencies</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{agencies.length} registered · {pendingAgencies} pending review</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchAgencies} style={S.btn('#f3f4f6', '#555')}>Refresh</button>
              </div>
            </div>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['all','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v, l]) => (
                <button key={v} onClick={() => setAgencyFilter(v)} style={S.tag(agencyFilter === v)}>{l}</button>
              ))}
            </div>

            {filteredAgencies.length === 0 ? (
              <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: 15 }}>No agencies yet</p>
                <p style={{ fontSize: 13 }}>When travel agencies register, they appear here for review.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredAgencies.map(agency => {
                  const sc = STATUS_CONFIG[agency.status] || STATUS_CONFIG.pending
                  return (
                    <div key={agency.id} style={{ ...S.card, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Building2 size={16} style={{ color: '#fff' }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{agency.name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                {agency.package_count} packages · Applied {fmtDate(agency.created_at)}
                              </div>
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>{sc.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: agency.description ? 8 : 0 }}>
                            <a href={`mailto:${agency.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                              <Mail size={13} style={{ color: '#6b7280' }} /> {agency.email}
                            </a>
                            <a href={`tel:${agency.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                              <Phone size={13} style={{ color: '#e8520a' }} /> {agency.phone}
                            </a>
                            {agency.website && (
                              <a href={agency.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#2e3da8', textDecoration: 'none' }}>
                                <ExternalLink size={13} /> {agency.website}
                              </a>
                            )}
                          </div>
                          {agency.description && (
                            <p style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', borderRadius: 10, padding: '8px 12px', margin: 0, lineHeight: 1.6 }}>{agency.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {agency.status !== 'approved' && (
                            <button onClick={() => handleAgencyStatus(agency.id, 'approved')} disabled={actionLoading !== null}
                              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#f0fdf4', color: '#22c55e', fontWeight: 700, fontSize: 12, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: actionLoading === `agency-${agency.id}-approved` ? 0.7 : 1 }}>
                              {actionLoading === `agency-${agency.id}-approved` ? <span style={{ width: 11, height: 11, border: '2px solid #bbf7d0', borderTop: '2px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <CheckCircle size={13} />} Approve
                            </button>
                          )}
                          {agency.status !== 'rejected' && (
                            <button onClick={() => handleAgencyStatus(agency.id, 'rejected')} disabled={actionLoading !== null}
                              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: actionLoading === `agency-${agency.id}-rejected` ? 0.7 : 1 }}>
                              {actionLoading === `agency-${agency.id}-rejected` ? <span style={{ width: 11, height: 11, border: '2px solid #fecaca', borderTop: '2px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <XCircle size={13} />} Reject
                            </button>
                          )}
                          <button onClick={() => handleDeleteAgency(agency.id, agency.name)}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Enquiries ── */}
        {section === 'enquiries' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Customer Enquiries</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{enquiries.length} total</p>
              </div>
              <button onClick={fetchEnquiries} style={S.btn('#f3f4f6', '#555')}>Refresh</button>
            </div>
            {enquiries.length === 0 ? (
              <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <Inbox size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: 15 }}>No enquiries yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enquiries.map(enq => (
                  <div key={enq.id} style={{ ...S.card, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{enq.name}</span>
                          {enq.package_title && <span style={{ fontSize: 11, background: '#fff5ef', color: '#e8520a', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>{enq.package_title}</span>}
                          <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> {fmtDate(enq.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: enq.message ? 10 : 0 }}>
                          <a href={`tel:+${enq.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}><Phone size={13} style={{ color: '#e8520a' }} /> {enq.phone}</a>
                          <a href={`https://wa.me/${enq.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#25d366', textDecoration: 'none' }}><MessageCircle size={13} /> WhatsApp</a>
                          {enq.email && <a href={`mailto:${enq.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}><Mail size={13} style={{ color: '#6b7280' }} /> {enq.email}</a>}
                        </div>
                        {enq.message && <p style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', borderRadius: 10, padding: '10px 12px', margin: 0, lineHeight: 1.6 }}>&ldquo;{enq.message}&rdquo;</p>}
                      </div>
                      <button onClick={() => handleDeleteEnquiry(enq.id)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Settings ── */}
        {section === 'settings' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Business Settings</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Changes are reflected instantly across the website.</p>
            </div>
            <div style={{ maxWidth: 540 }}>
              <div style={{ ...S.card, padding: '24px' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} style={{ color: '#e8520a' }} /> Contact Number
                </h3>
                <label style={S.label}>WhatsApp & Call Number (with country code, no +)</label>
                <input value={settingsForm.phone} onChange={e => setSettingsForm(s => ({ ...s, phone: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} placeholder="e.g. 918062179246" />
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Format: country code + number (91 + 10-digit mobile)</p>
                {settingsForm.phone && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <a href={`tel:+${settingsForm.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e8520a', textDecoration: 'none', padding: '6px 14px', borderRadius: 999, border: '1px solid #fbd0b5', background: '#fff5ef' }}><Phone size={13} /> Preview call</a>
                    <a href={`https://wa.me/${settingsForm.phone}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25d366', textDecoration: 'none', padding: '6px 14px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4' }}><MessageCircle size={13} /> Preview WA</a>
                  </div>
                )}
                <button onClick={handleSaveSettings} disabled={settingsSaving}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: settingsSaving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: settingsSaving ? 0.7 : 1 }}>
                  {settingsSaving ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Saving...</> : <><Check size={14} /> Save Settings</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Package Modal ── */}
      {modal === 'form' && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#e8520a,#c93d00)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{editId ? 'Edit Package' : 'Add Package'}</h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
              {[['basic','Basic'],['itinerary','Itinerary'],['media','Media & Lists']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === k ? '#e8520a' : 'transparent'}`, color: tab === k ? '#e8520a' : '#9ca3af' }}>{l}</button>
              ))}
            </div>
            <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
              {tab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={S.input} placeholder="e.g. Munnar Tea Estate Trek" />
                  </div>
                  <div>
                    <label style={S.label}>Subtitle</label>
                    <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} style={S.input} />
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
                    <input value={form.hotels} onChange={e => setForm(f => ({ ...f, hotels: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Original Price (₹)</label>
                    <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Sale Price (₹) *</label>
                    <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} style={S.input} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Overview</label>
                    <textarea rows={3} value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} />
                  </div>
                  {form.category === 'group' && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
                        <label style={S.label}>Available Dates</label>
                        <button onClick={addDateGroup} style={{ fontSize: 12, fontWeight: 600, color: '#e8520a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Plus size={12} /> Add Batch
                        </button>
                      </div>
                      {(form.availableDates || []).length === 0 && (
                        <p style={{ fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, padding: '10px 14px', margin: 0 }}>No departure dates yet. Click &ldquo;Add Batch&rdquo; to add a group of dates.</p>
                      )}
                      {(form.availableDates || []).map((group, gi) => {
                        const firstStart = getDR(group.dates?.[0]).start
                        return (
                          <div key={gi} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 8, background: '#fafafa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <input
                                value={group.month}
                                onChange={e => dateGroupChange(gi, 'month', e.target.value)}
                                style={{ ...S.input, fontSize: 12, flex: 1 }}
                                placeholder={autoMonth(firstStart) || 'Month label (auto-fills from dates)'}
                              />
                              <button onClick={() => removeDateGroup(gi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}><X size={14} /></button>
                            </div>
                            {(group.dates || []).map((dr, di) => {
                              const d = getDR(dr)
                              return (
                                <div key={di} style={{ marginBottom: 8 }}>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input type="date" value={d.start} onChange={e => setDateField(gi, di, 'start', e.target.value)} style={{ ...S.input, fontSize: 12, flex: 1 }} />
                                    <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>→</span>
                                    <input type="date" value={d.end} onChange={e => setDateField(gi, di, 'end', e.target.value)} style={{ ...S.input, fontSize: 12, flex: 1 }} />
                                    {(group.dates || []).length > 1 && (
                                      <button onClick={() => removeDateRange(gi, di)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={13} /></button>
                                    )}
                                  </div>
                                  {(d.start || d.end) && (
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, paddingLeft: 2 }}>{fmtRange(d.start, d.end)}</div>
                                  )}
                                </div>
                              )
                            })}
                            <button onClick={() => addDateRange(gi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>+ Add date range</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              {tab === 'itinerary' && (
                <div>
                  {(form.itinerary || []).map((day, di) => (
                    <div key={di} style={{ border: '1px solid #f3f4f6', borderRadius: 12, padding: 14, marginBottom: 10, background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day}</div>
                        {(form.itinerary || []).length > 1 && <button onClick={() => removeDay(di)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={14} /></button>}
                      </div>
                      <input value={day.title} onChange={e => itinChange(di, 'title', e.target.value)} style={{ ...S.input, marginBottom: 8 }} placeholder={`Day ${day.day} title`} />
                      <textarea rows={2} value={day.description} onChange={e => itinChange(di, 'description', e.target.value)} style={{ ...S.input, resize: 'none', marginBottom: 8, lineHeight: 1.5 }} placeholder="Day description..." />
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 5 }}>Day Image (optional)</div>
                        <input value={day.image || ''} onChange={e => itinChange(di, 'image', e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="https://images.unsplash.com/... (small thumbnail)" />
                        {day.image && <img src={day.image} alt={`Day ${day.day}`} onError={e => e.target.style.display = 'none'} style={{ marginTop: 5, width: '100%', height: 60, objectFit: 'cover', borderRadius: 7 }} />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Activities</div>
                      {(day.activities || []).map((act, ai) => (
                        <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input value={act} onChange={e => actChange(di, ai, e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Activity..." />
                          {(day.activities || []).length > 1 && <button onClick={() => { const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: (d.activities || []).filter((_, j) => j !== ai) }); setForm(f => ({ ...f, itinerary: it })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={13} /></button>}
                        </div>
                      ))}
                      <button onClick={() => { const it = (form.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: [...(d.activities || []), ''] }); setForm(f => ({ ...f, itinerary: it })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 12, fontWeight: 600, padding: '2px 0' }}>+ Add activity</button>
                    </div>
                  ))}
                  <button onClick={addDay} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '2px dashed #fbd0b5', background: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 13, fontWeight: 600 }}>+ Add Day</button>
                </div>
              )}
              {tab === 'media' && (
                <div>
                  {[{ l: 'Card Image URL', f: 'image', ph: 'https://images.unsplash.com/...' }, { l: 'Hero Image URL', f: 'heroImage', ph: 'Large image for detail page' }].map(({ l, f, ph }) => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={S.label}>{l}</label>
                      <input value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} style={S.input} placeholder={ph} />
                      {form[f] && <img src={form[f]} alt="preview" onError={e => e.target.style.display = 'none'} style={{ marginTop: 6, width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />}
                    </div>
                  ))}

                  {[
                    { l: 'Highlights', f: 'highlights', type: 'highlight', color: '#e8520a' },
                    { l: 'Inclusions', f: 'inclusions', type: 'inclusion', color: '#22c55e' },
                    { l: 'Exclusions', f: 'exclusions', type: 'exclusion', color: '#ef4444' },
                  ].map(({ l, f, type, color }) => (
                    <div key={f} style={{ marginBottom: 18 }}>
                      <label style={S.label}>{l}</label>
                      <TagSelector
                        type={type}
                        selected={form[f] || []}
                        onChange={val => setForm(p => ({ ...p, [f]: val }))}
                        options={pkgOptions[type] || []}
                        onOptionsUpdate={setPkgOptions}
                        color={color}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                {saving ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Saving...</> : <><Check size={14} /> {editId ? 'Save Changes' : 'Add Package'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Destinations Modal ── */}
      {modal === 'destination' && (
        <div style={{ ...S.overlay, alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#2e3da8,#1c2575)', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} /> Manage Destinations</h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {destinations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={S.label}>Existing Destinations</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {destinations.map(d => (
                      <div key={d.id} style={{ borderRadius: 12, border: '1px solid #f3f4f6', background: '#fafafa', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{d.emoji || '📍'} {d.name}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{allPackages.filter(p => p.destination === d.name).length} pkgs</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { if (editDestId === d.id) { setEditDestId(null); return }; setEditDestId(d.id); setEditDestForm({ color: d.color, image_url: d.image_url || '', description: d.description || '', emoji: d.emoji || '📍' }) }} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e7eb', background: editDestId === d.id ? '#fff5ef' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: editDestId === d.id ? '#e8520a' : '#9ca3af' }}><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteDestination(d.id, d.name)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                        {editDestId === d.id && (
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, marginTop: 12 }}>
                              <div><label style={{ ...S.label, marginBottom: 4 }}>Emoji</label><input value={editDestForm.emoji} onChange={e => setEditDestForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...S.input, fontSize: 18, textAlign: 'center' }} maxLength={2} /></div>
                              <div><label style={{ ...S.label, marginBottom: 4 }}>Color</label><input type="color" value={editDestForm.color} onChange={e => setEditDestForm(f => ({ ...f, color: e.target.value }))} style={{ width: 50, height: 42, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2 }} /></div>
                            </div>
                            <div style={{ marginBottom: 8 }}><label style={{ ...S.label, marginBottom: 4 }}>Image URL</label><input value={editDestForm.image_url} onChange={e => setEditDestForm(f => ({ ...f, image_url: e.target.value }))} style={S.input} /></div>
                            <div style={{ marginBottom: 10 }}><label style={{ ...S.label, marginBottom: 4 }}>Description</label><input value={editDestForm.description} onChange={e => setEditDestForm(f => ({ ...f, description: e.target.value }))} style={S.input} /></div>
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
              <label style={S.label}>Add New Destination</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                <input value={newDest.name} onChange={e => setNewDest(d => ({ ...d, name: e.target.value }))} style={S.input} placeholder="e.g. Thekkady" onKeyDown={e => e.key === 'Enter' && handleAddDestination()} />
                <input type="color" value={newDest.color} onChange={e => setNewDest(d => ({ ...d, color: e.target.value }))} style={{ width: 50, height: 42, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={{ ...S.label, marginBottom: 4 }}>Emoji</label><input value={newDest.emoji} onChange={e => setNewDest(d => ({ ...d, emoji: e.target.value }))} style={{ ...S.input, textAlign: 'center', fontSize: 18 }} maxLength={2} /></div>
                <div><label style={{ ...S.label, marginBottom: 4 }}>Description</label><input value={newDest.description} onChange={e => setNewDest(d => ({ ...d, description: e.target.value }))} style={S.input} /></div>
              </div>
              <div style={{ marginBottom: 4 }}><label style={{ ...S.label, marginBottom: 4 }}>Card Image URL</label><input value={newDest.image_url} onChange={e => setNewDest(d => ({ ...d, image_url: e.target.value }))} style={S.input} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa', flexShrink: 0 }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Close</button>
              <button onClick={handleAddDestination} disabled={destSaving} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: destSaving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#2e3da8,#1c2575)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: destSaving ? 0.7 : 1 }}>
                {destSaving ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Adding...</> : <><Plus size={14} /> Add</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirm && (
        <div style={{ ...S.overlay, alignItems: 'center', zIndex: 70 }} onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><AlertTriangle size={24} style={{ color: '#ef4444' }} /></div>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 8 }}>Are you sure?</h3>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirm.onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Package ── */}
      {modal === 'delete' && (
        <div style={{ ...S.overlay, alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><AlertTriangle size={24} style={{ color: '#ef4444' }} /></div>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>Delete Package?</h3>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>This will permanently remove the package. This action cannot be undone.</p>
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
