import { describe, expect, it } from 'vitest'
import { isValidPlate, normalizePlate } from '~/utils/plate'

describe('plate number', () => {
  it('trims, collapses spaces and uppercases', () => {
    expect(normalizePlate('  abc   1234 ')).toBe('ABC 1234')
  })

  it('accepts normal plates', () => {
    expect(isValidPlate('ABC 1234')).toBe(true)
    expect(isValidPlate('TRI-0042')).toBe(true)
  })

  it('rejects too short, too long, or bad characters', () => {
    expect(isValidPlate('AB1')).toBe(false)
    expect(isValidPlate('ABCDEFGHIJK')).toBe(false)
    expect(isValidPlate('AB@#1234')).toBe(false)
  })
})