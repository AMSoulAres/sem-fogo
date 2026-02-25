<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id as string
const quadrant = parseInt(route.params.quadrant as string)

const rows = parseInt(route.query.rows as string) || 2
const cols = parseInt(route.query.cols as string) || 2

const { cameras, fetchCameras } = useCameraData()

onMounted(() => {
    if (cameras.value.length === 0) {
        fetchCameras()
    }
})

const camera = computed(() => cameras.value.find(c => c.id === id))

// Calculate transform origin based on quadrant to zoom into the specific CSS grid cell area
const getTransformOrigin = () => {
    // 0 index based
    const q = quadrant - 1
    const r = Math.floor(q / cols)
    const c = q % cols

    // Percentage of X and Y according to cell center
    const xPct = (c + 0.5) * (100 / cols)
    const yPct = (r + 0.5) * (100 / rows)

    return `${xPct}% ${yPct}%`
}

// Ensure the scale takes up the whole screen based on grid size
const getScale = () => {
    return Math.max(rows, cols)
}

</script>

<template>
    <div class="h-screen w-screen bg-black overflow-hidden relative flex flex-col">
        <!-- Top HUD overlay -->
        <div class="absolute top-0 left-0 w-full p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div class="flex items-center gap-4">
                <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" :to="`/camera/${id}`" />
                <div>
                    <h1 class="text-white font-bold text-lg drop-shadow-md flex items-center gap-2">
                        {{ camera?.name || 'Câmera' }}
                    </h1>
                    <div class="text-red-400 font-semibold text-sm flex items-center gap-1">
                        <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        LIVE ZOOM (Q{{ quadrant }})
                    </div>
                </div>
            </div>
            <div class="flex gap-2 text-white/80">
                <UButton icon="i-heroicons-camera" color="neutral" variant="ghost" title="Capturar" />
                <UButton icon="i-heroicons-arrows-pointing-out" color="neutral" variant="ghost" title="Tela Cheia" />
            </div>
        </div>

        <!-- The Image Stream (sf2.jpg) -->
        <div class="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
            <img 
                v-if="camera" 
                src="/sf2.jpg" 
                :alt="camera.name" 
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out"
                :style="{
                    transformOrigin: getTransformOrigin(),
                    transform: `scale(${getScale()})`
                }"
            />
            
            <div v-else class="text-white">Carregando stream...</div>
        </div>
    </div>
</template>
