<script setup lang="ts">
import type { Camera } from '~/types'

const props = defineProps<{
  camera: any
}>()

const emit = defineEmits(['toggle-group', 'open-details'])

const { groups, createGroup } = useCameraData()

const statusColor = computed(() => {
  return props.camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
})

const probabilityColor = computed(() => {
  if (props.camera.fireProbability > 70) return 'text-red-600'
  if (props.camera.fireProbability > 50) return 'text-orange-500'
  return 'text-green-600'
})

const newGroup = ref('')

const addNewGroup = () => {
  if (!newGroup.value) return
  createGroup(newGroup.value)
  emit('toggle-group', props.camera.id, newGroup.value)
  newGroup.value = ''
}

</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0', header: 'p-3 sm:p-3' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 overflow-hidden">
          <div class="w-2 h-2 rounded-full shrink-0" :class="statusColor" />
          <h3 class="font-semibold text-sm truncate">{{ camera.name }}</h3>
        </div>

        <div class="flex items-center">
          <UPopover>
            <UButton icon="i-heroicons-bookmark" :color="camera.groups.length > 0 ? 'primary' : 'neutral'"
              variant="ghost" size="xs" />

            <template #content>
              <div class="p-3 w-64 space-y-3">
                <h4 class="font-medium text-xs text-gray-500 uppercase">Grupos da Câmera</h4>

                <div class="space-y-1 max-h-48 overflow-y-auto">
                  <div v-for="group in groups" :key="group"
                    class="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                    <UCheckbox :model-value="camera.groups.includes(group)"
                      @update:model-value="$emit('toggle-group', camera.id, group)" />
                    <span class="text-sm truncate flex-1">{{ group }}</span>
                  </div>
                </div>

                <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-1">
                  <UInput v-model="newGroup" placeholder="Novo grupo..." size="xs" class="flex-1"
                    @keyup.enter="addNewGroup" />
                  <UButton icon="i-heroicons-plus" size="xs" color="neutral" variant="solid" @click="addNewGroup"
                    :disabled="!newGroup" />
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
    </template>

    <div class="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden group cursor-pointer"
      @click="$emit('open-details', camera)">
      <img :src="camera.imageUrl" :alt="camera.name"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

      <!-- Overlay Icon on Hover -->
      <div
        class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <UIcon name="i-heroicons-arrows-pointing-out" class="text-white w-10 h-10 drop-shadow-lg" />
      </div>

      <div v-if="camera.fireProbability > 0"
        class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-3 flex items-end justify-between">
        <div class="flex flex-col">
          <span class="text-[10px] text-gray-300 uppercase font-bold tracking-wider">Probabilidade de Fogo</span>
          <span class="text-lg font-bold" :class="probabilityColor">
            {{ camera.fireProbability }}%
          </span>
        </div>

        <div v-if="camera.fireProbability > 50" class="animate-pulse">
          <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="text-red-500 w-6 h-6" />
        </div>
      </div>
    </div>
  </UCard>
</template>
