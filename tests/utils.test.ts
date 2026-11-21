import { describe, it, expect } from 'vitest'
import { cancelState, formatCountdown } from '../app/utils/cancelPolicy'
import { isValidPlate, normalizePlate } from '../app/utils/plate'
import { distanceKm } from '../app/utils/tracking'

describe('cancelState', () => {
  it('allows pending, windows accepted, locks late, blocks finished', () => {
    expect(cancelState('Pending', null)).toBe('open')
    expect(cancelState('Accepted', 5 * 60_000)).toBe('window')
    expect(cancelState('Accepted', 0)).toBe('locked')
    expect(cancelState('Completed', null)).toBe('none')
  })
})

describe('formatCountdown', () => {
  it('formats minutes and seconds', () => {
    expect(formatCountdown(18 * 60_000 + 5_000)).toBe('18:05')
    expect(formatCountdown(-5)).toBe('0:00')
  })
})

describe('plate', () => {
  it('normalizes and validates', () => {
    expect(normalizePlate('  abc   1234 ')).toBe('ABC 1234')
    expect(isValidPlate('ABC 1234')).toBe(true)
    expect(isValidPlate('A')).toBe(false)
  })
})

describe('distanceKm', () => {
  it('is zero for the same point and positive otherwise', () => {
    const a = { lat: 8.9552, lng: 125.5975 }
    expect(distanceKm(a, a)).toBe(0)
    expect(distanceKm(a, { lat: 8.956, lng: 125.599 })).toBeGreaterThan(0)
  })
})