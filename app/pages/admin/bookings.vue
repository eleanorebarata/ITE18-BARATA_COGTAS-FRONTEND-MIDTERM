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
  <main class="page">
    <p class="eyebrow">Operations</p>
    <h1>Bookings overview</h1>

    <div class="card">
      <label for="b-status">Status</label>
      <select id="b-status" v-model="status" class="search">
        <option value="">All</option>
        <option>Pending</option>
        <option>Accepted</option>
        <option>Declined</option>
        <option>Completed</option>
        <option>Cancelled</option>
      </select>
    </div>

    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #9b1c1c">{{ loadError }}</p>
    <p v-else-if="!bookings.length" class="empty">No bookings match this filter.</p>

    <article v-for="b in bookings" v-else :key="b.id" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
        <span class="meta">{{ b.transport }}</span>
        <StatusBadge :status="b.status" />
      </div>
      <h2 style="font-size: 1.05rem; margin: 6px 0 4px">{{ b.pickup }} &rarr; {{ b.destination }}</h2>
      <p class="meta">{{ when(b.pickupAt) }} &middot; {{ b.passengers }} passenger(s)</p>
      <div v-if="b.driver" class="box">
        <span class="k">Driver</span><span class="v">{{ b.driver.name }} &middot; {{ b.driver.plateNumber }}</span>
      </div>
    </article>
  </main>
</template>