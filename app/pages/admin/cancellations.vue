<script setup lang="ts">
import type { AdminCancellation } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const items = ref<AdminCancellation[]>([])
const loading = ref(true)
const loadError = ref('')
const banner = ref('')

async function load() {
  loading.value = true
  try {
    items.value = await service.cancellations()
    loadError.value = ''
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const dialog = ref<any>(null)
const target = ref<AdminCancellation | null>(null)
const dialogError = ref('')
const dialogBusy = ref(false)

function openDialog(c: AdminCancellation) {
  target.value = c
  dialogError.value = ''
  dialog.value?.open()
}

async function confirm(p: { reasonCode: string; note: string }) {
  if (!target.value) return
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await service.excuse(target.value.id, p)
    dialog.value?.close()
    banner.value = 'Warning removed.'
    await load()
  } catch (e) {
    dialogError.value = toApiError(e).message
  } finally {
    dialogBusy.value = false
  }
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
const state = (c: AdminCancellation) => (c.strikeCounted ? 'Warning counted' : c.strikeRemoved ? 'Warning removed' : 'No warning')
</script>

<template>
  <main style="max-width: 1000px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Cancellation review</h1>
    <p>These are rides cancelled after a driver accepted. Remove a warning when the reason was valid.</p>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>
    <p v-else-if="!items.length">No cancellations to review.</p>

    <div v-else style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; min-width: 720px">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #d1d5db">
            <th scope="col" style="padding: 8px">Passenger</th>
            <th scope="col" style="padding: 8px">Ride</th>
            <th scope="col" style="padding: 8px">Reason</th>
            <th scope="col" style="padding: 8px">Warning</th>
            <th scope="col" style="padding: 8px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id" style="border-bottom: 1px solid #e5e7eb">
            <td style="padding: 8px">{{ c.passengerName }}</td>
            <td style="padding: 8px">{{ c.route }}<br /><small>{{ when(c.pickupAt) }}</small></td>
            <td style="padding: 8px">{{ c.reason }}<br /><small v-if="c.note">{{ c.note }}</small></td>
            <td style="padding: 8px"><strong>{{ state(c) }}</strong></td>
            <td style="padding: 8px">
              <button v-if="c.strikeCounted" style="min-height: 44px" @click="openDialog(c)">Remove warning</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReasonDialog
      ref="dialog"
      title="Remove this warning?"
      intro="The passenger's warning count goes down by one. If this lifts the suspension, the account becomes active again."
      :reasons="excuseReasons"
      confirm-label="Remove warning"
      tone="primary"
      :busy="dialogBusy"
      :error="dialogError"
      @confirm="confirm"
    />
  </main>
</template>