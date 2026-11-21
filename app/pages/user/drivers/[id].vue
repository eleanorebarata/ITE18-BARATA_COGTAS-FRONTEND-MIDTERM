<script setup lang="ts">
import { useReviewService } from '~/services/reviews'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const route = useRoute()
const service = useReviewService()

const { data, pending, error } = await useAsyncData(
  `driver-${route.params.id}`,
  () => service.forDriver(route.params.id as string),
  { server: false }
)
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <NuxtLink to="/user/bookings">&larr; My bookings</NuxtLink>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error" role="alert" style="color: #8a1c1c">{{ toApiError(error).message }}</p>

    <template v-else-if="data">
      <h1>{{ data.driver.name }}</h1>
      <p>{{ data.driver.vehicleType }} &middot; Plate {{ data.driver.plateNumber }}</p>

      <p v-if="data.count">
        <RatingStars :value="data.average" />
        <strong style="margin-left: 8px">{{ data.average }} out of 5</strong>
        ({{ data.count }} {{ data.count === 1 ? 'review' : 'reviews' }})
      </p>
      <p v-else>No reviews yet.</p>

      <ReviewList :reviews="data.reviews" />
    </template>
  </main>
</template>