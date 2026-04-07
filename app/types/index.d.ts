/**
 * Domain model terminology alignment:
 *
 * Backend term  | Frontend term | Description
 * --------------|---------------|---------------------------------------------
 * VirtualCamera | Camera        | Câmera física apontada para uma direção específica
 * PhysicalCamera| (internal)    | A unidade de hardware real que pode girar
 * Captura       | Log           | Uma imagem + análise de incêndio + metadados
 * Evento        | Event (future)| Agrupamento de capturas relacionadas compartilhando uma fonte de incêndio
 * QuadrantZoom  | QuadrantZoom  | Uma sub-região dentro de uma imagem de captura
 *
 * A VirtualCamera representa uma PhysicalCamera apontada para uma direção específica.
 * A câmera física pode girar, então cada direção que ela aponta é uma VirtualCamera diferente.
 * Do ponto de vista do usuário, eles sempre trabalham com VirtualCameras.
 * O QuadrantZoom é uma subdivisão dentro do frame de uma captura de VirtualCamera.
 */

export interface QuadrantZoom {
  n_lines: number
  n_cols: number
  quad_number: number
}

export interface GeoLocation {
  latitude: number
  longitude: number
}



export interface CameraInfo {
  id: string
  name: string
  location: string
  groups: string[]
  status: 'online' | 'offline'
  geoLocation: GeoLocation
  physicalCameraId: string
  physicalCameraName: string
}

/**
 * VirtualCamera com os dados da sua última captura.
 * Usado nos cards da UI e no dashboard.
 */
export interface Camera extends CameraInfo {
  fireProbability: number
  imageUrl: string
}

/**
 * Captura
 */
export interface Log {
  cameraId: string
  timestamp: string
  fireProbability: number // 0-100
  quadrantZoom: QuadrantZoom
  imageUrl: string
  geoLocation: GeoLocation
}

/**
 * Log
 * Usado no painel de logs, linha do tempo e página de detalhes.
 */
export interface PriorityLog {
  id: string
  timestamp: string
  probability: number
  cameraId: string
  cameraLocation: string
  imageUrl: string
  geoLocation: GeoLocation
  quadrantZoom: QuadrantZoom
}


// TODO: implementar no back sugestão de formato:
/**
 * Evento — agrupamento de Capturas relacionadas que compartilham uma fonte de incêndio.
 * Definido pela equipe de backend; endpoint ainda não disponível.
 * Quando implementado, um Event agregará múltiplas Captures de potencialmente
 * múltiplas VirtualCameras observando o mesmo incêndio.
 */
export interface FireEvent {
  id: string
  startedAt: string
  endedAt: string | null
  maxFireProbability: number
  captureIds: string[]
  geoLocation: GeoLocation
}

/**
 * ZoomStream — um processo ativo de captura de um quadrante específico
 * de uma câmera virtual (CaptureProcess no backend).
 * 
 * Se quadrantZoom possuir n_lines=1, n_cols=1 e quad_number=0,
 * trata-se da imagem base (feed principal) da câmera e não deve ser exibido
 * como um "Zoom Ativo" na interface.
 */
export interface ZoomStream {
  id: string
  cameraId: string
  quadrantZoom: QuadrantZoom
  frequency: number
  /**
   * TODO (backend): número de usuários observando este stream de zoom no momento.
   * Quando implementado, o backend deve retornar este campo em GET /capture-process.
   * útil para: priorizar processos de zoom ativos, mostrar atividade na UI e
   * evitar encerrar processos que ainda têm espectadores.
   * Sugestão de nome no modelo Python: `active_viewers: int = 0`
   */
  // activeViewers?: number
}


