<script setup lang="ts">
const route = useRoute()
// Only the public fares page uses the light background now.
const light = computed(() => route.path === '/routes')
</script>

<template>
  <div class="auth-shell" :class="{ 'is-light': light }">
    <div class="auth-card"><slot /></div>
  </div>
</template>