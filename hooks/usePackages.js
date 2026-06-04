'use client'
import { useState, useEffect, useCallback } from 'react'

export function usePackages() {
  const [packages, setPackages] = useState([])
  const [loaded, setLoaded] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(data)
      }
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const add = async (pkg) => {
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    })
    if (!res.ok) throw new Error('Failed to add package')
    await fetchPackages()
  }

  const update = async (id, data) => {
    const res = await fetch(`/api/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update package')
    await fetchPackages()
  }

  const remove = async (id) => {
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete package')
    await fetchPackages()
  }

  const reset = async () => {
    const res = await fetch('/api/packages/reset', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to reset packages')
    await fetchPackages()
  }

  return { packages, add, update, remove, reset, loaded, refresh: fetchPackages }
}
