export function normalizePlate(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

// 5 to 10 characters: letters, numbers, spaces, or dashes.
// Tricycles often use a franchise or body number, so confirm the exact
// format with your adviser or the campus transport office.
export function isValidPlate(value: string) {
  return /^[A-Z0-9][A-Z0-9 -]{3,8}[A-Z0-9]$/.test(value)
}