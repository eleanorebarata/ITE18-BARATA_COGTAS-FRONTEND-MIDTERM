export function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

export function write(key: string, value: unknown) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
}

export const OVERRIDES_KEY = 'csu_mock_overrides'