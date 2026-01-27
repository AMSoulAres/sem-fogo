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
                data.forEach(log => {
                    latestLogs.value[log.cameraId] = log
                    const camera = camerasInfo.value.find(c => c.id === log.cameraId)
                    logs.value.unshift({
                        id: `log-${Date.now()}-${log.cameraId}`,
                        timestamp: log.timestamp,
                        probability: log.fireProbability,
                        cameraId: log.cameraId,
                        cameraName: camera?.name || 'Unknown'
                    })
                })
                // Keep logs manageable
                if (logs.value.length > 200) logs.value = logs.value.slice(0, 200)
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
