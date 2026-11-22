import { describe, expect, it } from 'vitest'
import { registerDriver, registerPassenger } from '~/mocks/drivers'

function caught(fn: () => unknown): any {
  try {
    fn()
  } catch (e) {
    return e
  }
  return null
}

describe('registration validation', () => {
  it('passenger: empty form is rejected with field errors', () => {
    const err = caught(() => registerPassenger({}))
    expect(err.statusCode).toBe(422)
    expect(Object.keys(err.data.fields)).toEqual(['name', 'email', 'contact', 'password'])
  })

  it('passenger: an email already used by a test account is rejected', () => {
    const err = caught(() =>
      registerPassenger({ name: 'Ana Cruz', email: 'student@test.com', contact: '09123456789', password: 'password123' })
    )
    expect(err.data.code).toBe('EMAIL_TAKEN')
  })

  it('driver: a bad plate number is rejected', () => {
    const err = caught(() =>
      registerDriver({
        name: 'Juan Dela Cruz', email: 'juan@test.com', contact: '09123456789',
        plateNumber: '@@', vehicleType: 'Tricycle', password: 'password123'
      })
    )
    expect(err.data.fields.plateNumber).toBeTruthy()
  })

  it('driver: the plate of the test driver is already taken', () => {
    const err = caught(() =>
      registerDriver({
        name: 'Juan Dela Cruz', email: 'juan@test.com', contact: '09123456789',
        plateNumber: 'abc 1234', vehicleType: 'Tricycle', password: 'password123'
      })
    )
    expect(err.data.code).toBe('PLATE_TAKEN')
  })
})