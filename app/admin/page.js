'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        const { error: msg } = await res.json()
        setError(msg || 'Invalid username or password')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f0ebe1' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

          {/* Header */}
          <div style={{ padding: '32px 32px 24px', textAlign: 'center', background: 'linear-gradient(135deg,#2e3da8,#1c2575)' }}>
            <div style={{ width: 74, height: 74, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.3)', margin: '0 auto 12px' , background:'#ffffff'}}>
              <Image src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1779855779/WhatsApp_Image_2026-05-22_at_15.06.01-removebg-preview_mr6pdc.png" alt="Green Kerala Trips" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4 }}>Green Kerala Trips</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Admin Panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ padding: '28px 32px 32px' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)} required
                placeholder="admin"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12,
                  border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111',
                  background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111',
                    background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button" onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#e8520a,#c93d00)', color: '#fff',
                fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Signing in...</>
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
