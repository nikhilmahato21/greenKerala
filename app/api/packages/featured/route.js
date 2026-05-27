import { getFeaturedPackages } from '@/lib/db'

export async function GET() {
  try {
    const packages = await getFeaturedPackages()
    return Response.json(packages)
  } catch {
    return Response.json({ error: 'Failed to fetch featured packages' }, { status: 500 })
  }
}
