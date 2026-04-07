declare module '#auth-utils' {
    interface User {
        id: string
        username: string
        name: string
    }

    interface UserSession {
        user: User
        /**
         * JWT Bearer token from the FastAPI backend.
         * Stored server-side only — never sent to the browser.
         */
        backendToken: string
    }
}

export {}
