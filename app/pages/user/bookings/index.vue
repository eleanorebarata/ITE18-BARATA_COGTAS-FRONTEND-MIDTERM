<script setup lang="ts">
import { useBookingService } from '~/services/bookings'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const service = useBookingService()

// Bookings live in the browser for now, so load them on the client only.
const { data: bookings, pending, error } = await useAsyncData('my-bookings', () => service.list(), { server: false })

const tab = ref<'active' | 'completed' | 'cancelled'>('active')
const labels = { active: 'Active', completed: 'Completed', cancelled: 'Cancelled' } as const

const groups = computed(() => {
  const all = bookings.value ?? []
  return {
    active: all.filter(b => b.status === 'Pending' || b.status === 'Accepted'),
    completed: all.filter(b => b.status === 'Completed'),
    cancelled: all.filter(b => b.status === 'Cancelled' || b.status === 'Declined')
  }
})
const shown = computed(() => groups.value[tab.value])

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main class="page">
    <p class="eyebrow">Passenger booking</p>
    <h1>Plan and manage your rides</h1>
    <p class="lead">Create a booking or review its latest status.</p>

    <NuxtLink to="/user/book" class="btn-primary btn-block" style="margin: 12px 0 16px">+ Add New Booking</NuxtLink>

    <div class="segmented" role="tablist">
      <button v-for="(label, key) in labels" :key="key" type="button" role="tab" :aria-selected="tab === key"
              :class="{ 'is-active': tab === key }" @click="tab = key as typeof tab">
        {{ label }} ({{ groups[key].length }})
      </button>
    </div>

    <p v-if="pending">Loading your bookings...</p>
    <p v-else-if="error" role="alert" style="color: #9b1c1c">{{ toApiError(error).message }}</p>
    <p v-else-if="!shown.length" class="empty">Nothing here yet.</p>

    <article v-for="b in shown" v-else :key="b.id" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
        <span class="meta">{{ b.transport }}</span>
        <StatusBadge :status="b.status" />
      </div>
      <h2 style="font-size: 1.05rem; margin: 6px 0 4px">
        <NuxtLink :to="`/user/bookings/${b.id}`" style="text-decoration: none">{{ b.pickup }} &rarr; {{ b.destination }}</NuxtLink>
      </h2>
      <p class="meta">{{ when(b.pickupAt) }} &middot; {{ b.passengers }} passenger(s)</p>
      <p v-if="b.fareMin" style="margin: 6px 0 0"><span class="pill">&#8369;{{ b.fareMin }}&ndash;&#8369;{{ b.fareMax }}</span></p>
    </article>
  </main>
</template>