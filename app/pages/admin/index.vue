<script setup lang="ts">
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const { data: summary, pending, error } = await useAsyncData('admin-summary', () => service.summary(), { server: false })

const statuses = ['Pending', 'Accepted', 'Declined', 'Completed', 'Cancelled'] as const
</script>

<template>
  <main style="max-width: 900px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Dashboard</h1>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error" role="alert" style="color: #8a1c1c">{{ toApiError(error).message }}</p>

    <template v-else-if="summary">
      <h2>Bookings</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px">
        <div v-for="s in statuses" :key="s" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
          <div style="font-size: 28px; font-weight: 700">{{ summary.bookings[s] ?? 0 }}</div>
          <div>{{ s }}</div>
        </div>
      </div>

      <h2>Accounts</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px">
        <div style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
          <div style="font-size: 28px; font-weight: 700">{{ summary.activeUsers }}</div>
          <div>Active</div>
        </div>
        <div style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
          <div style="font-size: 28px; font-weight: 700">{{ summary.suspendedUsers }}</div>
          <div>Suspended</div>
        </div>
        <div style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
          <div style="font-size: 28px; font-weight: 700">{{ summary.deactivatedUsers }}</div>
          <div>Deactivated</div>
        </div>
        <div style="border: 2px solid #f2b705; background: #fdf3cc; border-radius: 12px; padding: 16px">
          <div style="font-size: 28px; font-weight: 700">{{ summary.pendingPlates }}</div>
          <div>Plates to verify</div>
          <NuxtLink v-if="summary.pendingPlates" to="/admin/users?plate=unverified">Review them</NuxtLink>
        </div>
      </div>
    </template>
  </main>
</template>