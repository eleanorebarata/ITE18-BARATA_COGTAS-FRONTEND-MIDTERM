<script setup lang="ts">
import { useReportService } from '~/services/reports'

definePageMeta({ middleware: ['auth'] })

const auth = useAuthStore()
const service = useReportService()
const { data, pending, error } = await useAsyncData('my-reports', () => service.mine(), { server: false })

const back = computed(() => (auth.role === 'driver' ? '/driver/requests' : '/user/bookings'))
const what: Record<string, string> = { driver: 'a driver', passenger: 'a passenger', review: 'a review' }
const when = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <NuxtLink :to="back">&larr; Back</NuxtLink>
    <h1>My reports</h1>
    <p>An administrator reviews every report. The status shows where yours stands.</p>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error" role="alert" style="color: #8a1c1c">{{ toApiError(error).message }}</p>
    <p v-else-if="!data?.length">You have not sent any reports.</p>

    <ul v-else style="list-style: none; padding: 0">
      <li v-for="r in data" :key="r.id" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px">
        <strong>{{ r.status }}</strong>
        <p style="margin: 4px 0 0">About {{ what[r.targetType] }}: {{ r.categoryLabel }}</p>
        <small>Sent {{ when(r.createdAt) }}</small>
      </li>
    </ul>
  </main>
</template>