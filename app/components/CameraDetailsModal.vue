<script setup lang="ts">
import type { Camera } from '~/types'
import { format } from 'date-fns'

const props = defineProps<{
    camera: Camera
    modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const close = () => {
    isOpen.value = false
}

const { sendCameraCommand, logs } = useCameraData()

const cameraLogs = computed(() => {
    return logs.value.filter(l => l.cameraId === props.camera.id).slice(0, 50)
})

const isSending = ref(false)

const handleCommand = async (cmd: string) => {
    if (isSending.value) return
    isSending.value = true
    await sendCameraCommand(props.camera.id, cmd)
    isSending.value = false
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
        <!-- Backdrop / Overlay -->
        <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" @click="close" />

        <!-- Modal Content -->
        <UCard :ui="{
            body: 'p-0',
            header: 'p-4 border-b border-gray-200 dark:border-gray-800',
            root: 'relative w-full sm:max-w-5xl shadow-2xl z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-hidden rounded-lg'
        }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        {{ camera.name }}
                    </h3>
                    <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="close" />
                </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-3 h-[500px]">
                <!-- Left: Video Feed & Controls -->
                <div class="lg:col-span-2 bg-black relative flex flex-col">
                    <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-950">
                        <img :src="camera.imageUrl" :alt="camera.name" class="w-full h-full object-contain" />
                        <div class="absolute bottom-4 left-4 text-white drop-shadow-md">
                            <div class="text-xs opacity-80">LAT: -15.7934 LONG: -47.8823</div>
                            <div class="text-lg font-bold">{{ camera.location }}</div>
                        </div>
                    </div>

                    <!-- Controls Bar -->
                    <div class="bg-gray-900 p-4 border-t border-gray-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="grid grid-cols-3 gap-1">
                                <div />
                                <UButton icon="i-heroicons-chevron-up" color="neutral" variant="solid" size="xs"
                                    @click="handleCommand('up')" :loading="isSending" />
                                <div />
                                <UButton icon="i-heroicons-chevron-left" color="neutral" variant="solid" size="xs"
                                    @click="handleCommand('left')" :loading="isSending" />
                                <UButton icon="i-heroicons-stop" color="neutral" variant="solid" size="xs"
                                    @click="handleCommand('stop')" :loading="isSending" />
                                <UButton icon="i-heroicons-chevron-right" color="neutral" variant="solid" size="xs"
                                    @click="handleCommand('right')" :loading="isSending" />
                                <div />
                                <UButton icon="i-heroicons-chevron-down" color="neutral" variant="solid" size="xs"
                                    @click="handleCommand('down')" :loading="isSending" />
                                <div />
                            </div>
                            <div class="px-4 border-l border-gray-700 ml-2">
                                <div class="text-xs text-gray-400 mb-1">Zoom</div>
                                <div class="flex gap-1">
                                    <UButton icon="i-heroicons-minus" size="xs" color="neutral"
                                        @click="handleCommand('zoom-out')" />
                                    <UButton icon="i-heroicons-plus" size="xs" color="neutral"
                                        @click="handleCommand('zoom-in')" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <UButton icon="i-heroicons-camera" label="Capturar" color="neutral" variant="ghost" />
                        </div>
                    </div>
                </div>

                <!-- Right: Info & Logs -->
                <div
                    class="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Status da Detecção</h4>
                        <div class="flex items-center gap-3">
                            <div class="text-center">
                                <div class="text-3xl font-bold"
                                    :class="camera.fireProbability > 50 ? 'text-red-500' : 'text-green-500'">
                                    {{ camera.fireProbability }}%
                                </div>
                                <div class="text-xs text-gray-500">Probabilidade de Fogo</div>
                            </div>
                            <div class="h-10 w-px bg-gray-200 dark:bg-gray-700" />
                            <div>
                                <div class="text-sm font-medium">Vento: 12 km/h NE</div>
                                <div class="text-sm font-medium">Umidade: 45%</div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4">
                        <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Logs Recentes</h4>
                        <div class="space-y-3">
                            <div v-for="log in cameraLogs" :key="log.id"
                                class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm relative border-l-4"
                                :class="log.probability > 70 ? 'border-red-500' : 'border-gray-300'">
                                <div class="flex justify-between text-xs text-gray-500">
                                    <span>{{ format(new Date(log.timestamp), 'dd/MM HH:mm:ss') }}</span>
                                </div>
                                <div class="mt-1 font-medium text-gray-900 dark:text-white">
                                    Detecção de Fumaça ({{ log.probability }}%)
                                </div>
                            </div>
                            <div v-if="cameraLogs.length === 0" class="text-center text-gray-500 py-4">
                                Nenhum log registrado.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>
