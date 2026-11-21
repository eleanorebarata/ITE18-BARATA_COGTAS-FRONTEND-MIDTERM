<script setup lang="ts">
const props = defineProps<{ value: number }>()
const full = computed(() => Math.min(5, Math.max(0, Math.round(props.value))))
</script>

<template>
  <span role="img" :aria-label="`Rated ${value} out of 5`" style="color: #8a6d00; letter-spacing: 2px">
    <span aria-hidden="true">{{ '★'.repeat(full) }}{{ '☆'.repeat(5 - full) }}</span>
  </span>
</template>