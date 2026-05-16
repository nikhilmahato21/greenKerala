import { resetPackages } from '@/lib/db'
import { invalidatePackagesCache } from '@/lib/redis'
import { guardAdmin } from '@/lib/guardAdmin'

export async function POST() {
  if (!(await guardAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const packages = await resetPackages()
    await invalidatePackagesCache()
    return Response.json(packages)
  } catch (err) {
    return Response.json({ error: 'Failed to reset packages' }, { status: 500 })
  }
}
