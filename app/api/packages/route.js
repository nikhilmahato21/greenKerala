import { getAllPackages, insertPackage } from '@/lib/db'
import { getCachedPackages, setCachedPackages, invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function GET() {
  try {
    const cached = await getCachedPackages()
    if (cached) {
      const packages = typeof cached === 'string' ? JSON.parse(cached) : cached
      return Response.json(packages)
    }

    const packages = await getAllPackages()
    await setCachedPackages(packages)
    return Response.json(packages)
  } catch {
    return Response.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request) {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pkg = await request.json()
    const created = await insertPackage(pkg)
    await invalidatePackagesCache()
    return Response.json(created, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
