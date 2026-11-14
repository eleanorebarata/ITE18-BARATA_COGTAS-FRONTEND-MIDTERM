export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const minutesAgo = id === 'b-late' ? 45 : 10
  const now = Date.now()
  const acceptedAt = now - minutesAgo * 60_000
  return {
    id,
    status: 'Accepted',
    pickup: 'CSU Main Gate',
    destination: 'CCIS Building',
    passengers: 2,
    pickupAt: new Date(now + 3_600_000).toISOString(),
    acceptedAt: new Date(acceptedAt).toISOString(),
    cancelableUntil: new Date(acceptedAt + 30 * 60_000).toISOString(),
    serverNow: new Date(now).toISOString(),
    driver: { id: 'd-1', name: 'Juan D.', plateNumber: 'ABC 1234', vehicleType: 'Tricycle' }
  }
})