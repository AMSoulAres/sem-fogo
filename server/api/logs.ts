/**
 * GET /api/logs?cameraId=xxx[&lat=y&lng=z]
 *
 * Proxy do GET /captures?virtualCamId=xxx
 * Maps Capture[] → Log[]
 *
 * GeoLocation é passado do cliente (já disponível via /api/cameras)
 * para evitar um round-trip redundante /virtual-camera por câmera.
 */

interface QuadrantZoom {
  n_lines: number
  n_cols: number
  quad_number: number
}

interface Capture {
  id: string
  virtual_camera_id: string
  created_at_timestamp_secs: number
  fire_probability: number
  quadrant_zoom: QuadrantZoom
  minio_image_id: string
}

interface GetCapturesResponse {
  captures: Capture[]
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.backendToken) {
    throw createError({ statusCode: 401, message: 'Não autenticado.' })
  }

  const query = getQuery(event)
  const cameraId = query.cameraId as string | undefined
  const maxResults = Number(query.maxResults ?? 400)
  // geoLocation passed from client to avoid extra backend round-trip
  const lat = parseFloat(query.lat as string)
  const lng = parseFloat(query.lng as string)

  if (!cameraId) {
    return { logs: [] }
  }

  const capturesData = await fetchBackend<GetCapturesResponse>(event, '/captures', {
    query: { virtualCamId: cameraId, maxResults }
  })

  const geoLocation = {
    latitude: isNaN(lat) ? 0 : lat,
    longitude: isNaN(lng) ? 0 : lng
  }

  const logs = capturesData.captures.map(cap => ({
    cameraId: cap.virtual_camera_id,
    timestamp: new Date(cap.created_at_timestamp_secs * 1000).toISOString(),
    fireProbability: cap.fire_probability,
    quadrantZoom: cap.quadrant_zoom,
    imageUrl: `/api/images/${cap.minio_image_id}`,
    geoLocation
  }))

  return { logs }
})
