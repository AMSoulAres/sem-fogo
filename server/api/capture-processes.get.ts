/**
 * GET /api/capture-processes?virtualCameraId=xxx
 *
 * Proxy do GET /capture-process?virtualCamId=xxx
 *
 * Um CaptureProcess representa um quadrante específico de uma câmera virtual
 * que está sendo monitorado ativamente com uma frequência de captura definida.
 * Quando retorna com 1 linha e uma coluna, significa que é a imagem base (feed principal) da câmera.
 *
 * Mapeamento: CaptureProcess[] → ZoomStream[]
 */

interface QuadrantZoom {
  n_lines: number
  n_cols: number
  quad_number: number
}

interface BackendCaptureProcess {
  id: string
  virtual_camera_id: string
  quadrant_zoom: QuadrantZoom
  /** Frequência de captura em fotos/minuto */
  frequency: number
}

interface GetCaptureProcessResponse {
  processes: BackendCaptureProcess[]
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.backendToken) {
    throw createError({ statusCode: 401, message: 'Não autenticado.' })
  }

  const query = getQuery(event)
  const virtualCameraId = query.virtualCameraId as string | undefined

  const data = await fetchBackend<GetCaptureProcessResponse>(event, '/capture-process', {
    query: virtualCameraId ? { virtualCamId: virtualCameraId } : {}
  })

  return data.processes.map(p => ({
    id: p.id,
    cameraId: p.virtual_camera_id,
    quadrantZoom: p.quadrant_zoom,
    /** fotos/minuto */
    frequency: p.frequency
    // TODO (backend): descomentar quando o backend retornar active_viewers
    // activeViewers: p.active_viewers ?? 0
  }))
})
