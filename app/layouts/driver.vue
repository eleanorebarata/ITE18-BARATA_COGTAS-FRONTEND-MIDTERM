<script setup lang="ts">
const tabs = [
  { to: '/driver/requests', label: 'Requests', icon: 'inbox' },
  { to: '/routes', label: 'Fares', icon: 'tag' },
  { to: '/reports', label: 'Reports', icon: 'flag' }
]
</script>

<template>
  <AppShell :tabs="tabs" home="/driver/requests" login-to="/auth/driver-login"><slot /></AppShell>
</template>