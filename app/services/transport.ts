import type { FareOption, FareRule, Place } from '~/types/api'

export function useTransportService() {
  const api = useApi()
  return {
    places: () => api<Place[]>('/places'),
    rules: () => api<FareRule[]>('/fare-rules'),
    fares: (from: string, to: string) => api<FareOption[]>('/fares', { query: { from, to } })
  }
}