import { fail } from './errors'
import { allUsers } from './drivers'
import { read, write, OVERRIDES_KEY } from './storage'

const AVATARS_KEY = 'csu_mock_avatars'
const avatars = () => read<Record<string, string>>(AVATARS_KEY, {})

function shape(userId: string) {
  const user = allUsers().find(u => u.id === userId)
  if (!user) throw fail(401, 'UNAUTHORIZED', 'Please log in.')
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    contact: user.contact ?? '',
    avatar: avatars()[userId] ?? null
  }
}

export function getProfile(userId: string) {
  return shape(userId)
}

export function updateProfile(userId: string, body: any) {
  shape(userId)

  const fields: Record<string, string> = {}
  const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ')
  const contact = String(body?.contact ?? '').trim()
  const avatar = body?.avatar

  if (name.length < 2) fields.name = 'Enter your full name'
  else if (name.length > 60) fields.name = 'Name is too long (60 characters at most)'
  if (contact && !/^09\d{9}$/.test(contact)) fields.contact = 'Use an 11-digit number starting with 09'
  if (avatar !== undefined && avatar !== null) {
    if (typeof avatar !== 'string' || !avatar.startsWith('data:image/') || avatar.length > 400_000) {
      fields.avatar = 'Choose a smaller picture'
    }
  }
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', 'Check the highlighted fields.', fields)

  const overrides = read<Record<string, Record<string, unknown>>>(OVERRIDES_KEY, {})
  overrides[userId] = { ...overrides[userId], name, contact }
  write(OVERRIDES_KEY, overrides)

  if (avatar !== undefined) {
    const all = avatars()
    if (avatar === null) delete all[userId]
    else all[userId] = avatar
    write(AVATARS_KEY, all)
  }

  return shape(userId)
}