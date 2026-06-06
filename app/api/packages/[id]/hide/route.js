import { setPackageHidden } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const { hidden } = await request.json()
    await setPackageHidden(id, Boolean(hidden))
    await invalidatePackagesCache()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update visibility' }, { status: 500 })
  }
}
