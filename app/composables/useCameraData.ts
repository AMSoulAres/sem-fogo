import { sub, formatISO } from 'date-fns'
import type { CameraInfo, CameraInfoLogResponse, PriorityLog } from '~/types'
import { useIntervalFn } from '@vueuse/core'

interface CameraExtended extends CameraInfo {
    fireProbability: number
    imageUrl: string
    groups: string[]
}

export const useCameraData = () => {
    const groups = useLocalStorage<string[]>('camera-groups', ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques'])

    // Static Camera Info
    const camerasInfo = ref<CameraInfo[]>([
        { id: 'cam-1', name: 'Esplanada/Lago', location: 'Brasília, DF', groups: ['Favoritas', 'Zona Sul'], status: 'online' },
        { id: 'cam-2', name: 'Parque Nacional', location: 'Brasília, DF', groups: ['Favoritas', 'Zona Norte', 'Parques'], status: 'online' },
        { id: 'cam-3', name: 'Fercal', location: 'Sobradinho, DF', groups: ['Zona Norte'], status: 'online' },
        { id: 'cam-4', name: 'Núcleo Rural', location: 'Planaltina, DF', groups: [], status: 'offline' },
        { id: 'cam-5', name: 'Jardim Botânico', location: 'Lago Sul, DF', groups: ['Parques'], status: 'online' },
        { id: 'cam-6', name: 'Torre de TV', location: 'Plano Piloto, DF', groups: ['Favoritas'], status: 'online' }
    ])

    // State for latest logs
    const latestLogs = ref<Record<string, CameraInfoLogResponse>>({})

    // Historical Logs (Accumulated)
    const logs = ref<PriorityLog[]>([])

    const fetchLogs = async () => {
        try {
            const data = await $fetch<CameraInfoLogResponse[]>('/api/logs')
            if (data) {
                // Track existing log IDs for deduplication
                const existingIds = new Set(logs.value.map(l => l.id))

                data.forEach(log => {
                    // Update latest log for camera (always overwrite with newest)
                    const currentLatest = latestLogs.value[log.cameraId]
                    if (!currentLatest || new Date(log.timestamp) > new Date(currentLatest.timestamp)) {
                        latestLogs.value[log.cameraId] = log
                    }

                    // Create stable ID based on cameraId + timestamp
                    const stableId = `${log.cameraId}-${new Date(log.timestamp).getTime()}`

                    // Only add if not already present (deduplication)
                    if (!existingIds.has(stableId)) {
                        const camera = camerasInfo.value.find(c => c.id === log.cameraId)
                        logs.value.push({
                            id: stableId,
                            timestamp: log.timestamp,
                            probability: log.fireProbability,
                            cameraId: log.cameraId,
                            cameraName: camera?.name || 'Unknown'
                        })
                        existingIds.add(stableId)
                    }
                })

                // Sort by timestamp descending and limit
                logs.value.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                if (logs.value.length > 500) logs.value = logs.value.slice(0, 500)
            }
        } catch (e) {
            console.error('Failed to fetch logs', e)
        }
    }

    // Poll every minute
    const { pause, resume, isActive } = useIntervalFn(fetchLogs, 60000, { immediate: true })

    // Merged Data for UI
    const cameras = computed<any[]>(() => {
        return camerasInfo.value.map(info => {
            const log = latestLogs.value[info.id]
            return {
                ...info,
                fireProbability: log?.fireProbability ?? 0,
                imageUrl: log?.imageBase64 ?? '', // Fallback or placeholder logic could go here
                groups: info.groups // Ensure groups are passed through
            }
        })
    })

    const toggleGroup = (cameraId: string, groupName: string) => {
        const camera = camerasInfo.value.find(c => c.id === cameraId)
        if (camera) {
            if (camera.groups.includes(groupName)) {
                camera.groups = camera.groups.filter(g => g !== groupName)
            } else {
                camera.groups.push(groupName)
            }
        }
    }

    const createGroup = (name: string) => {
        if (!groups.value.includes(name)) {
            groups.value.push(name)
        }
    }

    const sendCameraCommand = (cameraId: string, command: string) => {
        console.log(`Sending command ${command} to camera ${cameraId}`)
        return new Promise(resolve => setTimeout(resolve, 800))
    }

    return {
        cameras,
        logs,
        groups,
        toggleGroup,
        createGroup,
        sendCameraCommand
    }
}
