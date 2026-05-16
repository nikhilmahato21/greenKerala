import { deleteDestination } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'

export async function DELETE(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await deleteDestination(id)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: 'Failed to delete destination' }, { status: 500 })
  }
}
