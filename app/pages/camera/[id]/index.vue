<script setup lang="ts">
import { format } from 'date-fns'
import type { ZoomStream } from '~/types'

const route = useRoute()
const id = route.params.id as string

const { cameras, logs, zoomStreams } = useCameraData()

const camera = computed(() => cameras.value.find(c => c.id === id))

// Extrai o número de 'physical_camera_7' → 'Câm. 7' - TODO: Pensar nos nomes das câmeras (talvez seja personalizável, id 7 físico se
// manteria, mas o nome poderia ser trocado por usuário)
const physCamLabel = computed(() => {
  const name = camera.value?.physicalCameraName ?? ''
  const match = name.match(/\d+/)
  return match ? `Câm. ${match[0]}` : name
})

// 50 últimos logs da câmera
const cameraLogs = computed(() =>
  logs.value
    .filter(l => l.cameraId === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)
)

// Grid state
const gridOptions = [
  { label: '4 Quadrantes (2x2)', value: 4, rows: 2, cols: 2 },
  { label: '6 Quadrantes (2x3)', value: 6, rows: 2, cols: 3 },
  { label: '8 Quadrantes (2x4)', value: 8, rows: 2, cols: 4 },
  { label: '12 Quadrantes (3x4)', value: 12, rows: 3, cols: 4 },
  { label: '16 Quadrantes (4x4)', value: 16, rows: 4, cols: 4 }
]
const selectedGrid = ref(gridOptions[0])

const gridRows = computed(() => selectedGrid.value?.rows ?? 2)
const gridCols = computed(() => selectedGrid.value?.cols ?? 2)

const gridCells = computed(() => {
  const cells = []
  let num = 1
  for (let r = 0; r < gridRows.value; r++) {
    for (let c = 0; c < gridCols.value; c++) {
      cells.push(num++)
    }
  }
  return cells
})

// ZoomStreams: processos ativos de captura de quadrante específico (CaptureProcess no backend)
// O processo (n_lines: 1, n_cols: 1, quad_number: 0) representa o stream base da câmera,
// portanto é ignorado aqui onde queremos listar apenas Zooms reais.
const zoomStreamsForCamera = computed<ZoomStream[]>(() =>
  zoomStreams.value.filter((s: ZoomStream) =>
    s.cameraId === id && !(s.quadrantZoom.n_lines === 1 && s.quadrantZoom.n_cols === 1 && s.quadrantZoom.quad_number === 0)
  )
)
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar v-if="camera" :title="camera.location">
      <template #left>
        <div class="flex items-center gap-3">
          <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" to="/" />
          <div class="flex flex-col min-w-0">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white leading-tight truncate">
              {{ camera.location }}
            </h2>
            <span class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
              <UIcon name="i-heroicons-cpu-chip" class="w-3 h-3 shrink-0" />
              {{ physCamLabel }}
            </span>
          </div>
        </div>
      </template>
      <template #right>
        <div class="flex items-center gap-2">
          <UBadge :color="camera.status === 'online' ? 'success' : 'error'" variant="soft">
            {{ camera.status === 'online' ? 'Online' : 'Offline' }}
          </UBadge>
        </div>
      </template>
    </UDashboardNavbar>

    <div v-if="camera" class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-1 lg:grid-cols-7 h-[calc(100vh-64px)]">
        <!-- Left: Video Feed & Controls -->
        <div class="lg:col-span-5 bg-black relative flex flex-col h-full">
          <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-950">
            <div class="relative w-full h-full">
              <!-- Backend image via proxy -->
              <img
                v-if="camera.imageUrl"
                :src="camera.imageUrl"
                :alt="camera.name"
                class="absolute inset-0 w-full h-full object-contain"
              >
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-heroicons-video-camera-slash" class="w-20 h-20 text-gray-700" />
              </div>

              <!-- Overlay Grid -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  class="image-grid-overlay grid isolate z-10 pointer-events-auto"
                  :style="{
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                    aspectRatio: '16/9',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%'
                  }"
                >
                  <NuxtLink
                    v-for="cell in gridCells"
                    :key="cell"
                    :to="`/camera/${id}/zoom/${cell}?rows=${gridRows}&cols=${gridCols}`"
                    class="border border-white/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors flex items-center justify-center text-white/50 hover:text-white group cursor-pointer backdrop-hover-effect"
                  >
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <UIcon name="i-heroicons-magnifying-glass-plus" />
                      Zoom Q{{ cell }}
                    </div>
                  </NuxtLink>
                </div>
              </div>

              <!-- Fire Probability Overlay -->
              <div class="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4 text-white shadow-xl">
                <div class="items-center justify-between flex-row flex">
                  <div
                    class="text-2xl font-bold"
                    :class="camera.fireProbability > 50 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'"
                  >
                    {{ camera.fireProbability }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Controls Bar -->
          <div class="bg-gray-900 p-4 border-t border-gray-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-6">
              <div class="px-6 border-l border-gray-700 flex flex-col justify-center">
                <div class="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <UIcon name="i-heroicons-squares-2x2" /> Divisão do Grid
                </div>
                <USelectMenu v-model="selectedGrid" :items="gridOptions" :search-input="false" option-attribute="label" size="xs" class="w-40" />
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Info & Logs -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
          <div class="flex-1 overflow-y-auto p-3 h-full">
          <div v-if="zoomStreamsForCamera.length > 0" class="px-3 pb-3 mb-2 border-b border-gray-200 dark:border-gray-800">
              <div class="text-xs text-blue-400 mb-2 flex items-center gap-1 font-semibold">
                <UIcon name="i-heroicons-magnifying-glass-plus" class="w-3.5 h-3.5" />
                Zooms Ativos
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="stream in zoomStreamsForCamera"
                  :key="stream.id"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :to="`/camera/${id}/zoom/${stream.quadrantZoom.quad_number + 1}?rows=${stream.quadrantZoom.n_lines}&cols=${stream.quadrantZoom.n_cols}`"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-squares-2x2" class="w-3 h-3" />
                  </template>
                  Q{{ stream.quadrantZoom.quad_number + 1 }} &middot; {{ stream.frequency }} foto/min
                </UButton>
              </div>
            </div>
            <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Logs Recentes</h4>
            <div class="space-y-2">
              <div v-if="cameraLogs.length === 0" class="text-center text-gray-500 py-4 text-sm">
                Nenhum log registrado.
              </div>
              <NuxtLink
                v-for="log in cameraLogs"
                :key="log.id"
                :to="`/log/${log.id}`"
                class="block p-3 rounded-lg cursor-pointer transition-all duration-200"
                :class="[
                  log.probability >= 70
                    ? 'border border-red-500 bg-red-950/80 shadow-[0_0_12px_2px_rgba(239,68,68,0.45)] hover:shadow-[0_0_20px_4px_rgba(239,68,68,0.65)]'
                    : log.probability >= 31
                      ? 'border border-orange-500/60 bg-orange-950/40 shadow-sm hover:bg-orange-900/50'
                      : 'border border-gray-700 hover:bg-gray-800 shadow-sm'
                ]"
              >
                <div class="flex justify-between items-start mb-1 gap-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <UIcon v-if="log.probability >= 70" name="i-heroicons-fire" class="w-5 h-5 text-red-400 shrink-0" />
                    <UIcon v-else-if="log.probability >= 31" name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-orange-400 shrink-0" />
                    <span
                      class="font-medium text-base line-clamp-1"
                      :class="log.probability >= 70 ? 'text-red-200 font-semibold' : log.probability >= 31 ? 'text-orange-200' : 'text-gray-100'"
                    >{{ log.probability >= 70 ? 'Alto Risco' : log.probability >= 31 ? 'Risco Moderado' : 'Baixo Risco' }}</span>
                  </div>
                  <UBadge
                    :color="log.probability >= 70 ? 'error' : log.probability >= 31 ? 'warning' : 'success'"
                    variant="soft"
                    size="lg"
                    :class="log.probability >= 70 ? 'font-bold tracking-wide' : ''"
                  >
                    {{ log.probability }}%
                  </UBadge>
                </div>
                <div class="flex items-center justify-between text-sm mt-2">
                  <div class="flex items-center gap-2" :class="log.probability >= 70 ? 'text-red-300' : log.probability >= 31 ? 'text-orange-300' : 'text-gray-200'">
                    <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                    {{ format(new Date(log.timestamp), 'dd/MM HH:mm:ss') }}
                  </div>
                  <div class="text-xs text-gray-400 flex items-center gap-1">
                    Ver detalhes <UIcon name="i-heroicons-arrow-right" />
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-video-camera-slash" class="w-16 h-16 text-gray-500 mb-4" />
      <h2 class="text-xl font-semibold mb-2 text-white">Câmera não encontrada</h2>
      <UButton label="Voltar" to="/" color="neutral" icon="i-heroicons-arrow-left" />
    </div>
  </UDashboardPanel>
</template>

<style scoped>
.backdrop-hover-effect:hover {
  backdrop-filter: blur(2px);
}
</style>
