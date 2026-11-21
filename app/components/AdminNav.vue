<script setup lang="ts">
const auth = useAuthStore()

function logout() {
  auth.logout()
  navigateTo('/auth/admin-login')
}
</script>

<template>
  <nav aria-label="Admin" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #d1d5db; margin-bottom: 16px">
    <NuxtLink to="/admin">Dashboard</NuxtLink>
    <NuxtLink to="/admin/users">Users and drivers</NuxtLink>
    <NuxtLink to="/admin/bookings">Bookings</NuxtLink>
    <NuxtLink to="/admin/reports">Reports</NuxtLink>
    <NuxtLink to="/admin/cancellations">Cancellations</NuxtLink>
    <span style="flex: 1" />
    <span>{{ auth.user?.name }}</span>
    <button style="min-height: 44px" @click="logout">Log out</button>
  </nav>
</template>