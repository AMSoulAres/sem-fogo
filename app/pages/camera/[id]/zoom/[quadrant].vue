<script setup lang="ts">
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

const getTransformOrigin = () => {
  const q = quadrant - 1
  const r = Math.floor(q / cols)
  const c = q % cols
  const xPct = (c + 0.5) * (100 / cols)
  const yPct = (r + 0.5) * (100 / rows)
  return `${xPct}% ${yPct}%`
}

const getScale = () => Math.max(rows, cols)
</script>

<template>
  <div class="h-screen w-screen bg-black overflow-hidden relative flex flex-col">
    <!-- Top HUD overlay -->
    <div class="absolute top-0 left-0 w-full p-4 z-50 flex items-center justify-between bg-linear-to-b from-black/80 to-transparent">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" :to="`/camera/${id}`" />
        <div>
          <h1 class="text-white font-bold text-lg drop-shadow-md flex items-center gap-2">
            {{ camera?.name || 'Câmera' }}
          </h1>
          <div class="text-red-400 font-semibold text-sm flex items-center gap-1">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
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

    <!-- Image from backend via proxy -->
    <div class="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
      <img
        v-if="camera?.imageUrl"
        :src="camera.imageUrl"
        :alt="camera.name"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out"
        :style="{
          transformOrigin: getTransformOrigin(),
          transform: `scale(${getScale()})`
        }"
      >
      <div v-else class="text-white/50 flex flex-col items-center justify-center gap-3">
        <UIcon name="i-heroicons-video-camera-slash" class="w-16 h-16" />
        <span>Carregando imagem...</span>
      </div>
    </div>
  </div>
</template>
