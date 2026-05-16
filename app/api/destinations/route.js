import { getDestinations, createDestination } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'

export async function GET() {
  try {
    const destinations = await getDestinations()
    return Response.json(destinations)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch destinations' }, { status: 500 })
  }
}

export async function POST(request) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { name, color } = await request.json()
    if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })
    const dest = await createDestination(name.trim(), color || '#e8520a')
    return Response.json(dest, { status: 201 })
  } catch (err) {
    if (err.message?.includes('unique')) {
      return Response.json({ error: 'Destination already exists' }, { status: 409 })
    }
    return Response.json({ error: 'Failed to create destination' }, { status: 500 })
  }
}
