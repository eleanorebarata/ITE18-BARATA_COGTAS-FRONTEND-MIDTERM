import { describe, expect, it } from 'vitest'
import { ageSeconds, distanceKm, formatDistance } from '~/utils/tracking'

describe('tracking helpers', () => {
  it('distance between the same point is zero', () => {
    expect(distanceKm({ lat: 8.9552, lng: 125.5975 }, { lat: 8.9552, lng: 125.5975 })).toBe(0)
  })

  it('distance is about 111 km per degree of latitude', () => {
    const d = distanceKm({ lat: 8, lng: 125 }, { lat: 9, lng: 125 })
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(112)
  })

  it('formats short distances in metres and long ones in km', () => {
    expect(formatDistance(0.45)).toBe('450 m')
    expect(formatDistance(2.34)).toBe('2.3 km')
  })

  it('age uses the server clock', () => {
    expect(ageSeconds('2026-11-21T10:00:00.000Z', '2026-11-21T10:00:45.000Z')).toBe(45)
    expect(ageSeconds('2026-11-21T10:01:00.000Z', '2026-11-21T10:00:00.000Z')).toBe(0)
  })
})