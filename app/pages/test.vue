<script setup lang="ts">
import { useBookingService } from '~/services/bookings'
const { data, error } = await useAsyncData('b', () => useBookingService().get('b-1'))
</script>

<template>
  <pre>{{ data }} {{ error }}</pre>
</template>