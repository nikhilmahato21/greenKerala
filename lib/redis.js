import { Redis } from '@upstash/redis'

let _redis = null

export function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

const PACKAGES_KEY = 'nn:packages'
const TTL = 60 // seconds

export async function getCachedPackages() {
  try {
    return await getRedis().get(PACKAGES_KEY)
  } catch {
    return null
  }
}

export async function setCachedPackages(packages) {
  try {
    await getRedis().set(PACKAGES_KEY, JSON.stringify(packages), { ex: TTL })
  } catch {}
}

export async function invalidatePackagesCache() {
  try {
    await getRedis().del(PACKAGES_KEY)
  } catch {}
}
