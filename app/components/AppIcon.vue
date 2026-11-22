<script setup lang="ts">
defineProps<{ name: string; size?: number }>()

const paths: Record<string, string[]> = {
  pin: ['M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z', 'M12 7a3 3 0 100 6 3 3 0 000-6z'],
  list: ['M9 6h11M9 12h11M9 18h11', 'M4 6h.01M4 12h.01M4 18h.01'],
  tag: ['M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z', 'M7.5 7.5h.01'],
  flag: ['M4 22V4', 'M4 4h13l-2 4 2 4H4'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.5 5h13L22 12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z'],
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  users: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 3a4 4 0 100 8 4 4 0 000-8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4M8 2v4M3 10h18'],
  ban: ['M12 2a10 10 0 100 20 10 10 0 000-20z', 'M4.9 4.9l14.2 14.2'],
  logout: ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  home: ['M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z'],
  bell: ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
  user: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 3a4 4 0 100 8 4 4 0 000-8z'],
  chevron: ['M9 18l6-6-6-6'],
  check: ['M20 6L9 17l-5-5'],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  close: ['M18 6L6 18M6 6l12 12']
}
</script>

<template>
  <svg :width="size ?? 22" :height="size ?? 22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(d, i) in paths[name] ?? []" :key="i" :d="d" />
  </svg>
</template>