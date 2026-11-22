import type { FareOption, FareRule, Place } from '~/types/api'
import { read, write } from './storage'

const PLACES_KEY = 'csu_mock_places'
const RULES_KEY = 'csu_mock_fare_rules'

const seedPlaces: Place[] = [
  { id: 'p-gate', name: 'CSU Main Gate', description: 'Main entrance of the campus.', address: 'CSU Main Campus, Ampayon, Butuan City', lat: 8.9552, lng: 125.5975, active: true },
  { id: 'p-ccis', name: 'CCIS Building', description: 'Covered waiting area near the computing college.', address: 'CCIS Complex, CSU Main Campus', lat: 8.956, lng: 125.599, active: true },
  { id: 'p-library', name: 'University Library', description: 'Pickup bay beside the library entrance.', address: 'University Library, CSU Main Campus', lat: 8.9565, lng: 125.5983, active: true },
  { id: 'p-canteen', name: 'Campus Canteen', description: 'Drop-off point near the campus canteen.', address: 'Campus Canteen, CSU Main Campus', lat: 8.9558, lng: 125.598, active: true },
  { id: 'p-terminal', name: 'Ampayon Terminal', description: 'Public transport stop near the terminal.', address: 'Ampayon, Butuan City', lat: 8.954, lng: 125.596, active: true }
]

// Sample numbers. Replace with the real fare table from the campus transport office.
const seedRules: FareRule[] = [
  { transport: 'Tricycle', baseFare: 10, perKm: 8, range: 5 },
  { transport: 'Bao-bao', baseFare: 8, perKm: 8, range: 3 }
]

export const allPlaces = () => read<Place[]>(PLACES_KEY, seedPlaces)
export const activePlaces = () => allPlaces().filter(p => p.active !== false)
export const savePlaces = (list: Place[]) => write(PLACES_KEY, list)

export const fareRules = () => read<FareRule[]>(RULES_KEY, seedRules)
export const saveFareRules = (list: FareRule[]) => write(RULES_KEY, list)

function km(a: Place, b: Place) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function fareOptions(from: Place, to: Place): FareOption[] {
  const d = km(from, to)
  const minutes = Math.max(3, Math.round(3 + d * 4))
  return fareRules().map((r) => {
    const fare = Math.max(r.baseFare, Math.round(r.baseFare + d * r.perKm))
    return {
      transport: r.transport,
      fareMin: fare,
      fareMax: fare + r.range,
      minutes: r.transport === 'Bao-bao' ? minutes + 2 : minutes
    }
  })
}