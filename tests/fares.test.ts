import { describe, expect, it } from 'vitest'
import { allPlaces, fareOptions } from '~/mocks/places'

describe('fare estimate', () => {
  const [a, b] = allPlaces()

  it('gives a fare for both transport types', () => {
    const fares = fareOptions(a!, b!)
    expect(fares.map(f => f.transport).sort()).toEqual(['Bao-bao', 'Tricycle'])
  })

  it('never goes below the starting fare, and max is not below min', () => {
    for (const f of fareOptions(a!, b!)) {
      expect(f.fareMin).toBeGreaterThanOrEqual(8)
      expect(f.fareMax).toBeGreaterThanOrEqual(f.fareMin)
    }
  })

  it('a longer trip does not cost less than a shorter one', () => {
    const near = fareOptions(allPlaces()[0]!, allPlaces()[1]!)[0]!
    const far = fareOptions(allPlaces()[0]!, allPlaces()[4]!)[0]!
    const dNear = Math.abs(allPlaces()[0]!.lat - allPlaces()[1]!.lat)
    const dFar = Math.abs(allPlaces()[0]!.lat - allPlaces()[4]!.lat)
    if (dFar >= dNear) expect(far.fareMin).toBeGreaterThanOrEqual(near.fareMin)
  })
})