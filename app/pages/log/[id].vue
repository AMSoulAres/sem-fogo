<script setup lang="ts">
import { format } from 'date-fns'
import type { PriorityLog, Camera } from '~/types'

const route = useRoute()
const id = route.params.id as string

const { logs, cameras } = useCameraData()

// A Captura (Log no frontend) é uma imagem + resultado de análise + metadados de uma VirtualCamera
const log = computed<PriorityLog | undefined>(() => logs.value.find(l => l.id === id))

// VirtualCamera que originou esta captura
const virtualCamera = computed<Camera | undefined>(() =>
  cameras.value.find(c => c.id === log.value?.cameraId)
)
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar v-if="log" :title="`Captura — ${virtualCamera?.location ?? log.cameraLocation}`">
      <template #left>
        <div class="flex items-center gap-3">
          <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" :to="`/camera/${log.cameraId}`" />
          <div class="flex flex-col min-w-0">
            <!-- Captura = Log no frontend -->
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white leading-tight truncate">
              {{ virtualCamera?.location ?? log.cameraLocation }}
            </h2>
            <span class="text-xs text-gray-500 flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="w-3 h-3 shrink-0" />
              {{ format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss') }}
            </span>
          </div>
        </div>
      </template>
    </UDashboardNavbar>

    <div v-if="log" class="p-4 bg-gray-50 dark:bg-gray-950 flex-1 overflow-y-auto">
      <div class="max-w-5xl mx-auto flex flex-col gap-6">
        <Carousel :log="log" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4">
            <!-- Dados da Captura -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-500 mb-1">Coordenadas GPS</div>
                <div class="font-mono text-sm font-medium leading-tight">
                  {{ log.geoLocation.latitude.toFixed(6) }}<br>
                  {{ log.geoLocation.longitude.toFixed(6) }}
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-500 mb-1">Quadrante</div>
                <div class="font-mono text-base font-medium">
                  Q{{ log.quadrantZoom.quad_number + 1 }}
                  <span class="text-xs text-gray-400">({{ log.quadrantZoom.n_lines }}×{{ log.quadrantZoom.n_cols }})</span>
                </div>
              </div>
            </div>

            <!-- Câmera Virtual que originou a captura -->
            <div
              v-if="virtualCamera"
              class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-video-camera" class="w-4 h-4" />
                Detalhes da Câmera
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <!-- TODO: Melhorar conceito de direção/ localização-->
                  <span class="text-gray-500">Direção monitorada/Localização</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ virtualCamera.location }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 flex items-center gap-1">
                    <UIcon name="i-heroicons-cpu-chip" class="w-3.5 h-3.5" />
                    Id Físico
                  </span>
                  <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ virtualCamera.physicalCameraName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">ID da Câmera (Virtual)</span>
                  <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ virtualCamera.id }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Status</span>
                  <UBadge :color="virtualCamera.status === 'online' ? 'success' : 'error'" variant="soft" size="xs">
                    {{ virtualCamera.status === 'online' ? 'Online' : 'Offline' }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Análise Automática -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
                Análise da Captura
              </h4>
              <p class="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                A captura registrou uma probabilidade de <strong class="font-bold">{{ log.probability }}%</strong> de foco de incêndio.
                A análise baseia-se em padrões térmicos e visuais capturados às {{ format(new Date(log.timestamp), 'HH:mm') }}.
              </p>
            </div>

            <!-- Nota sobre Eventos (futuro) TODO: Popular para agrupamentos de logs -->
            <div class="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                Evento
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                Esta captura ainda não está associada a um evento. Um evento agrupa múltiplas capturas que compartilham um mesmo foco de incêndio.
              </p>
            </div>
          </div>

          <!-- Right: Map -->
          <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px]">
            <div class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400" />
              Localização do Hardware Físico
            </div>
            <div class="flex-1 w-full h-full min-h-[260px] relative bg-gray-900 flex flex-col items-center justify-center gap-3 p-6">
              <UIcon name="i-heroicons-map" class="w-14 h-14 text-gray-600" />
              <div class="text-center">
                <div class="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Câmera Física</div>
                <div class="text-gray-300 text-sm font-medium mb-3">{{ virtualCamera?.physicalCameraName ?? '—' }}</div>
                <div class="font-mono text-white text-sm">
                  {{ log.geoLocation.latitude.toFixed(6) }}
                </div>
                <div class="font-mono text-white text-sm">
                  {{ log.geoLocation.longitude.toFixed(6) }}
                </div>
              </div>
              <UBadge color="neutral" variant="soft" class="text-xs">
                Mapa interativo em desenvolvimento
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-16 h-16 text-gray-500 mb-4" />
      <h2 class="text-xl font-semibold mb-2 text-white">Captura não encontrada</h2>
      <UButton label="Voltar" to="/" color="neutral" icon="i-heroicons-arrow-left" />
    </div>
  </UDashboardPanel>
</template>
