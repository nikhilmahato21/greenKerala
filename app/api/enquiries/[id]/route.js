import { deleteEnquiry } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'

export async function DELETE(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await deleteEnquiry(id)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to delete enquiry' }, { status: 500 })
  }
}
