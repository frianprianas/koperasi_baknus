<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
      <h2 class="text-2xl font-bold text-blue-900 mb-2">Manajemen User Utama</h2>
      <p class="text-sm text-gray-500">Kelola informasi Admin Sales, Keuangan, dan GM (User Default tidak dapat ditambah/hapus)</p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <div v-for="user in users" :key="user.id" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
             {{ user.role === 'admin_penjualan' ? '🛍️' : (user.role === 'keuangan' ? '💰' : '👔') }}
          </div>
          <div>
            <h3 class="font-bold text-gray-900">{{ user.username }}</h3>
            <p class="text-xs font-bold text-blue-600 uppercase">{{ user.role.replace('_', ' ') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
            <input 
              v-model="user.full_name" 
              type="text" 
              class="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Belum diatur"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">WhatsApp (62...)</label>
            <input 
              v-model="user.whatsapp" 
              type="text" 
              @input="formatWA(user)"
              class="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="628..."
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Ganti Password</label>
            <input 
              v-model="user.new_password" 
              type="password" 
              class="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Isi jika ingin ganti"
            />
          </div>
          
          <button 
            @click="updateUser(user)" 
            class="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-blue-700 transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const users = ref([])

const fetchUsers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/auth/users', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    users.value = res.data.map(u => ({ ...u, new_password: '' }))
  } catch (e) {
    console.error(e)
  }
}

const formatWA = (user) => {
  if (user.whatsapp && !user.whatsapp.startsWith('62')) {
    user.whatsapp = '62' + user.whatsapp.replace(/^0/, '')
  }
  user.whatsapp = user.whatsapp.replace(/\D/g, '')
}

const updateUser = async (user) => {
  try {
    const data = {
      full_name: user.full_name,
      whatsapp: user.whatsapp
    }
    if (user.new_password) {
      data.password = user.new_password
    }

    await axios.put(`http://localhost:5000/api/auth/users/${user.id}`, data, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    
    user.new_password = ''
    alert(`Data ${user.username} berhasil diperbarui!`)
  } catch (e) {
    alert("Gagal memperbarui data user")
  }
}

onMounted(fetchUsers)
</script>
