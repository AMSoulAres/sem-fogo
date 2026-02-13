<script setup lang="ts">
import type { PriorityLog } from '~/types'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const props = defineProps<{
    log: PriorityLog
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null

// Fix Leaflet's default icon path issues
const fixLeafletIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
}

onMounted(() => {
    fixLeafletIcons()

    if (mapContainer.value) {
        map = L.map(mapContainer.value).setView([props.log.geoLocation.latitude, props.log.geoLocation.longitude], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        L.marker([props.log.geoLocation.latitude, props.log.geoLocation.longitude])
            .addTo(map)
            .bindPopup(`<b>${props.log.cameraName}</b><br>Probabilidade: ${props.log.probability}%`)
            .openPopup()
    }
})

// Update map when log changes
watch(() => props.log, (newLog) => {
    if (map && newLog) {
        map.setView([newLog.geoLocation.latitude, newLog.geoLocation.longitude], 13)

        // Clear existing layers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map?.removeLayer(layer)
            }
        })

        L.marker([newLog.geoLocation.latitude, newLog.geoLocation.longitude])
            .addTo(map)
            .bindPopup(`<b>${newLog.cameraName}</b><br>Probabilidade: ${newLog.probability}%`)
            .openPopup()
    }
})
</script>

<template>
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>
</template>
