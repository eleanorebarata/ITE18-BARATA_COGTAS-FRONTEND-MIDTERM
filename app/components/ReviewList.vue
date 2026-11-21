<script setup lang="ts">
import type { Review } from '~/types/api'

defineProps<{ reviews: Review[] }>()

const when = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
</script>

<template>
  <ul style="list-style: none; padding: 0; margin: 0">
    <li v-for="r in reviews" :key="r.id" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px">
      <RatingStars :value="r.rating" />
      <strong style="margin-left: 8px">{{ r.authorName }}</strong>
      <small style="margin-left: 8px">{{ when(r.createdAt) }}</small>
      <p v-if="r.tags.length" style="margin: 8px 0 0"><small>{{ r.tags.join(' · ') }}</small></p>
      <p v-if="r.comment" style="margin: 8px 0 0">{{ r.comment }}</p>
      <div style="margin-top: 8px">
        <ReportButton target-type="review" :review-id="r.id" label="Report this review" />
      </div>
    </li>
  </ul>
</template>