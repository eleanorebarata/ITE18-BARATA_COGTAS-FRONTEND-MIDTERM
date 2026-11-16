<script setup lang="ts">
import type { Booking } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const bookings = ref<Booking[]>([])
const loading = ref(true)
const loadError = ref('')
const status = ref('')

async function load() {
  loading.value = true
  try {
    bookings.value = await service.bookings(status.value ? { status: status.value } : {})
    loadError.value = ''
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(status, load)

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main style="max-width: 1000px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Bookings</h1>

    <label>Status
      <select v-model="status" style="display: block; min-height: 44px; margin-bottom: 16px">
        <option value="">All</option>
        <option>Pending</option>
        <option>Accepted</option>
        <option>Declined</option>
        <option>Completed</option>
        <option>Cancelled</option>
      </select>
    </label>

    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>
    <p v-else-if="!bookings.length">No bookings match this filter.</p>

    <div v-else style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; min-width: 720px">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #d1d5db">
            <th scope="col" style="padding: 8px">Status</th>
            <th scope="col" style="padding: 8px">Route</th>
            <th scope="col" style="padding: 8px">Pickup time</th>
            <th scope="col" style="padding: 8px">Passengers</th>
            <th scope="col" style="padding: 8px">Driver</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id" style="border-bottom: 1px solid #e5e7eb">
            <td style="padding: 8px"><StatusBadge :status="b.status" /></td>
            <td style="padding: 8px">{{ b.pickup }} to {{ b.destination }}</td>
            <td style="padding: 8px">{{ when(b.pickupAt) }}</td>
            <td style="padding: 8px">{{ b.passengers }}</td>
            <td style="padding: 8px">
              <template v-if="b.driver">{{ b.driver.name }}<br /><small>{{ b.driver.plateNumber }}</small></template>
              <template v-else>-</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>