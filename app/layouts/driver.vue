<script setup lang="ts">
const tabs = [
  { to: '/driver/requests', label: 'Requests', icon: 'inbox' },
  { to: '/driver/account', label: 'Account', icon: 'user', also: ['/reports', '/routes'] }
]
</script>

<template>
  <AppShell :tabs="tabs" home="/driver/requests" login-to="/auth/driver-login" minimal><slot /></AppShell>
</template>