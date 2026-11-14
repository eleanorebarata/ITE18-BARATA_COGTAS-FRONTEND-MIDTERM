import { defineStore } from 'pinia'

export const useBookingDraftStore = defineStore('bookingDraft', {
  state: () => ({
    step: 1,
    pickupId: null as string | null,
    destinationId: null as string | null,
    transport: '',
    pickupAt: '',
    passengers: 1
  }),
  actions: {
    reset() {
      this.$reset()
    }
  }
})