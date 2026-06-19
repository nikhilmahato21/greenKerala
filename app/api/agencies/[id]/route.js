import { getAgencyById, updateAgencyStatus, deleteAgency } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'
import { sendApprovalEmail } from '@/lib/email'

export async function GET(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const agency = await getAgencyById(Number(id))
    if (!agency) return Response.json({ error: 'Not found' }, { status: 404 })
    const { password: _, ...safe } = agency
    return Response.json(safe)
  } catch {
    return Response.json({ error: 'Failed to fetch agency' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { status } = await request.json()
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }
  try {
    await updateAgencyStatus(Number(id), status)
    if (status === 'approved') {
      const agency = await getAgencyById(Number(id))
      if (agency?.email) {
        // Await so the mail sends before the serverless function freezes; a mail
        // failure must not fail the status update, so log it and continue.
        try {
          await sendApprovalEmail(agency.email, agency.name)
        } catch (err) {
          console.error('Failed to send agency approval email:', err)
        }
      }
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update agency' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await deleteAgency(Number(id))
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to delete agency' }, { status: 500 })
  }
}
