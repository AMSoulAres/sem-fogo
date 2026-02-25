<script setup lang="ts">
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
    error.value = ''
    loading.value = true
    try {
        await $fetch('/api/auth/login', {
            method: 'POST',
            body: { username: username.value, password: password.value }
        })
        await navigateTo('/')
    } catch (e: any) {
        error.value = e?.data?.message ?? 'Erro ao autenticar. Tente novamente.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <!-- Background glow -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl" />
            <div class="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-red-700/10 rounded-full blur-2xl" />
        </div>

        <div class="relative w-full max-w-sm">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-orange-600/20 border border-orange-600/30 rounded-2xl mb-4">
                    <UIcon name="i-heroicons-fire" class="w-8 h-8 text-orange-400" />
                </div>
                <h1 class="text-2xl font-bold text-white">Sem Fogo</h1>
                <p class="text-sm text-gray-400 mt-1">Monitoramento de Incêndios</p>
            </div>

            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h2 class="text-lg font-semibold text-white mb-6">Entrar</h2>

                <form class="space-y-4" @submit.prevent="handleLogin">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1.5">Usuário</label>
                        <UInput
                            v-model="username"
                            icon="i-heroicons-user"
                            placeholder="Digite seu usuário"
                            size="lg"
                            class="w-full"
                            :disabled="loading"
                            autocomplete="username"
                        />
                    </div>

                    <div>
                        <label class="block text-sm text-gray-400 mb-1.5">Senha</label>
                        <UInput
                            v-model="password"
                            type="password"
                            icon="i-heroicons-lock-closed"
                            placeholder="••••••••"
                            size="lg"
                            class="w-full"
                            :disabled="loading"
                            autocomplete="current-password"
                        />
                    </div>

                    <!-- Error -->
                    <div v-if="error" class="flex items-center gap-2 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                        <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0" />
                        {{ error }}
                    </div>

                    <UButton
                        type="submit"
                        label="Entrar"
                        size="lg"
                        color="primary"
                        class="w-full justify-center"
                        :loading="loading"
                        :disabled="!username || !password"
                    />
                </form>
            </div>
        </div>
    </div>
</template>
