<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const title = ref('')

useHead({
  htmlAttrs: { lang: 'en' },
  title: () => title.value,
  titleTemplate: t => (t ? `${t} | CSU Mobility` : 'CSU Mobility')
})

const layoutName = computed(() => {
  const p = route.path
  if (p.startsWith('/admin')) return 'admin'
  if (p.startsWith('/driver')) return 'driver'
  const signedIn = auth.isLoggedIn && auth.status !== 'suspended'
  if (signedIn && (p.startsWith('/user') || p === '/reports' || p === '/routes')) {
    if (auth.role === 'driver') return 'driver'
    if (auth.role === 'admin') return 'admin'
    return 'passenger'
  }
  return 'auth'
})

// After every page change: use the page heading as the tab title and give <main> an id for the skip link.
if (import.meta.client) {
  router.afterEach(() => {
    setTimeout(() => {
      const main = document.querySelector('main')
      if (main) {
        main.id = 'main'
        main.setAttribute('tabindex', '-1')
      }
      title.value = document.querySelector('h1')?.textContent?.trim() ?? ''
    }, 350)
  })
}
</script>

<template>
  <a href="#main" class="skip-link">Skip to main content</a>
  <NuxtRouteAnnouncer />
  <NuxtLayout :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
</template>