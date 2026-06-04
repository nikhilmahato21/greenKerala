'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react'
import { usePhone, useWhatsapp, useEmail, useEmail2 } from '@/hooks/useSettings'

function IgIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
}
function FbIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
}

export default function Footer() {
  const phone = usePhone()
  const whatsapp = useWhatsapp()
  const email = useEmail()
  const email2 = useEmail2()
  const [footerDests, setFooterDests] = useState([])

  useEffect(() => {
    fetch('/api/destinations')
      .then(r => r.ok ? r.json() : [])
      .then(dests => setFooterDests(dests.filter(d => d.featured !== false)))
      .catch(() => {})
  }, [])

  return (
    <footer style={{ background: '#0f1020' }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-14 h-14 shrink-0 overflow-hidden">
                <Image src="https://res.cloudinary.com/dynbpb9u0/image/upload/v1779855779/WhatsApp_Image_2026-05-22_at_15.06.01-removebg-preview_mr6pdc.png" alt="Green Kerala Trips" width={56} height={56} className="w-full h-full object-contain" />
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: '#fff' }}>
                Green Kerala<br /><span style={{ color: '#e8520a' }}>Trips</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color:'rgba(255,255,255,0.5)' }}>Curated travel experiences with day-wise itineraries and personal support.</p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.1)' }}><IgIcon/></a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.1)' }}><FbIcon/></a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.1)' }}><MessageCircle size={16}/></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm tracking-wider uppercase mb-4" style={{ color:'rgba(255,255,255,0.9)' }}>Destinations</h4>
            <ul className="space-y-2 text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
              {footerDests.map(d => (
                <li key={d.id}><Link href="/#packages" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors"><MapPin size={11}/>{d.emoji ? `${d.emoji} ` : ''}{d.name}</Link></li>
              ))}
              {footerDests.length === 0 && (
                <>
                  <li><Link href="/#packages" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors"><MapPin size={11}/>Munnar</Link></li>
                  <li><Link href="/#packages" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors"><MapPin size={11}/>Alleppey</Link></li>
                  <li><Link href="/#packages" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors"><MapPin size={11}/>Wayanad</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm tracking-wider uppercase mb-4" style={{ color:'rgba(255,255,255,0.9)' }}>Quick Links</h4>
            <ul className="space-y-2 text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
              {[['Home','/'],['Packages','/#packages'],['About','/#about'],['Contact','/#contact']].map(([l,h]) => (
                <li key={l}><Link href={h} className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm tracking-wider uppercase mb-4" style={{ color:'rgba(255,255,255,0.9)' }}>Contact</h4>
            <ul className="space-y-3 text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
              <li><a href={`tel:+${phone}`} className="flex items-center gap-2 hover:text-orange-400 transition-colors"><Phone size={14}/> +{phone}</a></li>
              {email && <li><a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-orange-400 transition-colors"><Mail size={14}/> {email}</a></li>}
              {email2 && <li><a href={`mailto:${email2}`} className="flex items-center gap-2 hover:text-orange-400 transition-colors"><Mail size={14}/> {email2}</a></li>}
              <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors"><MessageCircle size={14}/> WhatsApp Us</a></li>
              <li><span className="flex items-center gap-2"><MapPin size={14}/> Kerala, Alappuzha</span></li>
            </ul>
          </div>
        </div>

        <div className="h-px mb-6" style={{ background:'rgba(255,255,255,0.1)' }} />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>
          <p>© {new Date().getFullYear()} Green Kerala Trips. All rights reserved.</p>
          <p>Made with ❤️ for wanderers</p>
        </div>
      </div>
    </footer>
  )
}
