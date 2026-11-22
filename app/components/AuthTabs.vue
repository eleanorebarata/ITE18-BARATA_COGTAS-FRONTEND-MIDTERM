<script setup lang="ts">
defineProps<{ tabs: { to: string; label: string }[] }>()
const route = useRoute()
</script>

<template>
  <nav class="segmented" aria-label="Account type">
    <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" :class="{ 'is-active': route.path === t.to }"
              :aria-current="route.path === t.to ? 'page' : undefined">{{ t.label }}</NuxtLink>
  </nav>
</template>