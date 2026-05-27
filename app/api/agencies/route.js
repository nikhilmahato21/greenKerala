import { getAllAgencies, createAgency } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { guardAdmin } from '@/lib/guardAdmin'

export async function GET() {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const agencies = await getAllAgencies()
    return Response.json(agencies)
  } catch {
    return Response.json({ error: 'Failed to fetch agencies' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, email, phone, description, website, password } = await request.json()
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
      return Response.json({ error: 'Name, email, phone and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const hashedPassword = await hashPassword(password)
    const agency = await createAgency({ name, email, phone, description, website, hashedPassword })
    return Response.json({ id: agency.id, name: agency.name, status: agency.status }, { status: 201 })
  } catch (err) {
    if (err.code === '23505') {
      return Response.json({ error: 'An agency with this email already exists' }, { status: 409 })
    }
    return Response.json({ error: 'Failed to register agency' }, { status: 500 })
  }
}
