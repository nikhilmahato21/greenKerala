'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Building2, Mail, Phone, Lock, Globe, FileText, ArrowLeft, Check } from 'lucide-react'

export default function AgencyRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', description: '', website: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
    card: { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' },
    input: { width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' },
    label: { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    wrap: { position: 'relative' },
    icon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
  }

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, description: form.description, website: form.website }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={36} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#111', marginBottom: 10 }}>Application Submitted!</h2>
          <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
            Your agency registration is under review. Our admin team will get back to you soon. Once approved, you can log in and start adding packages.
          </p>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 999, background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg,#e8520a,#c93d00)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>Join as Agency</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>Partner with us to list your Kerala packages</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: '28px 32px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Agency / Business Name *</label>
              <div style={S.wrap}>
                <Building2 size={15} style={S.icon} />
                <input required value={form.name} onChange={f('name')} style={S.input} placeholder="Kerala Holidays Pvt Ltd" />
              </div>
            </div>
            <div>
              <label style={S.label}>Email Address *</label>
              <div style={S.wrap}>
                <Mail size={15} style={S.icon} />
                <input required type="email" value={form.email} onChange={f('email')} style={S.input} placeholder="agency@email.com" />
              </div>
            </div>
            <div>
              <label style={S.label}>Phone Number *</label>
              <div style={S.wrap}>
                <Phone size={15} style={S.icon} />
                <input required value={form.phone} onChange={f('phone')} style={S.input} placeholder="9876543210" />
              </div>
            </div>
            <div>
              <label style={S.label}>Password *</label>
              <div style={S.wrap}>
                <Lock size={15} style={S.icon} />
                <input required type="password" value={form.password} onChange={f('password')} style={S.input} placeholder="Min. 8 characters" />
              </div>
            </div>
            <div>
              <label style={S.label}>Confirm Password *</label>
              <div style={S.wrap}>
                <Lock size={15} style={S.icon} />
                <input required type="password" value={form.confirm} onChange={f('confirm')} style={S.input} placeholder="Repeat password" />
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Website (optional)</label>
              <div style={S.wrap}>
                <Globe size={15} style={S.icon} />
                <input value={form.website} onChange={f('website')} style={S.input} placeholder="https://youragency.com" />
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Brief Description</label>
              <div style={{ position: 'relative' }}>
                <FileText size={15} style={{ ...S.icon, top: 14, transform: 'none' }} />
                <textarea value={form.description} onChange={f('description')} rows={3}
                  style={{ ...S.input, paddingTop: 11, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="Tell us about your agency — speciality, experience, regions covered..." />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Submitting...</>
              : 'Submit Application'
            }
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
            Already approved?{' '}
            <Link href="/agency" style={{ color: '#e8520a', fontWeight: 600, textDecoration: 'none' }}>Sign in to your dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
