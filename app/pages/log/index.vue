<script setup lang="ts">
import { format } from 'date-fns'
import type { PriorityLog } from '~/types'
import mapImg from '~/../server/data/mapMock.png'

const route = useRoute()
const id = route.params.id as string

const { logs, fetchCameras, cameras } = useCameraData()

onMounted(() => {
    if (cameras.value.length === 0) {
        fetchCameras()
    }
})

const log = computed<PriorityLog | undefined>(() => logs.value.find(l => l.id === id))

</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar v-if="log" :title="`Detalhes da Detecção - ${log.cameraName}`">
      <template #left>
        <div class="flex items-center gap-2">
          <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" :to="`/camera/${log.cameraId}`" />
          <div class="flex flex-col">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Detalhes da Detecção - {{ log.cameraName }}
            </h2>
            <span class="text-sm text-gray-400">
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
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-500 mb-1">Coordenadas</div>
                <div class="font-mono text-base font-medium">
                  {{ log.geoLocation.latitude.toFixed(6) }}, {{ log.geoLocation.longitude.toFixed(6) }}
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-500 mb-1">Status da Câmera</div>
                <div class="flex items-center gap-2 mt-1">
                  <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span class="font-medium">Online</span>
                </div>
              </div>
            </div>

            <!-- Análise Automática -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
                Análise Automática
              </h4>
              <p class="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                O sistema detectou uma probabilidade de <strong class="font-bold">{{ log.probability }}%</strong> de foco de incêndio nesta região.
                A análise baseia-se em padrões térmicos e visuais capturados às {{ format(new Date(log.timestamp), 'HH:mm') }}.
              </p>
            </div>

            <!-- Demais informações -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
                Demais informações
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Sem informações adicionais no momento.
              </p>
            </div>
          </div>

          <!-- Right: Map -->
          <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px]">
            <div class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400" />
              Localização Estimada
            </div>
            <div class="flex-1 w-full h-full min-h-[300px] relative">
              <img :src="mapImg" alt="Mapa" class="absolute inset-0 w-full h-full object-cover">
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-16 h-16 text-gray-500 mb-4" />
      <h2 class="text-xl font-semibold mb-2 text-white">Log não encontrado</h2>
      <UButton label="Voltar" to="/" color="neutral" icon="i-heroicons-arrow-left" />
    </div>
  </UDashboardPanel>
</template>
