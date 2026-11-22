<script setup lang="ts">
const tabs = [
  { to: '/user/home', label: 'Home', icon: 'home' },
  { to: '/user/places', label: 'Places', icon: 'pin' },
  { to: '/user/bookings', label: 'Booking', icon: 'calendar', also: ['/user/book', '/user/drivers'] },
  { to: '/user/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/user/account', label: 'Account', icon: 'user', also: ['/reports', '/routes'] }
]
</script>

<template>
  <AppShell :tabs="tabs" home="/user/home" login-to="/auth/user-login" minimal><slot /></AppShell>
</template>