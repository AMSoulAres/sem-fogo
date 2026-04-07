<script setup lang="ts">
const { groups, cameras, createGroup, renameGroup, deleteGroup } = useCameraData()

// TODO: Grupos ainda estão sendo salvos no localStorage, precisamos mudar para o back.

const emit = defineEmits(['close'])

const newGroupName = ref('')

const handleCreate = () => {
  const name = newGroupName.value.trim()
  if (!name || groups.value.includes(name)) return
  createGroup(name)
  newGroupName.value = ''
}

// Inline edit
const editingGroup = ref<string | null>(null)
const editingName = ref('')

const startEdit = (group: string) => {
  editingGroup.value = group
  editingName.value = group
}

const confirmEdit = () => {
  if (editingGroup.value) renameGroup(editingGroup.value, editingName.value)
  editingGroup.value = null
  editingName.value = ''
}

const cancelEdit = () => {
  editingGroup.value = null
  editingName.value = ''
}

const deletingGroup = ref<string | null>(null)

const confirmDelete = (group: string) => {
  deleteGroup(group)
  deletingGroup.value = null
}

const camerasInGroup = (group: string) =>
  cameras.value.filter(c => c.groups.includes(group)).length
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" @click="emit('close')" />

    <!-- Modal -->
    <div class="relative z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-folder-open" class="w-5 h-5 text-primary-400" />
          <h3 class="font-semibold text-white text-base">Gerenciar Grupos</h3>
        </div>
        <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" color="neutral" @click="emit('close')" />
      </div>

      <!-- Lista de grupos -->
      <div class="max-h-80 overflow-y-auto divide-y divide-gray-800">
        <div v-if="groups.length === 0" class="text-center text-gray-500 py-8 text-sm">
          Nenhum grupo criado.
        </div>

        <div v-for="group in groups" :key="group" class="px-5 py-3 flex flex-col gap-2">

          <!-- Linha do grupo -->
          <div v-if="editingGroup !== group && deletingGroup !== group" class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="text-sm text-gray-100 truncate">{{ group }}</span>
              <span class="text-xs text-gray-500 shrink-0">({{ camerasInGroup(group) }} câmera{{ camerasInGroup(group) !== 1 ? 's' : '' }})</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UButton icon="i-heroicons-pencil" size="xs" variant="ghost" color="neutral" @click="startEdit(group)" />
              <UButton icon="i-heroicons-trash" size="xs" variant="ghost" color="error" @click="deletingGroup = group" />
            </div>
          </div>

          <!-- Inline edit para renomear grupo-->
          <div v-else-if="editingGroup === group" class="flex items-center gap-2">
            <UInput
              v-model="editingName"
              size="xs"
              class="flex-1"
              @keyup.enter="confirmEdit"
              @keyup.escape="cancelEdit"
              autofocus
            />
            <UButton icon="i-heroicons-check" size="xs" color="primary" variant="solid" @click="confirmEdit" />
            <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" color="neutral" @click="cancelEdit" />
          </div>

          <!-- Inline delete -->
          <div v-else-if="deletingGroup === group" class="flex flex-col gap-2 bg-red-950/50 border border-red-800 rounded-lg p-3">
            <p class="text-xs text-red-300">
              Excluir <strong>{{ group }}</strong>? {{ camerasInGroup(group) > 0 ? `${camerasInGroup(group)} câmera(s) serão desassociadas.` : 'Nenhuma câmera será afetada.' }}
            </p>
            <div class="flex gap-2">
              <UButton label="Excluir" size="xs" color="error" variant="solid" @click="confirmDelete(group)" />
              <UButton label="Cancelar" size="xs" variant="ghost" color="neutral" @click="deletingGroup = null" />
            </div>
          </div>

        </div>
      </div>

      <!-- Criar novo grupo -->
      <div class="px-5 py-4 border-t border-gray-800 flex gap-2">
        <UInput
          v-model="newGroupName"
          placeholder="Novo grupo..."
          size="sm"
          class="flex-1"
          @keyup.enter="handleCreate"
        />
        <UButton
          label="Criar"
          size="sm"
          color="primary"
          variant="solid"
          :disabled="!newGroupName.trim() || groups.includes(newGroupName.trim())"
          @click="handleCreate"
        />
      </div>
    </div>
  </div>
</template>
