<script setup lang="ts">
const tabs = [
  { to: '/user/book', label: 'Book', icon: 'pin' },
  { to: '/user/bookings', label: 'Bookings', icon: 'list' },
  { to: '/routes', label: 'Fares', icon: 'tag' },
  { to: '/reports', label: 'Reports', icon: 'flag' }
]
</script>

<template>
  <AppShell :tabs="tabs" home="/user/bookings" login-to="/auth/user-login"><slot /></AppShell>
</template>