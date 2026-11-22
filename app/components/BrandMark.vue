<script setup lang="ts">
defineProps<{ size?: number }>()

// Set as a variable so the build doesn't require the file to exist.
const logo = '/csu-logo.png'

const img = ref<HTMLImageElement>()
const failed = ref(false)

// If the logo file is missing, show a green "C" instead of a broken image.
onMounted(() => {
  if (img.value && img.value.complete && img.value.naturalWidth === 0) failed.value = true
})
</script>

<template>
  <img v-if="!failed" ref="img" :src="logo" alt="" class="brand-logo"
       :width="size ?? 34" :height="size ?? 34" @error="failed = true" />
  <span v-else class="brand-mark" aria-hidden="true">C</span>
</template>