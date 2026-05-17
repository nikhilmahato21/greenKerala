'use client'
import Link from 'next/link'
import { Phone, Clock, MapPin, Tag } from 'lucide-react'

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}
function savings(orig, sale) {
  return formatPrice(orig - sale)
}

export default function PackageCard({ pkg, phone = '918062179246' }) {
  const save = savings(pkg.originalPrice, pkg.salePrice)

  return (
    <Link href={`/packages/${pkg.id}`} className="block" style={{ textDecoration: 'none' }}>
      <div
        className="h-full flex flex-col transition-all duration-300"
        style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img
            src={pkg.image}
            alt={pkg.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=700&q=80' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: pkg.badgeColor + 'dd', color: '#fff', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(8px)' }}>
              <MapPin size={9} /> {pkg.destination}
            </span>
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: '#555', fontSize: 11, fontWeight: 500, backdropFilter: 'blur(8px)' }}>
              {pkg.badge}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>
            <Clock size={12} />
            <span>{pkg.duration}</span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>{pkg.title}</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{pkg.subtitle}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f5f0e8', borderRadius: 999, fontSize: 11, color: '#6b7280', marginBottom: 16, width: 'fit-content' }}>
            <Tag size={10} />
            {pkg.hotels}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(pkg.originalPrice)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 999 }}>SAVE {save}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{formatPrice(pkg.salePrice)}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>/{pkg.priceNote}</span>
              </div>
            </div>
            <a
              href={`tel:+${phone}`}
              onClick={e => e.stopPropagation()}
              style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0 }}
            >
              <Phone size={16} />
            </a>
          </div>

          <button style={{ marginTop: 14, width: '100%', padding: '12px 0', borderRadius: 999, fontWeight: 600, fontSize: 14, color: '#fff', background: 'linear-gradient(135deg, #e8520a, #c93d00)', border: 'none', cursor: 'pointer' }}>
            View Details
          </button>
        </div>
      </div>
    </Link>
  )
}
