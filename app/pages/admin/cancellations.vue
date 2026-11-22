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
  <main class="page">
    <p class="eyebrow">Policy review</p>
    <h1>Cancellation review</h1>
    <p class="lead">These are rides cancelled after a driver accepted. Remove a warning when the reason was valid.</p>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #9b1c1c">{{ loadError }}</p>
    <p v-else-if="!items.length" class="empty">No cancellations to review.</p>

    <article v-for="c in items" v-else :key="c.id" class="card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px">
        <strong>{{ c.passengerName }}</strong>
        <span class="tag" :class="{ 'st-deactivated': c.strikeCounted }">{{ state(c) }}</span>
      </div>
      <h2 style="font-size: 1rem; margin: 6px 0 2px">{{ c.route }}</h2>
      <p class="meta">{{ when(c.pickupAt) }}</p>
      <div class="box">
        <span class="k">Reason</span>
        <span class="v">{{ c.reason }}</span>
        <small v-if="c.note" style="color: #5b6b61">{{ c.note }}</small>
      </div>
      <div v-if="c.strikeCounted" class="card-actions">
        <button type="button" @click="openDialog(c)">Remove warning</button>
      </div>
    </article>

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