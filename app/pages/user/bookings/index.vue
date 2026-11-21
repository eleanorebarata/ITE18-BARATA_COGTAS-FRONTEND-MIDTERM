<script setup lang="ts">
import { useBookingService } from '~/services/bookings'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const auth = useAuthStore()
const service = useBookingService()

// Bookings live in the browser for now, so load them on the client only.
const { data: bookings, pending, error } = await useAsyncData('my-bookings', () => service.list(), { server: false })

function logout() {
  auth.logout()
  navigateTo('/auth/user-login')
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <h1>My bookings</h1>
    <p>Signed in as {{ auth.user?.name }}</p>
    <NuxtLink to="/user/book" style="display: inline-block; min-height: 44px; line-height: 44px; padding: 0 24px; background: #1b6b3a; color: #fff; border-radius: 8px">Book a ride</NuxtLink>
    <NuxtLink to="/reports" style="margin-left: 16px">My reports</NuxtLink>
    <button style="margin-left: 8px; min-height: 44px" @click="logout">Log out</button>

    <p v-if="pending">Loading your bookings...</p>
    <p v-else-if="error" role="alert" style="color: #8a1c1c">{{ toApiError(error).message }}</p>
    <p v-else-if="!bookings?.length" style="margin-top: 24px">You have no bookings yet. Tap "Book a ride" to make one.</p>

    <ul v-else style="list-style: none; padding: 0; margin-top: 24px">
      <li v-for="b in bookings" :key="b.id" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px">
        <StatusBadge :status="b.status" />
        <h2 style="font-size: 18px; margin: 8px 0">
          <NuxtLink :to="`/user/bookings/${b.id}`">{{ b.pickup }} to {{ b.destination }}</NuxtLink>
        </h2>
        <p style="margin: 0">{{ when(b.pickupAt) }} &middot; {{ b.passengers }} passenger(s) &middot; {{ b.transport }}</p>
        <p v-if="b.fareMin" style="margin: 4px 0 0">Fare: &#8369;{{ b.fareMin }} to &#8369;{{ b.fareMax }}</p>
      </li>
    </ul>
  </main>
</template>