import { sub, formatISO } from 'date-fns'
import type { CameraInfo, Log, PriorityLog } from '~/types'
import { useIntervalFn } from '@vueuse/core'

export const useCameraData = () => {
    const groups = useLocalStorage<string[]>('camera-groups', ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques'])

    const camerasInfo = ref<CameraInfo[]>([])

    // State to store the latest log per camera for the UI cards
    const latestLogs = ref<Record<string, Log>>({})

    // Historical Logs (Accumulated from API calls)
    const logs = ref<PriorityLog[]>([])

    // Fetch all available cameras
    const fetchCameras = async () => {
        try {
            const data = await $fetch<CameraInfo[]>('/api/cameras')
            if (data) {
                // Merge/Update camera info
                camerasInfo.value = data

                // After fetching cameras, fetch logs for each
                await fetchLogsForCameras(data)
            }
        } catch (e) {
            console.error('Failed to fetch cameras', e)
        }
    }

    const fetchLogsForCameras = async (cameras: CameraInfo[]) => {
        // Fetch logs for each camera
        // In a real app we might batch this or use a single endpoint with query params
        // For this task, we iterate as requested (request for each camera)

        const promises = cameras.map(async (camera) => {
            try {
                // Defaulting to last 24h as per requirement
                const response = await $fetch<{ logs: Log[] }>('/api/logs', {
                    query: { cameraId: camera.id }
                })

                const cameraLogs = response.logs || []

                if (cameraLogs.length > 0) {
                    // Update latest log for this camera
                    // Logs are sorted desc by timestamp from API
                    const newest = cameraLogs[0]

                    if (newest) {
                        latestLogs.value[camera.id] = newest
                    }

                    // Add to global logs list (PriorityLog format)
                    processLogs(cameraLogs, camera.name)
                }
            } catch (e) {
                console.error(`Failed to fetch logs for ${camera.id}`, e)
            }
        })

        await Promise.all(promises)
    }

    const processLogs = (newLogs: Log[], cameraName: string) => {
        const existingIds = new Set(logs.value.map(l => l.id))

        newLogs.forEach(log => {
            // Create stable ID based on cameraId + timestamp
            const stableId = `${log.cameraId}-${new Date(log.timestamp).getTime()}`

            if (!existingIds.has(stableId)) {
                logs.value.push({
                    id: stableId,
                    timestamp: log.timestamp,
                    probability: log.fireProbability,
                    cameraId: log.cameraId,
                    cameraName: cameraName,
                    imagesBase64: log.imagesBase64,
                    geoLocation: log.geoLocation
                })
                existingIds.add(stableId)
            }
        })

        // Sort by timestamp descending
        logs.value.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Keep manageable size
        if (logs.value.length > 1000) logs.value = logs.value.slice(0, 1000)
    }

    // Initial fetch
    fetchCameras()

    // Poll every 10 minutes (600,000 ms)
    const { pause, resume, isActive } = useIntervalFn(fetchCameras, 600000)

    // Merged Data for UI
    const cameras = computed<any[]>(() => {
        return camerasInfo.value.map(info => {
            const log = latestLogs.value[info.id]
            return {
                ...info,
                fireProbability: log?.fireProbability ?? 0,
                // Taking the first image if available
                imageUrl: log?.imagesBase64?.[0] ?? '',
                groups: info.groups
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
