/**
 * GET /api/images/:id
 *
 * Proxy do GET /image/{minio_image_id}
 * Streams the image binary directly from the backend.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.backendToken) {
    throw createError({ statusCode: 401, message: 'Não autenticado.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Image ID is required.' })
  }

  const backendResponse = await fetchBackendRaw(event, `/image/${id}`)
  const contentType = backendResponse.headers.get('content-type') ?? 'image/png'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300')

  const buffer = await backendResponse.arrayBuffer()
  return new Uint8Array(buffer)
})
