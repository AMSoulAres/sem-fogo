import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

const loadDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))

export default defineEventHandler(async (event) => {
    const { username, password } = await readBody<{ username: string; password: string }>(event)

    if (!username || !password) {
        throw createError({ statusCode: 400, message: 'Usuário e senha são obrigatórios.' })
    }

    const db = loadDB()
    const user = (db.users as any[]).find((u: any) => u.username === username)

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        throw createError({ statusCode: 401, message: 'Usuário ou senha inválidos.' })
    }

    await setUserSession(event, {
        user: { id: user.id, username: user.username, name: user.name }
    })

    return { ok: true }
})
