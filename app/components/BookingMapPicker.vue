<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Place } from '~/types/api'

const props = defineProps<{ places: Place[]; pickupId: string | null; destinationId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()

const el = ref<HTMLElement>()
const unlocked = ref(false)
let map: any
let L: any
let line: any
let gone = false
const markers = new Map<string, any>()

function colorFor(id: string) {
  if (id === props.pickupId) return '#1d6b3b'
  if (id === props.destinationId) return '#9b1c1c'
  return '#4b5563'
}

function redraw() {
  if (!map) return
  for (const p of props.places) {
    markers.get(p.id)?.setStyle({ color: colorFor(p.id), fillColor: colorFor(p.id) })
  }
  if (line) {
    line.remove()
    line = null
  }
  const a = props.places.find(p => p.id === props.pickupId)
  const b = props.places.find(p => p.id === props.destinationId)
  if (a && b) {
    line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color: '#f2b705', weight: 4 }).addTo(map)
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
  // The page may have been closed while the map library was loading.
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

  for (const p of props.places) {
    const m = L.circleMarker([p.lat, p.lng], { radius: 11, weight: 3, fillOpacity: 0.8 })
      .addTo(map)
      .bindTooltip(p.name)
      .on('click', () => emit('select', p.id))
    markers.set(p.id, m)
  }

  if (props.places.length) {
    map.fitBounds(props.places.map(p => [p.lat, p.lng]), { padding: [40, 40] })
  } else {
    map.setView([8.9552, 125.5975], 15)
  }
  redraw()
})

watch(() => [props.pickupId, props.destinationId], redraw)

onBeforeUnmount(() => {
  gone = true
  map?.remove()
  map = null
})
</script>

<template>
  <div style="position: relative">
    <div ref="el" style="height: 320px; border-radius: 12px" role="application" aria-label="Campus map with pickup points" />
    <button type="button" :aria-pressed="unlocked"
            style="position: absolute; top: 10px; right: 10px; z-index: 2; min-height: 36px; padding: 0 12px; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3)"
            @click="unlocked = !unlocked">{{ unlocked ? 'Lock map' : 'Use map' }}</button>
    <p class="meta" style="margin-top: 6px">
      {{ unlocked ? 'Map is active. Press Lock map to scroll the page again.' : 'Press Use map to move and zoom. You can still tap the points.' }}
    </p>
  </div>
</template>