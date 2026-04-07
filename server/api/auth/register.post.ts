export default defineEventHandler(async (event) => {
  const { username, password, fullName } = await readBody<{
    username: string
    password: string
    fullName: string
  }>(event)

  if (!username || !password || !fullName) {
    throw createError({ statusCode: 400, message: 'Todos os campos são obrigatórios.' })
  }

  // Register on the FastAPI backend — it returns a JWT token
  const token = await registerBackend(username, password, fullName)

  // Automatically log in the user after registration
  await setUserSession(event, {
    user: { id: username, username, name: fullName },
    backendToken: token
  })

  return { ok: true }
})
