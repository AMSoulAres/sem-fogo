<script setup lang="ts">
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const fullName = ref('')
const error = ref('')
const loading = ref(false)

const { fetch: fetchSession } = useUserSession()

const passwordMismatch = computed(() =>
  passwordConfirm.value.length > 0 && password.value !== passwordConfirm.value
)

const isFormValid = computed(() =>
  username.value.trim().length > 0
  && fullName.value.trim().length > 0
  && password.value.length >= 6
  && password.value === passwordConfirm.value
)

const handleRegister = async () => {
  if (!isFormValid.value) return
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: username.value.trim(),
        password: password.value,
        fullName: fullName.value.trim()
      }
    })
    await fetchSession()
    await navigateTo('/')
  }
  catch (e: any) {
    error.value = e?.data?.message ?? 'Erro ao criar conta. Tente novamente.'
  }
  finally {
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
        <h2 class="text-lg font-semibold text-white mb-6">Criar Conta</h2>

        <form class="space-y-4" @submit.prevent="handleRegister">
          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Nome Completo</label>
            <UInput
              v-model="fullName"
              icon="i-heroicons-user-circle"
              placeholder="Seu nome completo"
              size="lg"
              class="w-full"
              :disabled="loading"
              autocomplete="name"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Usuário</label>
            <UInput
              v-model="username"
              icon="i-heroicons-user"
              placeholder="Escolha um usuário"
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
              placeholder="Mínimo 6 caracteres"
              size="lg"
              class="w-full"
              :disabled="loading"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Confirmar Senha</label>
            <UInput
              v-model="passwordConfirm"
              type="password"
              icon="i-heroicons-lock-closed"
              placeholder="Repita a senha"
              size="lg"
              class="w-full"
              :disabled="loading"
              :color="passwordMismatch ? 'error' : undefined"
              autocomplete="new-password"
            />
            <p v-if="passwordMismatch" class="text-xs text-red-400 mt-1 ml-1">
              As senhas não coincidem.
            </p>
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-2 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0" />
            {{ error }}
          </div>

          <UButton
            type="submit"
            label="Criar Conta"
            size="lg"
            color="primary"
            class="w-full justify-center"
            :loading="loading"
            :disabled="!isFormValid"
          />
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?
          <NuxtLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Entrar
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
