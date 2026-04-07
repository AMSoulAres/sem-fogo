import type { H3Event } from 'h3'

interface BackendFetchOptions {
  method?: string
  headers?: Record<string, string>
  query?: Record<string, string | number | undefined>
  body?: unknown
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(path, baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function getToken(event: H3Event): Promise<string | undefined> {
  const session = await getUserSession(event)
  const token = session?.backendToken
  return typeof token === 'string' ? token : undefined
}

export async function fetchBackend<T>(
  event: H3Event,
  path: string,
  options: BackendFetchOptions = {}
): Promise<T> {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl as string
  const token = await getToken(event)

  const headers: Record<string, string> = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const url = buildUrl(backendUrl, path, options.query)
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw createError({ statusCode: response.status, message: errorBody || `Backend error: ${response.statusText}` })
  }

  return response.json() as Promise<T>
}

export async function fetchBackendRaw(
  event: H3Event,
  path: string,
  options: BackendFetchOptions = {}
): Promise<Response> {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl as string
  const token = await getToken(event)

  const headers: Record<string, string> = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = buildUrl(backendUrl, path, options.query)
  const response = await fetch(url, { method: options.method ?? 'GET', headers })

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: `Backend error: ${response.statusText}` })
  }

  return response
}

export async function loginBackend(
  username: string,
  password: string
): Promise<{ access_token: string; token_type: string }> {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl as string

  const formData = new URLSearchParams()
  formData.set('username', username)
  formData.set('password', password)

  const response = await fetch(`${backendUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Usuário ou senha inválidos.' })
  }

  return response.json()
}

export async function registerBackend(
  username: string,
  password: string,
  fullName: string
): Promise<string> {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl as string

  const response = await fetch(`${backendUrl}/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, full_name: fullName })
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Falha no registro.' }))
    throw createError({ statusCode: response.status, message: (errorBody as any)?.detail || 'Falha no registro.' })
  }

  const token = await response.json()
  return typeof token === 'string' ? token : (token as any).access_token ?? token
}
