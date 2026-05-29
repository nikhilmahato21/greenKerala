'use client'
import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function TagSelector({
  type,
  selected = [],
  onChange,
  options = [],
  onOptionsUpdate,
  color = '#e8520a',
  placeholder,
}) {
  const [newVal, setNewVal] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])

  const handleAdd = async () => {
    const val = newVal.trim()
    if (!val || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/package-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: val }),
      })
      if (res.ok) {
        const updated = await res.json()
        if (onOptionsUpdate) onOptionsUpdate(updated)
        if (!selected.includes(val)) onChange([...selected, val])
        setNewVal('')
      }
    } catch {}
    setAdding(false)
  }

  const unselected = options.filter(o => !selected.includes(o))
  const visible = showAll ? unselected : unselected.slice(0, 10)

  return (
    <div>
      <style>{`@keyframes ts-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
          background: color + '14', borderRadius: 10, border: `1px solid ${color}28`,
          marginBottom: 8,
        }}>
          {selected.map(v => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              borderRadius: 999, background: color, color: '#fff', fontSize: 12, fontWeight: 600,
            }}>
              {v}
              <button
                onClick={() => toggle(v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', display: 'flex', padding: 0 }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestion chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {visible.map(v => (
          <button
            key={v}
            onClick={() => toggle(v)}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 12,
              border: '1px solid #e5e7eb', background: '#fff', color: '#555', cursor: 'pointer',
              transition: 'border-color 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#555' }}
          >
            + {v}
          </button>
        ))}
        {!showAll && unselected.length > 10 && (
          <button
            onClick={() => setShowAll(true)}
            style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: '1px dashed #d1d5db', background: '#f9fafb', color: '#9ca3af', cursor: 'pointer' }}
          >
            +{unselected.length - 10} more
          </button>
        )}
        {showAll && unselected.length > 0 && (
          <button
            onClick={() => setShowAll(false)}
            style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: '1px dashed #d1d5db', background: '#f9fafb', color: '#9ca3af', cursor: 'pointer' }}
          >
            Show less
          </button>
        )}
      </div>

      {/* Custom add */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder || `Type to add custom ${type}...`}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 8,
            border: '1.5px solid #e5e7eb', fontSize: 12, color: '#111',
            background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newVal.trim()}
          style={{
            padding: '7px 12px', borderRadius: 8, border: 'none',
            background: color, color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: adding || !newVal.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            opacity: adding || !newVal.trim() ? 0.5 : 1, flexShrink: 0,
          }}
        >
          {adding
            ? <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ts-spin 1s linear infinite', display: 'inline-block' }} />
            : <Plus size={11} />}
          Add
        </button>
      </div>
    </div>
  )
}
