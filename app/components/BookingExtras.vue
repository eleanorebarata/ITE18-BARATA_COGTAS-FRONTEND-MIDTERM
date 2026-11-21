<script setup lang="ts">
import type { Booking, Review } from '~/types/api'
import { useReviewService } from '~/services/reviews'

const props = defineProps<{ booking: Booking }>()
const service = useReviewService()

const review = ref<Review | null>(null)
const loaded = ref(false)
const busy = ref(false)
const error = ref('')

async function loadReview() {
  if (props.booking.status !== 'Completed') {
    loaded.value = true
    return
  }
  try {
    review.value = await service.forBooking(props.booking.id)
  } catch {
    // If this fails, the form still shows. The server refuses a second review anyway.
  } finally {
    loaded.value = true
  }
}

onMounted(loadReview)
watch(() => props.booking.status, loadReview)

async function submit(p: { rating: number; tags: string[]; comment: string }) {
  busy.value = true
  error.value = ''
  try {
    review.value = await service.create(props.booking.id, p)
  } catch (e) {
    const err = toApiError(e)
    error.value = Object.values(err.fields ?? {})[0] ?? err.message
    if (err.code === 'ALREADY_REVIEWED') await loadReview()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <section v-if="booking.driver" style="margin-top: 16px">
      <h2>Your driver</h2>
      <p style="margin: 0">
        <NuxtLink :to="`/user/drivers/${booking.driver.id}`">{{ booking.driver.name }}</NuxtLink>
        &middot; {{ booking.driver.vehicleType }}, plate {{ booking.driver.plateNumber }}
      </p>
      <div style="margin-top: 8px">
        <ReportButton :booking-id="booking.id" target-type="driver" label="Report this driver" />
      </div>
    </section>

    <section v-if="booking.status === 'Completed' && loaded" style="margin-top: 16px">
      <h2>Your feedback</h2>
      <template v-if="review">
        <RatingStars :value="review.rating" />
        <p v-if="review.tags.length" style="margin: 8px 0 0">{{ review.tags.join(' · ') }}</p>
        <p v-if="review.comment" style="margin: 8px 0 0">{{ review.comment }}</p>
        <p><small>Thank you. Your feedback helps other passengers.</small></p>
      </template>
      <template v-else>
        <p>How was your ride? Your feedback helps other passengers choose.</p>
        <ReviewForm :busy="busy" :error="error" @submit="submit" />
      </template>
    </section>
  </div>
</template>