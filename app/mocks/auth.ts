import { fail } from './errors'
import { allUsers } from './drivers'
import { mockUsers } from './users'

export function doLogin(body: any, role: 'passenger' | 'driver' | 'admin') {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  const fields: Record<string, string> = {}
  if (!email) {
    fields.email = 'Email is required'
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    fields.email = 'Enter a valid email'
  }
  if (password.length < 8) fields.password = 'Password must be at least 8 characters'
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', 'Check the highlighted fields.', fields)

  const user = allUsers().find(u => u.email === email && u.password === password && u.role === role)
  if (!user) throw fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password.')
  if (user.status === 'deactivated') {
    throw fail(403, 'ACCOUNT_DEACTIVATED', 'This account has been deactivated. Please contact the administrator.')
  }

  return {
    token: `mock-${user.id}`,
    role: user.role,
    status: user.status,
    suspendedUntil: user.suspendedUntil ?? null,
    user: { id: user.id, name: user.name, email: user.email }
  }
}