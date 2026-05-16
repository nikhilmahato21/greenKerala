import { updatePackage, deletePackage } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const data = await request.json()
    const updated = await updatePackage(id, data)
    await invalidatePackagesCache()
    return Response.json(updated)
  } catch (err) {
    return Response.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    await deletePackage(id)
    await invalidatePackagesCache()
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
