<script setup lang="ts">
import { useBookingService } from '~/services/bookings'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const service = useBookingService()
const { data: bookings, pending, error } = await useAsyncData('my-notifications', () => service.list(), { server: false })

const titles: Record<string, string> = {
  Pending: 'Booking pending',
  Accepted: 'Booking accepted',
  Declined: 'Booking declined',
  Completed: 'Booking completed',
  Cancelled: 'Booking cancelled'
}

const items = computed(() =>
  [...(bookings.value ?? [])].sort((a, b) => (b.acceptedAt ?? b.pickupAt).localeCompare(a.acceptedAt ?? a.pickupAt))
)

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main class="page">
    <p class="eyebrow">Updates</p>
    <h1>Notifications</h1>
    <p class="lead">Booking and trip updates for your rides.</p>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error" role="alert" style="color: #9b1c1c">{{ toApiError(error).message }}</p>
    <p v-else-if="!items.length" class="empty">No updates yet. Book a ride and its progress will show up here.</p>

    <div v-else class="card flush">
      <NuxtLink v-for="b in items" :key="b.id" :to="`/user/bookings/${b.id}`" class="row">
        <span class="ico-circle"><AppIcon :name="b.status === 'Accepted' || b.status === 'Completed' ? 'check' : 'calendar'" :size="20" /></span>
        <span class="grow">
          {{ titles[b.status] ?? b.status }}
          <span class="meta" style="display: block; font-weight: 400">{{ b.pickup }} &rarr; {{ b.destination }}</span>
          <span class="meta" style="display: block; font-weight: 400">{{ when(b.acceptedAt ?? b.pickupAt) }}</span>
        </span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </NuxtLink>
    </div>
  </main>
</template>