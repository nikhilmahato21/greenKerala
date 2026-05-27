'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function AgencyLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
    card: { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' },
    input: { width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' },
    label: { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    wrap: { position: 'relative', marginBottom: 16 },
    icon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/agency-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push('/agency/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>Agency Portal</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Sign in to manage your packages</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: '28px 32px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={S.wrap}>
            <label style={S.label}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={S.icon} />
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={S.input} placeholder="agency@email.com" autoComplete="email" />
            </div>
          </div>

          <div style={S.wrap}>
            <label style={S.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={S.icon} />
              <input required type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ ...S.input, paddingRight: 40 }} placeholder="Your password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Signing in...</>
              : 'Sign In'
            }
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
            Not a partner yet?{' '}
            <Link href="/agency/register" style={{ color: '#e8520a', fontWeight: 600, textDecoration: 'none' }}>Apply to join</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
