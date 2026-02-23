<script setup lang="ts">
import type { PriorityLog } from '~/types'
import { format } from 'date-fns'
import mapImg from '../../server/data/mapMock.png'
import Carousel from './Carousel.vue'

const props = defineProps<{
  modelValue: boolean
  log: PriorityLog | null
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  isOpen.value = false
}

// Initialize Map when modal opens and log is available
watch(() => [isOpen.value, props.log], async ([open, logData]) => {
  if (open && logData) {
    await nextTick()
    const log = logData as PriorityLog
  }
}, { flush: 'post' })

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-150 flex items-center justify-center">
    <!-- Backdrop / Overlay -->
    <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" @click="close" />

    <!-- Modal Content -->
    <UCard :ui="{
      body: 'p-0 sm:p-0 h-full overflow-y-auto',
      header: 'p-4 border-b border-gray-200 dark:border-gray-800 shrink-0',
      root: 'relative w-full max-w-[80vw] mx-4 sm:mx-8 shadow-2xl z-10 bg-white dark:bg-gray-900 max-h-[95vh] rounded-lg flex flex-col'
    }">
      <template #header>
        <div class="flex items-center justify-between">
          <div v-if="log" class="flex flex-col">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Detalhes da Detecção - {{ log.cameraName }}
            </h3>
            <span class="text-sm text-gray-300">
              {{ format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss') }}
            </span>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="close" />
        </div>
      </template>

      <div v-if="log" class="p-4 bg-gray-50 dark:bg-gray-900">
        <Carousel :log="log" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Coordenadas</div>
                <div class="font-mono text-sm">
                  {{ log.geoLocation.latitude.toFixed(6) }}, {{ log.geoLocation.longitude.toFixed(6) }}
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Status da Câmera</div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <span class="font-medium text-sm">Online</span>
                </div>
              </div>
            </div>

            <!-- Análise Automática -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-information-circle" />
                Análise Automática
              </h4>
              <p class="text-xs text-blue-800 dark:text-blue-200">
                O sistema detectou uma probabilidade de {{ log.probability }}% de foco de incêndio nesta região.
                A análise baseia-se em padrões térmicos e visuais capturados às {{ format(new Date(log.timestamp), 'HH:mm') }}.
              </p>
            </div>

            <!-- Demais informações -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-information-circle" />
                Demais informações
              </h4>
              <p class="text-xs text-blue-800 dark:text-blue-200">
                Espaço para informações adicionais.
              </p>
            </div>
          </div>

          <!-- Right: Map (blue area) -->
          <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col min-h-[200px]">
            <div class="px-3 py-2 text-xs text-gray-500 font-medium flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5" />
              Localização
            </div>
            <div class="flex-1 w-full h-full min-h-[250px]">
              <img :src="mapImg" alt="" class="w-full h-full object-cover">
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
