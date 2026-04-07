/**
 * GET /api/cameras
 *
 * Proxy para FastAPI GET /virtual-camera.
 *
 * Domínio:
 *   VirtualCamera = câmera física apontando em UMA direção específica.
 *   Câmeras físicas podem girar; cada direção gera uma VirtualCamera distinta.
 *   O usuário sempre trabalha com VirtualCameras — câmeras físicas são referência interna.
 *
 * Mapeamento: VirtualCameraInfo[] → CameraInfo[]
 */

interface VirtualCameraInfo {
  id: string
  name: string
  physical_camera_status: 'online' | 'offline'
  physical_camera_id: string
  physical_camera_name: string
  physical_camera_location: { latitude: number; longitude: number }
  camera_view_location: string
  groups: string[]
}

interface GetVirtualCameraResponse {
  cameras: VirtualCameraInfo[]
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.backendToken) {
    throw createError({ statusCode: 401, message: 'Não autenticado.' })
  }

  const data = await fetchBackend<GetVirtualCameraResponse>(event, '/virtual-camera')

  return data.cameras.map(cam => ({
    id: cam.id,
    name: cam.name,
    location: cam.camera_view_location,
    groups: cam.groups,
    status: cam.physical_camera_status,
    geoLocation: cam.physical_camera_location,
    physicalCameraId: cam.physical_camera_id,
    physicalCameraName: cam.physical_camera_name
  }))
})
