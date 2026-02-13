<script setup lang="ts">
import type { PriorityLog } from '~/types';

interface Props {
    log: PriorityLog
}

const props = defineProps<Props>()
</script>

<template>
  <div class="relative w-full">
    <UCarousel
      v-slot="{ item }"
      arrows
      dots
      :items="log.imagesBase64"
      :ui="{
        root: 'w-full',
        viewport: 'w-full',
        container: 'w-full',
        item: 'min-w-0 basis-full',
        controls: 'absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none',
        prev: 'pointer-events-auto bg-black/40 hover:bg-black/60 text-white rounded-full',
        next: 'pointer-events-auto bg-black/40 hover:bg-black/60 text-white rounded-full',
        dots: 'absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1',
        dot: 'w-6 h-1'
      }"
      class="w-full"
    >
      <div class="relative w-full max-h-[50vh] bg-black flex items-center justify-center overflow-hidden">
        <img v-if="log.imagesBase64.length > 0" :src="item" class="w-full h-full object-cover">
        <div v-else class="text-white text-opacity-50 flex flex-col items-center py-20">
          <UIcon name="i-heroicons-photo" class="w-12 h-12 mb-2" />
          <span>Sem imagem disponível</span>
        </div>

        <!-- Overlay Info -->
        <div class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs opacity-75">ID da Câmera</div>
              <div class="font-mono">{{ log.cameraId }}</div>
            </div>
            <div class="text-right">
              <UBadge :color="log.probability > 70 ? 'error' : log.probability > 30 ? 'warning' : 'success'"
                size="lg">
                {{ log.probability }}% Probabilidade
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </UCarousel>
  </div>
</template>