import { togglePackageFeatured } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { featured, order = 0 } = await request.json()
  try {
    await togglePackageFeatured(id, Boolean(featured), Number(order))
    await invalidatePackagesCache()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update featured status' }, { status: 500 })
  }
}
