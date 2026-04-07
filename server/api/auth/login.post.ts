export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Usuário e senha são obrigatórios.' })
  }

  // Authenticate against FastAPI backend using OAuth2 password flow
  const authData = await loginBackend(username, password)

  // Fetch user info to store in the session (use virtual-camera to confirm token works)
  // Store the JWT token server-side in the session — never exposed to the browser
  await setUserSession(event, {
    user: { id: username, username, name: username },
    backendToken: authData.access_token
  })

  return { ok: true }
})
