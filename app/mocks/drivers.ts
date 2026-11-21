import { fail } from './errors'
import { mockUsers, type MockUser } from './users'
import { read, write, OVERRIDES_KEY } from './storage'
import { normalizePlate, isValidPlate } from '~/utils/plate'

const KEY = 'csu_mock_users'
const stored = () => read<MockUser[]>(KEY, [])

export function allUsers(): MockUser[] {
  const overrides = read<Record<string, Partial<MockUser>>>(OVERRIDES_KEY, {})
  return [...mockUsers, ...stored()].map(u => ({ ...u, ...overrides[u.id] }))
}

export function registerDriver(body: any) {
  const fields: Record<string, string> = {}
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const contact = String(body?.contact ?? '').trim()
  const plate = normalizePlate(String(body?.plateNumber ?? ''))
  const vehicleType = String(body?.vehicleType ?? '')
  const password = String(body?.password ?? '')

  if (name.length < 2) fields.name = 'Enter your full name'
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Enter a valid email'
  if (!/^09\d{9}$/.test(contact)) fields.contact = 'Use an 11-digit number starting with 09'
  if (!isValidPlate(plate)) fields.plateNumber = 'Use 5 to 10 letters, numbers, spaces, or dashes'
  if (vehicleType !== 'Tricycle' && vehicleType !== 'Bao-bao') fields.vehicleType = 'Choose a vehicle type'
  if (password.length < 8) fields.password = 'Password must be at least 8 characters'
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', 'Check the highlighted fields.', fields)

  const users = allUsers()
  if (users.some(u => u.email === email)) {
    throw fail(409, 'EMAIL_TAKEN', 'This email is already registered.', { email: 'This email is already registered' })
  }
  if (users.some(u => u.plateNumber && normalizePlate(u.plateNumber) === plate)) {
    throw fail(409, 'PLATE_TAKEN', 'This plate number is already registered.', { plateNumber: 'This plate number is already registered' })
  }

  const user: MockUser = {
    id: `d-${Date.now()}`,
    name,
    email,
    password,
    role: 'driver',
    status: 'active',
    contact,
    plateNumber: plate,
    vehicleType,
    plateVerified: false
  }
  write(KEY, [...stored(), user])
  return { message: 'Registration received. An administrator will check your plate number.' }
}

export function driverProfile(userId: string | null) {
  const user = allUsers().find(u => u.id === userId && u.role === 'driver')
  if (!user) throw fail(403, 'FORBIDDEN', 'Driver account required.')
  return {
    name: user.name,
    plateNumber: user.plateNumber ?? '',
    vehicleType: user.vehicleType ?? 'Tricycle',
    plateVerified: !!user.plateVerified
  }
}

// Testing helper, mock only.
export function devVerifyPlate(userId: string | null) {
  if (userId) {
    const overrides = read<Record<string, Partial<MockUser>>>(OVERRIDES_KEY, {})
    overrides[userId] = { ...overrides[userId], plateVerified: true }
    write(OVERRIDES_KEY, overrides)
  }
  return driverProfile(userId)
}