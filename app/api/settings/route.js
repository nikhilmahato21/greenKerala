import { getSettings, setSetting } from '@/lib/db'
import { guardAdmin } from '@/lib/guardAdmin'

export async function GET() {
  try {
    const settings = await getSettings()
    return Response.json(settings)
  } catch {
    return Response.json({}, { status: 500 })
  }
}

export async function PUT(request) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') await setSetting(key, value)
    }
    return Response.json(await getSettings())
  } catch {
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
