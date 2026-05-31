import { updateDestinationFeatured } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { featured } = await request.json()
  await updateDestinationFeatured(id, !!featured)
  return Response.json({ ok: true })
}
