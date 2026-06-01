import { createEnquiry, getEnquiries } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'
import { sendEnquiryEmail } from '@/lib/email'

export async function GET() {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const enquiries = await getEnquiries()
    return Response.json(enquiries)
  } catch {
    return Response.json({ error: 'Failed to fetch enquiries' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { package_id, package_title, name, phone, email, message } = await request.json()
    if (!name?.trim() || !phone?.trim()) {
      return Response.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    const enquiry = await createEnquiry({
      package_id, package_title,
      name: name.trim(), phone: phone.trim(),
      email: email?.trim() || null,
      message: message?.trim() || null,
    })
    sendEnquiryEmail({ name: name.trim(), phone: phone.trim(), email: email?.trim(), message: message?.trim(), package_title }).catch(() => {})
    return Response.json(enquiry, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to submit enquiry' }, { status: 500 })
  }
}
