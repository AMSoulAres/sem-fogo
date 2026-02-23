import { formatISO } from 'date-fns'
import type { CameraInfo, Log, PriorityLog } from '~/types'
import { useIntervalFn } from '@vueuse/core'

interface UserPreferences {
    groups: string[]
    camerasPerPage: number
}

export const useCameraData = () => {
    // Preferences loaded from API (per-user)
    const groups = ref<string[]>([])
    const camerasPerPage = ref<number>(2)
    const prefsLoaded = ref(false)

    const loadPreferences = async () => {
        try {
            const prefs = await $fetch<UserPreferences>('/api/preferences')
            groups.value = prefs.groups
            camerasPerPage.value = prefs.camerasPerPage
        } catch {
            // fallback defaults if not logged in yet
            groups.value = ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques']
            camerasPerPage.value = 2
        } finally {
            prefsLoaded.value = true
        }
    }

    const savePreferences = async (patch: Partial<UserPreferences>) => {
        try {
            await $fetch('/api/preferences', { method: 'PATCH', body: patch })
        } catch (e) {
            console.error('Failed to save preferences', e)
        }
    }

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
                camerasInfo.value = data
                await fetchLogsForCameras(data)
            }
        } catch (e) {
            console.error('Failed to fetch cameras', e)
        }
    }

    const fetchLogsForCameras = async (cameras: CameraInfo[]) => {
        const promises = cameras.map(async (camera) => {
            try {
                const response = await $fetch<{ logs: Log[] }>('/api/logs', {
                    query: { cameraId: camera.id }
                })

                const cameraLogs = response.logs || []

                if (cameraLogs.length > 0) {
                    const newest = cameraLogs[0]
                    if (newest) {
                        latestLogs.value[camera.id] = newest
                    }
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

        logs.value.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        if (logs.value.length > 1000) logs.value = logs.value.slice(0, 1000)
    }

    // Initial fetch
    loadPreferences()
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
            savePreferences({ groups: groups.value })
        }
    }

    const renameGroup = (oldName: string, newName: string) => {
        const trimmed = newName.trim()
        if (!trimmed || trimmed === oldName || groups.value.includes(trimmed)) return
        const idx = groups.value.indexOf(oldName)
        if (idx === -1) return
        groups.value[idx] = trimmed
        camerasInfo.value.forEach(camera => {
            const gi = camera.groups.indexOf(oldName)
            if (gi !== -1) camera.groups[gi] = trimmed
        })
        savePreferences({ groups: groups.value })
    }

    const deleteGroup = (name: string) => {
        groups.value = groups.value.filter(g => g !== name)
        camerasInfo.value.forEach(camera => {
            camera.groups = camera.groups.filter(g => g !== name)
        })
        savePreferences({ groups: groups.value })
    }

    const updateCamerasPerPage = (value: number) => {
        camerasPerPage.value = value
        savePreferences({ camerasPerPage: value })
    }

    const sendCameraCommand = (cameraId: string, command: string) => {
        console.log(`Sending command ${command} to camera ${cameraId}`)
        return new Promise(resolve => setTimeout(resolve, 800))
    }

    return {
        cameras,
        logs,
        groups,
        camerasPerPage,
        prefsLoaded,
        toggleGroup,
        createGroup,
        renameGroup,
        deleteGroup,
        updateCamerasPerPage,
        sendCameraCommand
    }
}
