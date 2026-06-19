'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'

const INPUT = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111',
  background: '#f9fafb', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

// Self-contained enquiry form that posts to /api/enquiries.
export default function EnquiryForm({ pkg, isMobile, prefillMessage = '' }) {
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', message: prefillMessage })
  const [status, setStatus] = useState(null) // null | 'sending' | 'sent' | 'error'

  const submit = async (e) => {
    e.preventDefault()
    if (!enquiry.name.trim() || !enquiry.phone.trim()) return
    setStatus('sending')
    const msgWithId = enquiry.message.trim()
      ? `${enquiry.message.trim()}\n\nPackage ID: ${pkg.id}`
      : `Package ID: ${pkg.id}`
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkg.id, package_title: pkg.title, ...enquiry, message: msgWithId }),
      })
      if (res.ok) { setStatus('sent'); setEnquiry({ name: '', phone: '', email: '', message: '' }) }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  if (status === 'sent') return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Send size={22} style={{ color: '#16a34a' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 }}>Enquiry Sent!</h3>
      <p style={{ color: '#6b7280', fontSize: 14 }}>We&rsquo;ll get back to you within a few hours.</p>
    </div>
  )

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <input required value={enquiry.name} onChange={e => setEnquiry(v => ({ ...v, name: e.target.value }))} placeholder="Your name *" style={INPUT} />
        <input required value={enquiry.phone} onChange={e => setEnquiry(v => ({ ...v, phone: e.target.value }))} placeholder="Phone number *" style={INPUT} />
      </div>
      <input value={enquiry.email} onChange={e => setEnquiry(v => ({ ...v, email: e.target.value }))} placeholder="Email (optional)" style={{ ...INPUT, marginBottom: 12 }} />
      <textarea rows={3} value={enquiry.message} onChange={e => setEnquiry(v => ({ ...v, message: e.target.value }))} placeholder="Tell us about your trip (dates, guests, requests)..." style={{ ...INPUT, resize: 'vertical', marginBottom: 12, lineHeight: 1.5 }} />
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Something went wrong. Please try again.</p>}
      <button type="submit" disabled={status === 'sending'}
        style={{ width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
          background: status === 'sending' ? '#e5e7eb' : 'linear-gradient(135deg,#e8520a,#c93d00)',
          color: status === 'sending' ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: 15,
          cursor: status === 'sending' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {status === 'sending'
          ? <><span style={{ width: 14, height: 14, border: '2px solid #d1d5db', borderTop: '2px solid #9ca3af', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Sending...</>
          : <><Send size={15} /> Send Enquiry</>}
      </button>
    </form>
  )
}
