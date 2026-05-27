import { getAgencyPackages, insertPackageByAgency } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAgency } from '@/lib/guardAgency'

export async function GET() {
  const payload = await guardAgency()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const packages = await getAgencyPackages(payload.agencyId)
    return Response.json(packages)
  } catch {
    return Response.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request) {
  const payload = await guardAgency()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pkg = await request.json()
    if (!pkg.title?.trim()) return Response.json({ error: 'Title is required' }, { status: 400 })
    if (!pkg.salePrice) return Response.json({ error: 'Sale price is required' }, { status: 400 })
    const created = await insertPackageByAgency(pkg, payload.agencyId)
    await invalidatePackagesCache()
    return Response.json(created, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
