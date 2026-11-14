export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.isLoggedIn) {
    if (to.path.startsWith('/driver')) return navigateTo('/auth/driver-login')
    if (to.path.startsWith('/admin')) return navigateTo('/auth/admin-login')
    return navigateTo('/auth/user-login')
  }

  if (auth.status === 'suspended' && to.path !== '/account/suspended') {
    return navigateTo('/account/suspended')
  }
})