<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const auth = useAuthStore()

if (auth.status !== 'suspended') await navigateTo(homeFor(auth.role))

const until = computed(() =>
  auth.suspendedUntil
    ? new Date(auth.suspendedUntil).toLocaleDateString('en-PH', { dateStyle: 'long' })
    : 'further notice'
)

function logout() {
  auth.logout()
  navigateTo('/auth/user-login')
}
</script>

<template>
  <main style="max-width: 480px; margin: 48px auto; padding: 0 16px">
    <h1>Your account is suspended</h1>
    <p>You cannot book rides until <strong>{{ until }}</strong>.</p>
    <p>Suspensions happen after repeated cancellations without a valid reason. If you think this is a mistake, contact the administrator.</p>
    <button @click="logout">Log out</button>
  </main>
</template>