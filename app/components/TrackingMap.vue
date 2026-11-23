<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '~/types/api'

const props = defineProps<{ pickup: LatLng; driver: LatLng | null }>()

const el = ref<HTMLElement>()
const unlocked = ref(false)
let map: any
let L: any
let driverMarker: any
let fitted = false
let hadDriver = false
let gone = false

function sync() {
  if (!map) return

  if (props.driver) {
    const at = [props.driver.lat, props.driver.lng]
    if (!driverMarker) {
      driverMarker = L.circleMarker(at, { radius: 11, weight: 3, color: '#8a1c1c', fillColor: '#8a1c1c', fillOpacity: 0.8 })
        .addTo(map)
        .bindTooltip('Driver')
    } else {
      driverMarker.setLatLng(at)
    }
  } else if (driverMarker) {
    driverMarker.remove()
    driverMarker = null
  }

  // Fit the view the first time and when the driver appears. After that the passenger can pan freely.
  const has = !!props.driver
  if (!fitted || has !== hadDriver) {
    const points: number[][] = [[props.pickup.lat, props.pickup.lng]]
    if (props.driver) points.push([props.driver.lat, props.driver.lng])
    if (points.length === 1) map.setView(points[0], 16)
    else map.fitBounds(points, { padding: [40, 40] })
    fitted = true
    hadDriver = has
  }
}

// A locked map ignores swipes and the mouse wheel, so the page scrolls normally.
function applyLock() {
  if (!map) return
  const handlers = [map.dragging, map.touchZoom, map.scrollWheelZoom, map.doubleClickZoom, map.boxZoom, map.keyboard]
  for (const h of handlers) {
    if (unlocked.value) h?.enable()
    else h?.disable()
  }
}
watch(unlocked, applyLock)

onMounted(async () => {
  const mod: any = await import('leaflet')
  if (gone || !el.value) return
  L = mod.default ?? mod

  map = L.map(el.value, {
    dragging: false, touchZoom: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false
  })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  L.circleMarker([props.pickup.lat, props.pickup.lng], { radius: 11, weight: 3, color: '#1b6b3a', fillColor: '#1b6b3a', fillOpacity: 0.8 })
    .addTo(map)
    .bindTooltip('Pickup point')

  sync()
})

watch(() => [props.driver?.lat, props.driver?.lng], sync)

onBeforeUnmount(() => {
  gone = true
  map?.remove()
  map = null
})
</script>

<template>
  <div style="position: relative">
    <div ref="el" style="height: 300px; border-radius: 12px" role="application" aria-label="Map showing your pickup point and your driver" />
    <button type="button" :aria-pressed="unlocked"
            style="position: absolute; top: 10px; right: 10px; z-index: 2; min-height: 36px; padding: 0 12px; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3)"
            @click="unlocked = !unlocked">{{ unlocked ? 'Lock map' : 'Use map' }}</button>
    <p class="meta" style="margin-top: 6px">
      {{ unlocked ? 'Map is active. Press Lock map to scroll the page again.' : 'Press Use map to move and zoom the map.' }}
    </p>
  </div>
</template>