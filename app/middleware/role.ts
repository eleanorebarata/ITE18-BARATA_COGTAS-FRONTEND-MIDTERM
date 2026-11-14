export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const required = to.meta.role as string | undefined
  if (required && auth.role !== required) return navigateTo(homeFor(auth.role))
})