<script setup lang="ts">
import { useProfileService } from '~/services/profile'

type Tab = { to: string; label: string; icon: string; exact?: boolean; also?: string[] }

const props = defineProps<{ tabs: Tab[]; home: string; loginTo: string; minimal?: boolean }>()

const auth = useAuthStore()
const route = useRoute()
const avatar = useAvatar()
const profileService = useProfileService()

const initial = computed(() => (auth.user?.name ?? '?').charAt(0).toUpperCase())
const within = (path: string, base: string) => path === base || path.startsWith(base + '/')
const isActive = (t: Tab) =>
  t.exact ? route.path === t.to : [t.to, ...(t.also ?? [])].some(b => within(route.path, b))

// Desktop: the Account tab is replaced by the profile button on the right.
const accountTab = computed(() => props.tabs.find(t => t.label === 'Account'))
const topTabs = computed(() => props.tabs.filter(t => t.label !== 'Account'))
const profileTo = computed(() => accountTab.value?.to ?? props.home)
const profileActive = computed(() => (accountTab.value ? isActive(accountTab.value) : false))

async function loadAvatar() {
  avatar.value = null
  if (!auth.user) return
  try {
    avatar.value = (await profileService.get()).avatar
  } catch {
    // Keep the letter avatar.
  }
}
onMounted(loadAvatar)
watch(() => auth.user?.id, loadAvatar)

async function logout() {
  auth.logout()
  await navigateTo(props.loginTo)
}
</script>

<template>
  <div class="shell" :class="{ 'is-app': minimal }">
    <header class="appbar">
      <NuxtLink :to="home" class="brand">
        <BrandMark />
        <span class="brand-text"><strong>CSU Mobility</strong><small>Caraga State University</small></span>
      </NuxtLink>

      <nav class="topnav" aria-label="Main">
        <NuxtLink v-for="t in topTabs" :key="t.to" :to="t.to" :class="{ 'is-active': isActive(t) }"
                  :aria-current="isActive(t) ? 'page' : undefined">{{ t.label }}</NuxtLink>
      </nav>

      <div class="appbar-right" :class="{ 'mobile-hide': minimal }">
        <NuxtLink :to="profileTo" class="profile-link" :class="{ 'is-active': profileActive }"
                  :aria-current="profileActive ? 'page' : undefined" aria-label="My account">
          <span class="avatar" aria-hidden="true" style="overflow: hidden">
            <img v-if="avatar" :src="avatar" alt="" style="width: 100%; height: 100%; object-fit: cover" />
            <template v-else>{{ initial }}</template>
          </span>
          <span class="who">{{ auth.user?.name }}</span>
        </NuxtLink>
        <button type="button" class="btn-ghost" aria-label="Log out" @click="logout">
          <AppIcon name="logout" :size="18" /><span>Log out</span>
        </button>
      </div>
    </header>

    <div class="content"><slot /></div>

    <nav class="tabbar" aria-label="Main">
      <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" :class="{ 'is-active': isActive(t) }"
                :aria-current="isActive(t) ? 'page' : undefined">
        <span class="tab-ico"><AppIcon :name="t.icon" :size="20" /></span>
        <span>{{ t.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>