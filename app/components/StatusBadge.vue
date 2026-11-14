<script setup lang="ts">
import type { BookingStatus } from '~/types/api'

defineProps<{ status: BookingStatus }>()

const styles: Record<BookingStatus, { bg: string; fg: string }> = {
  Pending: { bg: '#fdf3cc', fg: '#1f2937' },
  Accepted: { bg: '#e6f2ea', fg: '#14522c' },
  Declined: { bg: '#f8e6e6', fg: '#8a1c1c' },
  Completed: { bg: '#eef2f7', fg: '#1f2937' },
  Cancelled: { bg: '#f8e6e6', fg: '#8a1c1c' }
}
</script>

<template>
  <span :style="{ background: styles[status].bg, color: styles[status].fg, padding: '2px 10px', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }">
    {{ status }}
  </span>
</template>