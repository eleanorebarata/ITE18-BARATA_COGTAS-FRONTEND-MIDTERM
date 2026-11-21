import type { LatLng } from '~/types/api'

export const SHARE_EVERY_MS = 5000
export const POLL_EVERY_MS = 3000
export const STALE_AFTER_MS = 30_000

export function distanceKm(a: LatLng, b: LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

// Age is measured with the server's clock, never the phone's.
export function ageSeconds(updatedAt: string, serverNow: string) {
  return Math.max(0, Math.round((new Date(serverNow).getTime() - new Date(updatedAt).getTime()) / 1000))
}