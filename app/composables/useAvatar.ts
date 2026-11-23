// The signed-in user's profile photo, shared by the top bar and the Account page.
export function useAvatar() {
  return useState<string | null>('avatar', () => null)
}