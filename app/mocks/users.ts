export interface MockUser {
  id: string
  name: string
  email: string
  password: string
  role: 'passenger' | 'driver' | 'admin'
  status: 'active' | 'suspended' | 'deactivated'
  suspendedUntil?: string
  contact?: string
  plateNumber?: string
  vehicleType?: string
  plateVerified?: boolean
}

export const mockUsers: MockUser[] = [
  { id: 'u-1', name: 'Test Student', email: 'student@test.com', password: 'password123', role: 'passenger', status: 'active' },
  { id: 'u-2', name: 'Suspended Student', email: 'suspended@test.com', password: 'password123', role: 'passenger', status: 'suspended', suspendedUntil: '2026-12-01T00:00:00.000Z' },
  { id: 'u-3', name: 'Closed Student', email: 'deactivated@test.com', password: 'password123', role: 'passenger', status: 'deactivated' },
  { id: 'd-1', name: 'Test Driver', email: 'driver@test.com', password: 'password123', role: 'driver', status: 'active', plateNumber: 'ABC 1234', vehicleType: 'Tricycle', plateVerified: true },
  { id: 'a-1', name: 'Test Admin', email: 'admin@carsu.edu.ph', password: 'password123', role: 'admin', status: 'active' }
]