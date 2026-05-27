import { updatePackageStatus } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { status } = await request.json()
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }
  try {
    await updatePackageStatus(id, status)
    await invalidatePackagesCache()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
