import { setPackageHiddenByAgency } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAgency } from '@/lib/guardAgency'

export async function PUT(request, { params }) {
  const payload = await guardAgency()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const { hidden } = await request.json()
    const updated = await setPackageHiddenByAgency(id, Boolean(hidden), payload.agencyId)
    if (!updated) return Response.json({ error: 'Package not found or not yours' }, { status: 403 })
    await invalidatePackagesCache()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update visibility' }, { status: 500 })
  }
}
