import type { Camera, CameraInfo, Log, PriorityLog, ZoomStream } from '~/types'
import { useIntervalFn } from '@vueuse/core'

interface UserPreferences {
  groups: string[]
  camerasPerPage: number
}

const groups = ref<string[]>([])
const camerasPerPage = ref<number>(2)
const prefsLoaded = ref(false)
const camerasInfo = ref<CameraInfo[]>([])

// latestCaptures: cameraId -> Log mais recente. Mudando nome das variáveis para alinhar ao back
// Lazy fetch de logs
const latestCaptures = ref<Record<string, Log>>({})
const logs = ref<PriorityLog[]>([])
const dataFetched = ref(false)
const loading = ref(false)

/**
 * Processos de zoom ativos (CaptureProcess no backend).
 * Cada item é um quadrante específico de uma câmera virtual sendo capturado
 * com uma frequência definida. NÃO é o stream principal da câmera.
 */
const zoomStreams = ref<ZoomStream[]>([])

// ── Derived cameras (no SSR execution guard needed — always reactive) ──
const cameras = computed<Camera[]>(() =>
  camerasInfo.value.map((info) => {
    const latest = latestCaptures.value[info.id]
    return {
      ...info,
      fireProbability: latest?.fireProbability ?? 0,
      imageUrl: latest?.imageUrl ?? ''
    }
  })
)

export const useCameraData = () => {
  // Preferences - ainda não implementado no backend - TODO: implementar
  const loadPreferences = async () => {
    try {
      const prefs = await $fetch<UserPreferences>('/api/preferences')
      groups.value = prefs.groups
      camerasPerPage.value = prefs.camerasPerPage
    }
    catch {
      groups.value = ['Favoritas']
      camerasPerPage.value = 2
    }
    finally {
      prefsLoaded.value = true
    }
  }

  const savePreferences = async (patch: Partial<UserPreferences>) => {
    try {
      await $fetch('/api/preferences', { method: 'PATCH', body: patch })
    }
    catch (e) {
      console.error('Falha ao salvar preferências', e)
    }
  }

  // Cameras
  const fetchCamerasWithoutLogs = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const data = await $fetch<CameraInfo[]>('/api/cameras')
      if (data?.length) {
        camerasInfo.value = data
      }
    }
    catch (e) {
      console.error('Failed to fetch cameras', e)
    }
    finally {
      loading.value = false
    }
  }

  const fetchAllLogs = async () => {
    if (camerasInfo.value.length) {
      await fetchLogs(camerasInfo.value)
    }
  }

  // Usado em montagens e retentativas externas
  const fetchCameras = async () => {
    await fetchCamerasWithoutLogs()
    await fetchAllLogs()
  }

  // Logs / Capturas
  const BATCH_SIZE = 200

  const fetchLogs = async (cameraList: CameraInfo[]) => {
    for (let i = 0; i < cameraList.length; i += BATCH_SIZE) {
      const batch = cameraList.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(camera => fetchLogsForCamera(camera))
      )
      if (i + BATCH_SIZE < cameraList.length) {
        await new Promise(r => setTimeout(r, 100))
      }
    }
  }

  const fetchLogsForCamera = async (camera: CameraInfo) => {
    try {
      const response = await $fetch<{ logs: Log[] }>('/api/logs', {
        query: {
          cameraId: camera.id,
          lat: camera.geoLocation.latitude,
          lng: camera.geoLocation.longitude
        }
      })

      const cameraLogs = response?.logs ?? []
      if (!cameraLogs.length) return

      // Sort mais recente primeiro
      const sorted = [...cameraLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Acompanha última captura da câmera (usado para imagem do card + probabilidade)
      const newest = sorted[0]
      if (newest) latestCaptures.value[camera.id] = newest

      processLogs(sorted, camera.location)
    }
    catch (e) {
      // falhas individuais de log da câmera não devem travar a UI
      console.warn(`Logs indisponíveis para a câmera ${camera.id} (${camera.name})`, e)
    }
  }

  // Lógica para adicionar novos logs, evitando duplicatas e ordenado. Limite de 2000 logs em memória (acho que é muito)
  const processLogs = (newLogs: Log[], cameraLocation: string) => {
    const existingIds = new Set(logs.value.map(l => l.id))

    for (const log of newLogs) {
      const stableId = `${log.cameraId}-${new Date(log.timestamp).getTime()}`
      if (existingIds.has(stableId)) continue

      logs.value.push({
        id: stableId,
        timestamp: log.timestamp,
        probability: log.fireProbability,
        cameraId: log.cameraId,
        cameraLocation,
        imageUrl: log.imageUrl,
        geoLocation: log.geoLocation,
        quadrantZoom: log.quadrantZoom
      })
      existingIds.add(stableId)
    }

    logs.value.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    if (logs.value.length > 2000) logs.value = logs.value.slice(0, 2000)
  }

  /**
   * Busca os processos de zoom ativos (CaptureProcess) do backend.
   * Chamado no boot e no poll — processos podem ser criados/expirados a qualquer momento.
   */
  const fetchZoomStreams = async () => {
    try {
      const data = await $fetch<ZoomStream[]>('/api/capture-processes')
      zoomStreams.value = data ?? []
    }
    catch (e) {
      console.warn('Processos de zoom indisponíveis', e)
    }
  }

  // Primeira carga de dados, carrega preferências e câmeras
  onMounted(() => {
    if (!dataFetched.value) {
      dataFetched.value = true
      loadPreferences()
      fetchCameras()
      fetchZoomStreams()
    }
  })

  // Poll da lista de câmeras/infraestrutura a cada 10 minutos
  useIntervalFn(fetchCamerasWithoutLogs, 600_000)

  // Poll de capturas (logs e atualização de imagens) a cada 1 minuto
  useIntervalFn(fetchAllLogs, 60_000)

  // Gerenciamento de grupos - ainda não implementado no backend
  const toggleGroup = (cameraId: string, groupName: string) => {
    const camera = camerasInfo.value.find(c => c.id === cameraId)
    if (!camera) return
    const idx = camera.groups.indexOf(groupName)
    if (idx === -1) camera.groups.push(groupName)
    else camera.groups.splice(idx, 1)
  }

  const createGroup = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || groups.value.includes(trimmed)) return
    groups.value.push(trimmed)
    savePreferences({ groups: groups.value })
  }

  const renameGroup = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || groups.value.includes(trimmed)) return
    const idx = groups.value.indexOf(oldName)
    if (idx === -1) return
    groups.value[idx] = trimmed
    camerasInfo.value.forEach((camera) => {
      const gi = camera.groups.indexOf(oldName)
      if (gi !== -1) camera.groups[gi] = trimmed
    })
    savePreferences({ groups: groups.value })
  }

  const deleteGroup = (name: string) => {
    groups.value = groups.value.filter(g => g !== name)
    camerasInfo.value.forEach((camera) => {
      camera.groups = camera.groups.filter(g => g !== name)
    })
    savePreferences({ groups: groups.value })
  }

  const updateCamerasPerPage = (value: number) => {
    camerasPerPage.value = value
    savePreferences({ camerasPerPage: value })
  }

  return {
    cameras,
    logs,
    groups,
    camerasPerPage,
    prefsLoaded,
    loading,
    zoomStreams,
    toggleGroup,
    createGroup,
    renameGroup,
    deleteGroup,
    updateCamerasPerPage,
    fetchCameras,
    fetchLogsForCamera,
    fetchZoomStreams
  }
}
