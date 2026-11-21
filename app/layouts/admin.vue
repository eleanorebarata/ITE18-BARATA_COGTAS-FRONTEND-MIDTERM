<script setup lang="ts">
const tabs = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/admin/reports', label: 'Reports', icon: 'flag' },
  { to: '/admin/cancellations', label: 'Cancels', icon: 'ban' },
  { to: '/admin/transport', label: 'Fares', icon: 'tag' }
]
</script>

<template>
  <AppShell :tabs="tabs" home="/admin" login-to="/auth/admin-login"><slot /></AppShell>
</template>