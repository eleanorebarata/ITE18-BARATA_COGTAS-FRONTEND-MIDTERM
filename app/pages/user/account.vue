<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const auth = useAuthStore()

async function logout() {
  auth.logout()
  await navigateTo('/auth/user-login')
}
</script>

<template>
  <main class="page">
    <ProfileCard role-label="Passenger account" />

    <div class="card flush">
      <NuxtLink to="/reports" class="row">
        <span class="ico-circle"><AppIcon name="flag" :size="20" /></span>
        <span class="grow">My reports<span class="meta" style="display: block; font-weight: 400">Reports you sent about drivers</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </NuxtLink>
      <NuxtLink to="/routes" class="row">
        <span class="ico-circle"><AppIcon name="tag" :size="20" /></span>
        <span class="grow">Routes and fares<span class="meta" style="display: block; font-weight: 400">Check an estimated fare</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </NuxtLink>
      <button type="button" class="row danger" @click="logout">
        <span class="ico-circle" style="background: #fbeaea; color: #9b1c1c"><AppIcon name="logout" :size="20" /></span>
        <span class="grow">Log out<span class="meta" style="display: block; font-weight: 400">End this session securely</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </button>
    </div>
  </main>
</template>