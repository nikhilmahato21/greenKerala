'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { invalidateSettingsCache } from '@/hooks/useSettings'
import TagSelector from '@/components/TagSelector'
import PackagePreview from '@/components/PackagePreview'
import HomestayFields from '@/components/HomestayFields'
import {
  Plus, Pencil, Copy, Trash2, LogOut, Eye, X, Check, ExternalLink, AlertTriangle,
  Package, MapPin, Inbox, Settings, Phone, MessageCircle, Mail, Calendar,
  Building2, CheckCircle, XCircle, Star,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

const PKG_PREFIX = { package: 'PKG', group: 'GPKG', homestay: 'HS', other: 'OTH' }
const CONFORMING_ID = /^(PKG|GPKG|HS|OTH)-\d+$/
function generatePkgId(category, existingPackages) {
  const prefix = PKG_PREFIX[category] || 'PKG'
  const nums = existingPackages
    .filter(p => p.id && p.id.startsWith(prefix + '-'))
    .map(p => { const m = p.id.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0 })
  return `${prefix}-${nums.length > 0 ? Math.max(...nums) + 1 : 101}`
}
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
  adults: '', children: '', rooms: '',
  originalPrice: '', salePrice: '', childPrice: '', priceNote: 'Per Person',
  image: '', heroImage: '', overview: '', note: '', category: 'package',
  highlights: [], inclusions: [], exclusions: [],
  itinerary: [{ day: 1, title: '', description: '', activities: [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: '', hotel: '' }],
  availableDates: [],
  // Homestay-specific
  address: '', mapUrl: '', starRating: '', rating: '', ratingLabel: '',
  amenities: [], roomTypes: [], nearby: [],
  checkIn: '', checkOut: '', frontDesk: '', childPolicy: '', cribsExtraBeds: '', finePrint: '',
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
  const [featureModal, setFeatureModal] = useState(null) // { id, order } | null
  const [featureDays, setFeatureDays] = useState('30')
  const [tab, setTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [pkgVisLoading, setPkgVisLoading] = useState(null)
  const [pkgSearch, setPkgSearch] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [pkgAgencyFilter, setPkgAgencyFilter] = useState('all')
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false)
  const [agencyDropdownSearch, setAgencyDropdownSearch] = useState('')
  const [pkgOptions, setPkgOptions] = useState({ inclusion: [], exclusion: [], highlight: [] })

  const [newDest, setNewDest] = useState({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [destVisLoading, setDestVisLoading] = useState(null)
  const [destSaving, setDestSaving] = useState(false)
  const [editDestId, setEditDestId] = useState(null)
  const [editDestForm, setEditDestForm] = useState({ color: '#e8520a', image_url: '', description: '', emoji: '📍' })
  const [settingsForm, setSettingsForm] = useState({ phone: '', whatsapp: '', email: '', email2: '', banner_days: '30', admin_recovery_email: '', min_dest_packages: '1' })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [usernameSaving, setUsernameSaving] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/packages/admin')
      if (res.ok) {
        const pkgs = await res.json()
        setAllPackages(pkgs)
        // Auto-rename any old-format IDs silently
        if (pkgs.some(p => !CONFORMING_ID.test(p.id))) {
          fetch('/api/packages/migrate-ids', { method: 'POST' })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data?.renamed?.length > 0) {
                fetch('/api/packages/admin').then(r => r.ok ? r.json() : null).then(p => { if (p) setAllPackages(p) }).catch(() => {})
              }
            })
            .catch(() => {})
        }
      }
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
      fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => { if (!ignore && s) setSettingsForm({ phone: s.phone || '', whatsapp: s.whatsapp || '', email: s.email || '', email2: s.email2 || '', banner_days: s.banner_days || '30', admin_recovery_email: s.admin_recovery_email || '', min_dest_packages: s.min_dest_packages || '1' }) }).catch(() => {})
      fetch('/api/auth/admin-profile').then(r => r.ok ? r.json() : null).then(d => { if (!ignore && d?.username) { setAdminUsername(d.username); setNewUsername(d.username) } }).catch(() => {})
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
    const pkgId = generatePkgId('package', allPackages)
    setForm({ ...EMPTY_PKG, id: pkgId, destination: first?.name ?? '', badgeColor: first?.color ?? '#2e9e7a' })
    setEditId(null); setTab('basic'); setShowPreview(false); setModal('form')
  }

  const openEdit = (pkg) => {
    const migrateAct = a => typeof a === 'string'
      ? { time: '', emoji: '', title: a, details: [''], tags: [] }
      : { time: a.time || '', emoji: a.emoji || '', title: a.title || '', details: a.details?.length ? a.details : [''], tags: a.tags || [] }
    setForm({
      ...pkg,
      highlights: pkg.highlights || [],
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      itinerary: pkg.itinerary?.length ? pkg.itinerary.map(d => ({ ...d, hotel: d.hotel || '', activities: d.activities?.length ? d.activities.map(migrateAct) : [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: d.image || '' })) : [{ day: 1, title: '', description: '', activities: [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: '', hotel: '' }],
      availableDates: pkg.availableDates || [],
    })
    setEditId(pkg.id); setTab('basic'); setShowPreview(false); setModal('form')
  }

  const openDuplicate = (pkg) => {
    const migrateAct = a => typeof a === 'string'
      ? { time: '', emoji: '', title: a, details: [''], tags: [] }
      : { time: a.time || '', emoji: a.emoji || '', title: a.title || '', details: a.details?.length ? a.details : [''], tags: a.tags || [] }
    setForm({
      ...EMPTY_PKG,
      ...pkg,
      id: generatePkgId(pkg.category, allPackages),
      title: pkg.title ? `${pkg.title} (Copy)` : '',
      featured: false, featuredAt: null, featuredDays: 30, hidden: false,
      highlights: pkg.highlights || [],
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      itinerary: pkg.itinerary?.length ? pkg.itinerary.map(d => ({ ...d, hotel: d.hotel || '', activities: d.activities?.length ? d.activities.map(migrateAct) : [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: d.image || '' })) : [{ day: 1, title: '', description: '', activities: [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: '', hotel: '' }],
      availableDates: pkg.availableDates || [],
    })
    setEditId(null); setTab('basic'); setShowPreview(false); setModal('form')
    toast.success('Duplicated — adjust and save as a new package')
  }

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error('Package title is required'); setShowPreview(false); setTab('basic'); return }
    if (!form.salePrice) { toast.error('Sale price is required'); setShowPreview(false); setTab('basic'); return }
    const pkg = {
      ...form,
      originalPrice: Number(form.originalPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      childPrice: Number(form.childPrice) || 0,
      adults: Number(form.adults) || 0,
      children: Number(form.children) || 0,
      rooms: Number(form.rooms) || 0,
      highlights: (form.highlights || []).filter(Boolean),
      inclusions: (form.inclusions || []).filter(Boolean),
      exclusions: (form.exclusions || []).filter(Boolean),
      itinerary: (form.itinerary || []).map(d => ({ ...d, activities: (d.activities || []).map(a => typeof a === 'string' ? { time: '', emoji: '', title: a, details: [], tags: [] } : { ...a, details: (a.details || []).filter(Boolean) }).filter(a => a.title || a.details?.length) })),
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

  const handleTogglePkgHidden = async (id, hidden) => {
    setPkgVisLoading(id)
    try {
      const res = await fetch(`/api/packages/${id}/hide`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }) })
      if (!res.ok) throw new Error()
      await fetchPackages()
      toast.success(hidden ? 'Package hidden from website' : 'Package visible on website')
    } catch {
      toast.error('Failed to update visibility')
    } finally {
      setPkgVisLoading(null)
    }
  }

  const handleFeature = async (id, featured, order, days = 30) => {
    setActionLoading(`feature-${id}`)
    try {
      const res = await fetch(`/api/packages/${id}/feature`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured, order, days: Number(days) }) })
      if (!res.ok) throw new Error()
      await fetchPackages()
      toast.success(featured ? `Added to hero for ${days} day${days != 1 ? 's' : ''}!` : 'Removed from hero')
    } catch {
      toast.error('Failed to update featured status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFeatureConfirm = async () => {
    if (!featureModal) return
    const days = Math.max(1, parseInt(featureDays) || 30)
    setFeatureModal(null)
    await handleFeature(featureModal.id, true, featureModal.order, days)
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

  const handleToggleDestFeatured = async (id, featured) => {
    setDestVisLoading(id)
    try {
      const res = await fetch(`/api/destinations/${id}/feature`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured }) })
      if (!res.ok) throw new Error()
      await fetchDestinations()
      toast.success(featured ? 'Destination shown on website' : 'Destination hidden from website')
    } catch { toast.error('Failed to update destination visibility') }
    finally { setDestVisLoading(null) }
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
      const payload = {
        phone: settingsForm.phone.trim().replace(/\D/g, ''),
        whatsapp: (settingsForm.whatsapp.trim() || settingsForm.phone.trim()).replace(/\D/g, ''),
        email: settingsForm.email.trim(),
        email2: settingsForm.email2.trim(),
        banner_days: String(Math.max(1, parseInt(settingsForm.banner_days) || 30)),
        admin_recovery_email: settingsForm.admin_recovery_email.trim(),
        min_dest_packages: String(Math.max(0, parseInt(settingsForm.min_dest_packages) || 1)),
      }
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      invalidateSettingsCache()
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings.') }
    finally { setSettingsSaving(false) }
  }

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) { toast.error('Username cannot be empty'); return }
    if (newUsername.trim() === adminUsername) { toast.info('Username unchanged'); return }
    setUsernameSaving(true)
    try {
      const res = await fetch('/api/auth/admin-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newUsername: newUsername.trim() }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to update username'); return }
      setAdminUsername(data.username)
      toast.success('Username updated!')
    } catch { toast.error('Failed to update username') }
    finally { setUsernameSaving(false) }
  }

  // ─── Array helpers ────────────────────────────────────────────────────────
  const itinChange = (di, field, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => i === di ? { ...d, [field]: val } : d) }))
  const addDay = () => setForm(f => ({ ...f, itinerary: [...(f.itinerary || []), { day: (f.itinerary || []).length + 1, title: '', description: '', activities: [{ time: '', emoji: '', title: '', details: [''], tags: [] }], image: '', hotel: '' }] }))
  const removeDay = (idx) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).filter((_, i) => i !== idx) }))
  const addActivity = (di) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: [...(d.activities || []), { time: '', emoji: '', title: '', details: [''], tags: [] }] }) }))
  const removeActivity = (di, ai) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => i !== di ? d : { ...d, activities: (d.activities || []).filter((_, j) => j !== ai) }) }))
  const actFieldChange = (di, ai, field, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const acts = [...(d.activities || [])]; acts[ai] = { ...acts[ai], [field]: val }; return { ...d, activities: acts } }) }))
  const actDetailChange = (di, ai, ki, val) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const acts = [...(d.activities || [])]; const det = [...(acts[ai].details || [])]; det[ki] = val; acts[ai] = { ...acts[ai], details: det }; return { ...d, activities: acts } }) }))
  const addActDetail = (di, ai) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const acts = [...(d.activities || [])]; acts[ai] = { ...acts[ai], details: [...(acts[ai].details || []), ''] }; return { ...d, activities: acts } }) }))
  const removeActDetail = (di, ai, ki) => setForm(f => ({ ...f, itinerary: (f.itinerary || []).map((d, i) => { if (i !== di) return d; const acts = [...(d.activities || [])]; acts[ai] = { ...acts[ai], details: (acts[ai].details || []).filter((_, j) => j !== ki) }; return { ...d, activities: acts } }) }))

  const addDateGroup = () => setForm(f => ({ ...f, availableDates: [...(f.availableDates || []), { month: '', dates: [{ start: '', end: '' }] }] }))
  const removeDateGroup = (gi) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).filter((_, i) => i !== gi) }))
  const dateGroupChange = (gi, field, val) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i === gi ? { ...g, [field]: val } : g) }))
  const addDateRange = (gi) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i === gi ? { ...g, dates: [...(g.dates || []), { start: '', end: '' }] } : g) }))
  const removeDateRange = (gi, di) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i !== gi ? g : { ...g, dates: (g.dates || []).filter((_, j) => j !== di) }) }))
  const setDateField = (gi, di, field, val) => setForm(f => ({ ...f, availableDates: (f.availableDates || []).map((g, i) => i !== gi ? g : { ...g, dates: (g.dates || []).map((d, j) => j !== di ? d : { ...getDR(d), [field]: val }) }) }))

  // ─── Derived data ─────────────────────────────────────────────────────────
  const uniquePkgAgencies = [...new Set(allPackages.map(p => p.agencyName).filter(Boolean))].sort()

  const filteredPackages = allPackages
    .filter(p => pkgFilter === 'all' || p.category === pkgFilter)
    .filter(p => pkgStatus === 'all' || p.status === pkgStatus)
    .filter(p => pkgAgencyFilter === 'all' || p.agencyName === pkgAgencyFilter)
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
    modal:       { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', marginBottom: 32 },
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
            { key: 'packages',      label: 'Packages',     icon: Package,   badge: pendingCount > 0 ? pendingCount : null },
            { key: 'destinations',  label: 'Destinations', icon: MapPin },
            { key: 'agencies',      label: 'Agencies',     icon: Building2, badge: pendingAgencies > 0 ? pendingAgencies : null },
            { key: 'enquiries',     label: 'Enquiries',    icon: Inbox,     badge: enquiries.length > 0 && section !== 'enquiries' ? enquiries.length : null },
            { key: 'settings',      label: 'Settings',     icon: Settings },
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

            {/* Search + Agency filter */}
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={pkgSearch}
                onChange={e => setPkgSearch(e.target.value)}
                placeholder="Search by Package ID or title..."
                style={{ width: '100%', maxWidth: 320, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
              {uniquePkgAgencies.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setAgencyDropdownOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${pkgAgencyFilter !== 'all' ? '#e8520a' : '#e5e7eb'}`, background: pkgAgencyFilter !== 'all' ? '#fff5ef' : '#fff', fontSize: 13, color: pkgAgencyFilter !== 'all' ? '#e8520a' : '#374151', cursor: 'pointer', fontWeight: pkgAgencyFilter !== 'all' ? 700 : 400, minWidth: 180, justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={13} />
                      {pkgAgencyFilter === 'all' ? 'All Agencies' : pkgAgencyFilter}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
                  </button>
                  {agencyDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 240, overflow: 'hidden' }}
                      onMouseLeave={() => setAgencyDropdownOpen(false)}
                    >
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          autoFocus
                          value={agencyDropdownSearch}
                          onChange={e => setAgencyDropdownSearch(e.target.value)}
                          placeholder="Search agency..."
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {[{ value: 'all', label: 'All Agencies' }, ...uniquePkgAgencies.filter(a => a.toLowerCase().includes(agencyDropdownSearch.toLowerCase())).map(a => ({ value: a, label: a }))].map(opt => (
                          <button key={opt.value} onClick={() => { setPkgAgencyFilter(opt.value); setAgencyDropdownOpen(false); setAgencyDropdownSearch('') }}
                            style={{ width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', background: pkgAgencyFilter === opt.value ? '#fff5ef' : 'none', color: pkgAgencyFilter === opt.value ? '#e8520a' : '#374151', fontSize: 13, fontWeight: pkgAgencyFilter === opt.value ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {opt.value !== 'all' && <Building2 size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                            {opt.label}
                          </button>
                        ))}
                        {agencyDropdownSearch && uniquePkgAgencies.filter(a => a.toLowerCase().includes(agencyDropdownSearch.toLowerCase())).length === 0 && (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No agencies found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {pkgAgencyFilter !== 'all' && (
                <button onClick={() => setPkgAgencyFilter('all')} style={{ fontSize: 12, color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                  Clear ✕
                </button>
              )}
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
              <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Star size={15} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Hero Section ({featuredPackages.length} active)</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {featuredPackages.map(p => {
                    const expiresAt = p.featuredAt ? new Date(new Date(p.featuredAt).getTime() + p.featuredDays * 86400000) : null
                    const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null
                    return (
                      <div key={p.id} style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '6px 12px' }}>
                        <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>{p.title}</div>
                        {daysLeft !== null && (
                          <div style={{ fontSize: 10, color: daysLeft <= 3 ? '#f87171' : 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 600 }}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                        {['Pkg ID', 'Package', 'Category', 'Destination', 'Price', 'Status', 'Hero', 'Visible', 'Actions'].map((h, i) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: i >= 6 ? 'center' : 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg, idx) => {
                        const sc = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending
                        const cat = CATEGORIES.find(c => c.value === pkg.category)
                        return (
                          <tr key={pkg.id} style={{ borderBottom: idx < filteredPackages.length - 1 ? '1px solid #f9fafb' : 'none', opacity: pkg.hidden ? 0.55 : 1 }}
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                  <button
                                    onClick={() => {
                                      if (pkg.featured) {
                                        handleFeature(pkg.id, false, 0)
                                      } else {
                                        setFeatureDays('30')
                                        setFeatureModal({ id: pkg.id, order: featuredPackages.length })
                                      }
                                    }}
                                    disabled={actionLoading === `feature-${pkg.id}`}
                                    title={pkg.featured ? 'Remove from hero' : 'Push to hero'}
                                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${pkg.featured ? '#fde68a' : '#e5e7eb'}`, background: pkg.featured ? '#fffbeb' : 'none', cursor: actionLoading === `feature-${pkg.id}` ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {actionLoading === `feature-${pkg.id}`
                                      ? <span style={{ width: 10, height: 10, border: '2px solid #fde68a', borderTop: '2px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                      : <Star size={14} style={{ color: pkg.featured ? '#f59e0b' : '#d1d5db', fill: pkg.featured ? '#f59e0b' : 'none' }} />
                                    }
                                  </button>
                                  {pkg.featured && pkg.featuredAt && (
                                    <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {pkg.featuredDays}d
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleTogglePkgHidden(pkg.id, !pkg.hidden)}
                                disabled={pkgVisLoading === pkg.id}
                                title={pkg.hidden ? 'Hidden from website — click to show' : 'Visible on website — click to hide'}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, border: `1.5px solid ${pkg.hidden ? '#e5e7eb' : '#22c55e'}`, background: pkg.hidden ? '#f9fafb' : '#f0fdf4', cursor: pkgVisLoading === pkg.id ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 11, color: pkg.hidden ? '#9ca3af' : '#22c55e', opacity: pkgVisLoading === pkg.id ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                                {pkgVisLoading === pkg.id
                                  ? <span style={{ width: 10, height: 10, border: `2px solid ${pkg.hidden ? '#e5e7eb' : '#bbf7d0'}`, borderTop: `2px solid ${pkg.hidden ? '#9ca3af' : '#22c55e'}`, borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                  : <Eye size={11} />}
                                {pkg.hidden ? 'Hidden' : 'Visible'}
                              </button>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                <Link href={`/packages/${pkg.id}`} target="_blank"
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none' }}>
                                  <Eye size={13} />
                                </Link>
                                <button onClick={() => openEdit(pkg)} title="Edit"
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => openDuplicate(pkg)} title="Duplicate"
                                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                  <Copy size={13} />
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

        {/* ── Destinations ── */}
        {section === 'destinations' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Destinations</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{destinations.length} total · {destinations.filter(d => d.featured !== false).length} shown on website</p>
              </div>
              <button onClick={() => { setNewDest({ name: '', color: '#e8520a', image_url: '', description: '', emoji: '📍' }); setEditDestId(null); setModal('destination') }} style={S.btn()}>
                <Plus size={13} /> Add Destination
              </button>
            </div>

            {destinations.length === 0 ? (
              <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: 15 }}>No destinations yet</p>
                <p style={{ fontSize: 13 }}>Add destinations to organise your packages.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {destinations.map(d => (
                  <div key={d.id} style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 56, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                          {d.image_url && <img src={d.image_url} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{d.emoji || '📍'} {d.name}</span>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {allPackages.filter(p => p.destination === d.name).length} packages
                            {d.description && <span style={{ marginLeft: 8, color: '#6b7280' }}>· {d.description}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleToggleDestFeatured(d.id, !(d.featured !== false))}
                          disabled={destVisLoading === d.id}
                          title={d.featured !== false ? 'Shown on website — click to hide' : 'Hidden from website — click to show'}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${d.featured !== false ? '#22c55e' : '#e5e7eb'}`, background: d.featured !== false ? '#f0fdf4' : '#f9fafb', cursor: destVisLoading === d.id ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, color: d.featured !== false ? '#22c55e' : '#9ca3af', opacity: destVisLoading === d.id ? 0.7 : 1 }}>
                          {destVisLoading === d.id
                            ? <span style={{ width: 13, height: 13, border: `2px solid ${d.featured !== false ? '#bbf7d0' : '#e5e7eb'}`, borderTop: `2px solid ${d.featured !== false ? '#22c55e' : '#9ca3af'}`, borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                            : <Eye size={13} />}
                          {d.featured !== false ? 'Visible' : 'Hidden'}
                        </button>
                        <button onClick={() => { setEditDestId(d.id); setEditDestForm({ color: d.color, image_url: d.image_url || '', description: d.description || '', emoji: d.emoji || '📍' }); setModal('destination') }}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteDestination(d.id, d.name)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: agency.description ? 8 : 0, alignItems: 'center' }}>
                            <a href={`mailto:${agency.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                              <Mail size={13} style={{ color: '#6b7280' }} /> {agency.email}
                            </a>
                            <a href={`tel:${agency.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                              <Phone size={13} style={{ color: '#e8520a' }} /> {agency.phone}
                            </a>
                            <a href={`https://wa.me/${agency.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#25d366', textDecoration: 'none', padding: '4px 12px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <MessageCircle size={12} /> WhatsApp
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
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Business Settings</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Changes are reflected instantly across the website.</p>
            </div>
            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Phone */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={15} style={{ color: '#e8520a' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Phone Number</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Used for the "Call Us" button across the site</div>
                  </div>
                </div>
                <label style={S.label}>Number (with country code, no +)</label>
                <input value={settingsForm.phone} onChange={e => setSettingsForm(s => ({ ...s, phone: e.target.value }))} style={{ ...S.input, marginBottom: 6 }} placeholder="e.g. 918062179246" />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 12px' }}>Format: 91 + 10-digit mobile (e.g. 919876543210)</p>
                {settingsForm.phone.replace(/\D/g,'') && (
                  <a href={`tel:+${settingsForm.phone.replace(/\D/g,'')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#e8520a', textDecoration: 'none', padding: '5px 12px', borderRadius: 999, border: '1px solid #fbd0b5', background: '#fff5ef' }}>
                    <Phone size={12} /> Preview call link
                  </a>
                )}
              </div>

              {/* WhatsApp */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageCircle size={15} style={{ color: '#25d366' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>WhatsApp Number</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Used for all WhatsApp chat & enquiry buttons</div>
                  </div>
                </div>
                <label style={S.label}>WhatsApp Number (with country code, no +)</label>
                <input value={settingsForm.whatsapp} onChange={e => setSettingsForm(s => ({ ...s, whatsapp: e.target.value }))} style={{ ...S.input, marginBottom: 6 }} placeholder="e.g. 918062179246 (leave blank to use phone number)" />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 12px' }}>Leave blank to use the same number as Phone</p>
                {(settingsForm.whatsapp || settingsForm.phone).replace(/\D/g,'') && (
                  <a href={`https://wa.me/${(settingsForm.whatsapp || settingsForm.phone).replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#25d366', textDecoration: 'none', padding: '5px 12px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                    <MessageCircle size={12} /> Preview WhatsApp link
                  </a>
                )}
              </div>

              {/* Email */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff1ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={15} style={{ color: '#2e3da8' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Business Email</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Shown on the contact section & enquiry responses</div>
                  </div>
                </div>
                <label style={S.label}>Email Address</label>
                <input type="email" value={settingsForm.email} onChange={e => setSettingsForm(s => ({ ...s, email: e.target.value }))} style={{ ...S.input, marginBottom: 6 }} placeholder="e.g. hello@greenkeralatrips.com" />
                {settingsForm.email.trim() && (
                  <a href={`mailto:${settingsForm.email.trim()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2e3da8', textDecoration: 'none', padding: '5px 12px', borderRadius: 999, border: '1px solid #c7d0ff', background: '#eff1ff', marginTop: 6 }}>
                    <Mail size={12} /> Preview email link
                  </a>
                )}
              </div>

              {/* Secondary Email */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={15} style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Secondary Email <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>(optional)</span></div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>A second contact email shown on the website</div>
                  </div>
                </div>
                <label style={S.label}>Secondary Email Address</label>
                <input type="email" value={settingsForm.email2} onChange={e => setSettingsForm(s => ({ ...s, email2: e.target.value }))} style={{ ...S.input, marginBottom: 6 }} placeholder="e.g. support@greenkeralatrips.com" />
                {settingsForm.email2.trim() && (
                  <a href={`mailto:${settingsForm.email2.trim()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', textDecoration: 'none', padding: '5px 12px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4', marginTop: 6 }}>
                    <Mail size={12} /> Preview email link
                  </a>
                )}
              </div>

              {/* Banner Duration */}
              {/* Destination Visibility */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0ebe1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={15} style={{ color: '#e8520a' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Destination Visibility</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Minimum packages required to show a destination on the customer site</div>
                  </div>
                </div>
                <label style={S.label}>Minimum Packages</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="number" min="0" max="99"
                    value={settingsForm.min_dest_packages}
                    onChange={e => setSettingsForm(s => ({ ...s, min_dest_packages: e.target.value }))}
                    style={{ ...S.input, maxWidth: 90 }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                    {parseInt(settingsForm.min_dest_packages) === 0
                      ? 'Show all destinations even with 0 packages'
                      : `Hide destinations with fewer than ${settingsForm.min_dest_packages} package${parseInt(settingsForm.min_dest_packages) !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Admin Account */}
              <div style={{ ...S.card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Settings size={15} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Admin Account</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Change your login username or recovery email</div>
                  </div>
                </div>

                {/* Username */}
                <label style={S.label}>Login Username</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    style={{ ...S.input, flex: 1 }}
                    placeholder="e.g. admin"
                  />
                  <button
                    onClick={handleUpdateUsername}
                    disabled={usernameSaving || !newUsername.trim() || newUsername.trim() === adminUsername}
                    style={{ ...S.btn('#f3f4f6', '#555'), flexShrink: 0, opacity: (usernameSaving || !newUsername.trim() || newUsername.trim() === adminUsername) ? 0.5 : 1, cursor: (usernameSaving || !newUsername.trim() || newUsername.trim() === adminUsername) ? 'not-allowed' : 'pointer' }}>
                    {usernameSaving ? <span style={{ width: 12, height: 12, border: '2px solid #ccc', borderTop: '2px solid #555', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <Check size={13} />}
                    Update
                  </button>
                </div>
                {adminUsername && <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 16px' }}>Current: <strong>{adminUsername}</strong></p>}

                <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0 16px' }} />

                {/* Recovery email */}
                <label style={S.label}>Recovery Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(for Forgot Password OTP)</span></label>
                <input
                  type="email"
                  value={settingsForm.admin_recovery_email}
                  onChange={e => setSettingsForm(s => ({ ...s, admin_recovery_email: e.target.value }))}
                  style={{ ...S.input, marginBottom: 6 }}
                  placeholder="e.g. admin@greenkeralatrips.com"
                />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Saved with the main "Save All Settings" button below.</p>
              </div>

              <button onClick={handleSaveSettings} disabled={settingsSaving}
                style={{ alignSelf: 'flex-start', padding: '11px 28px', borderRadius: 10, border: 'none', cursor: settingsSaving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, opacity: settingsSaving ? 0.7 : 1 }}>
                {settingsSaving ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Saving...</> : <><Check size={15} /> Save All Settings</>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Package Modal ── */}
      {modal === 'form' && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg,#e8520a,#c93d00)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{showPreview ? 'Package Preview' : editId ? 'Edit Package' : 'Add Package'}</h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            {!showPreview && (
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
              {[['basic','Basic'], ...(form.category === 'homestay' ? [['stay','Stay Details']] : []), ['itinerary','Itinerary'],['media','Media & Lists']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === k ? '#e8520a' : 'transparent'}`, color: tab === k ? '#e8520a' : '#9ca3af' }}>{l}</button>
              ))}
            </div>
            )}
            <div style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
              {showPreview && <PackagePreview pkg={form} />}
              {!showPreview && tab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={S.label}>Package ID</label>
                    <input value={form.id} readOnly style={{ ...S.input, background: '#f0f0f0', color: '#6b7280', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.04em', cursor: 'default' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, paddingBottom: 10 }}>
                      Auto-generated based on category.<br />
                      <span style={{ color: '#6b7280' }}>PKG · GPKG · HS · OTH</span>
                    </div>
                  </div>
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
                    <select value={form.category} onChange={e => { const cat = e.target.value; setForm(f => ({ ...f, category: cat, ...(!editId && { id: generatePkgId(cat, allPackages) }) })); if (cat !== 'homestay') setTab(t => t === 'stay' ? 'basic' : t) }} style={{ ...S.input, cursor: 'pointer' }}>
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
                    <label style={S.label}>Sale Price (₹) * <span style={{ textTransform: 'none', fontWeight: 600, color: '#9ca3af' }}>· per adult</span></label>
                    <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Price per Child (₹)</label>
                    <input type="number" value={form.childPrice} onChange={e => setForm(f => ({ ...f, childPrice: e.target.value }))} style={S.input} />
                  </div>
                  <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={S.label}>Adults</label>
                      <input type="number" min="0" value={form.adults} onChange={e => setForm(f => ({ ...f, adults: e.target.value }))} style={S.input} placeholder="2" />
                    </div>
                    <div>
                      <label style={S.label}>Children</label>
                      <input type="number" min="0" value={form.children} onChange={e => setForm(f => ({ ...f, children: e.target.value }))} style={S.input} placeholder="0" />
                    </div>
                    <div>
                      <label style={S.label}>Rooms</label>
                      <input type="number" min="0" value={form.rooms} onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))} style={S.input} placeholder="1" />
                    </div>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Overview</label>
                    <textarea rows={3} value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Note (optional)</label>
                    <textarea rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} placeholder="e.g. Rates vary on customization, special terms, important info..." />
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
              {!showPreview && tab === 'itinerary' && (
                <div>
                  {(form.itinerary || []).map((day, di) => (
                    <div key={di} style={{ border: '1px solid #f3f4f6', borderRadius: 12, padding: 14, marginBottom: 10, background: '#fafafa' }}>
                      {/* Day header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day}</div>
                        {(form.itinerary || []).length > 1 && <button onClick={() => removeDay(di)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={14} /></button>}
                      </div>
                      <input value={day.title} onChange={e => itinChange(di, 'title', e.target.value)} style={{ ...S.input, marginBottom: 8 }} placeholder={`Day ${day.day} title (e.g. Arrival & Sightseeing)`} />
                      <textarea rows={2} value={day.description} onChange={e => itinChange(di, 'description', e.target.value)} style={{ ...S.input, resize: 'none', marginBottom: 8, lineHeight: 1.5 }} placeholder="Brief day description..." />
                      {/* Hotel / overnight */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>🛏</span>
                        <input value={day.hotel || ''} onChange={e => itinChange(di, 'hotel', e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Overnight stay at... (e.g. The ONE Legian)" />
                      </div>
                      {/* Day image */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 5 }}>Day Image URL (optional)</div>
                        <input value={day.image || ''} onChange={e => itinChange(di, 'image', e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="https://..." />
                        {day.image && <img src={day.image} alt={`Day ${day.day}`} onError={e => e.target.style.display = 'none'} style={{ marginTop: 5, width: '100%', height: 60, objectFit: 'cover', borderRadius: 7 }} />}
                      </div>
                      {/* Activities */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Activities / Schedule</div>
                      {(day.activities || []).map((act, ai) => {
                        const a = typeof act === 'string' ? { time: '', emoji: '', title: act, details: [''], tags: [] } : act
                        return (
                          <div key={ai} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, marginBottom: 8, background: '#fff' }}>
                            {/* Time + Emoji + Title row */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
                              <input value={a.time} onChange={e => actFieldChange(di, ai, 'time', e.target.value)} style={{ ...S.input, width: 80, flexShrink: 0, fontFamily: 'monospace', textAlign: 'center' }} placeholder="09:00" />
                              <input value={a.emoji} onChange={e => actFieldChange(di, ai, 'emoji', e.target.value)} style={{ ...S.input, width: 52, flexShrink: 0, textAlign: 'center', fontSize: 16 }} placeholder="🏄" />
                              <input value={a.title} onChange={e => actFieldChange(di, ai, 'title', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="Activity title..." />
                              {(day.activities || []).length > 1 && (
                                <button onClick={() => removeActivity(di, ai)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}><Trash2 size={13} /></button>
                              )}
                            </div>
                            {/* Detail checkpoints */}
                            <div style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>✓ Details / Checkpoints</div>
                              {(a.details || []).map((det, ki) => (
                                <div key={ki} style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                                  <span style={{ color: '#22c55e', fontSize: 12, paddingTop: 10, flexShrink: 0 }}>✓</span>
                                  <input value={det} onChange={e => actDetailChange(di, ai, ki, e.target.value)} style={{ ...S.input, fontSize: 12, flex: 1 }} placeholder="e.g. Pick up time 09:00 am, Start from hotel" />
                                  {(a.details || []).length > 1 && <button onClick={() => removeActDetail(di, ai, ki)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}><X size={12} /></button>}
                                </div>
                              ))}
                              <button onClick={() => addActDetail(di, ai)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 11, fontWeight: 600, padding: '2px 0' }}>+ Add detail</button>
                            </div>
                            {/* Tags */}
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Tags (comma-separated)</div>
                              <input value={(a.tags || []).join(', ')} onChange={e => actFieldChange(di, ai, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} style={{ ...S.input, fontSize: 12 }} placeholder="e.g. Private Transfers, Meal Included" />
                              {(a.tags || []).length > 0 && (
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                                  {(a.tags || []).map((tag, ti) => (
                                    <span key={ti} style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={() => addActivity(di)} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1.5px dashed #e5e7eb', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, fontWeight: 600 }}>+ Add Activity</button>
                    </div>
                  ))}
                  <button onClick={addDay} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '2px dashed #fbd0b5', background: 'none', cursor: 'pointer', color: '#e8520a', fontSize: 13, fontWeight: 600 }}>+ Add Day</button>
                </div>
              )}
              {!showPreview && tab === 'stay' && (
                <HomestayFields form={form} setForm={setForm} S={S} pkgOptions={pkgOptions} onOptionsUpdate={setPkgOptions} />
              )}

              {!showPreview && tab === 'media' && (
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
              {showPreview ? (
                <button onClick={() => setShowPreview(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginRight: 'auto' }}>← Back to Edit</button>
              ) : (
                <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              )}
              {!showPreview && (
                <button onClick={() => setShowPreview(true)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e8520a', background: '#fff', color: '#e8520a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} /> Preview
                </button>
              )}
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
                            <button
                              onClick={() => handleToggleDestFeatured(d.id, !d.featured)}
                              disabled={destVisLoading === d.id}
                              title={d.featured !== false ? 'Shown on website (click to hide)' : 'Hidden from website (click to show)'}
                              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${d.featured !== false ? '#bbf7d0' : '#e5e7eb'}`, background: d.featured !== false ? '#f0fdf4' : '#f9fafb', cursor: destVisLoading === d.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.featured !== false ? '#22c55e' : '#d1d5db', opacity: destVisLoading === d.id ? 0.7 : 1 }}>
                              {destVisLoading === d.id
                                ? <span style={{ width: 11, height: 11, border: `2px solid ${d.featured !== false ? '#bbf7d0' : '#e5e7eb'}`, borderTop: `2px solid ${d.featured !== false ? '#22c55e' : '#9ca3af'}`, borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                : <Eye size={12} />}
                            </button>
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

      {/* ── Feature Duration Modal ── */}
      {featureModal && (
        <div style={{ ...S.overlay, alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setFeatureModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Star size={24} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 6 }}>Add to Hero Banner</h3>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              How many days should this package appear in the hero slider?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              <input
                type="number" min="1" max="365"
                value={featureDays}
                onChange={e => setFeatureDays(e.target.value)}
                autoFocus
                style={{ width: 90, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #fde68a', fontSize: 22, fontWeight: 800, textAlign: 'center', outline: 'none', color: '#111', background: '#fffbeb' }}
              />
              <span style={{ fontSize: 15, color: '#6b7280', fontWeight: 600 }}>days</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setFeatureModal(null)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleFeatureConfirm} disabled={!featureDays || parseInt(featureDays) < 1} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: !featureDays || parseInt(featureDays) < 1 ? 'not-allowed' : 'pointer', opacity: !featureDays || parseInt(featureDays) < 1 ? 0.6 : 1 }}>
                <Star size={13} style={{ display: 'inline', marginRight: 5, fill: '#fff', verticalAlign: 'middle' }} />
                Add to Hero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
