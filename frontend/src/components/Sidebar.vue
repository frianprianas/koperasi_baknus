<template>
  <div class="h-screen w-64 bg-white border-r border-blue-100 flex flex-col shadow-lg fixed left-0 top-0">
    <div class="p-6 border-b border-blue-50">
      <h1 class="text-2xl font-bold text-blue-600 flex items-center gap-2">
        <span class="bg-blue-600 text-white p-1 rounded">KB</span> Baknus
      </h1>
      <p class="text-xs text-gray-500 mt-1">Sistem Koperasi Terpadu</p>
    </div>

    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <div v-if="authStore.user">
        <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Menu {{ formatRole(authStore.user.role) }}
        </p>
        
        <!-- Common -->
        <router-link to="/dashboard" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
          <span>🏠</span> Dashboard
        </router-link>

        <router-link to="/notifications" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600 relative">
          <span>🔔</span> Notifikasi
          <span v-if="unreadCount > 0" class="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {{ unreadCount }}
          </span>
        </router-link>

        <!-- Sales Menu -->
        <template v-if="authStore.isAdminSales">
          <router-link to="/sales/input" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>📝</span> Input Penjualan
          </router-link>
          <router-link to="/sales/history" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>📋</span> Riwayat Transaksi
          </router-link>
        </template>

        <!-- Finance Menu -->
        <template v-if="authStore.isFinance">
          <router-link to="/finance/approvals" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>✅</span> Persetujuan
          </router-link>
          <router-link to="/finance/history" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>📚</span> Semua Transaksi
          </router-link>
        </template>

        <template v-if="authStore.isAdminSales || authStore.isFinance || authStore.isGM">
          <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
            Master Data
          </p>
          <router-link to="/master" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>🗂️</span> Master Data
          </router-link>
        </template>

        <template v-if="authStore.isMaster">
          <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
            Administrator
          </p>
          <router-link to="/accounts" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>👤</span> Manajemen Akun
          </router-link>
        </template>

        <!-- GM Menu -->
        <template v-if="authStore.isGM">
          <router-link to="/gm" active-class="bg-blue-50 text-blue-700 font-medium" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            <span>📊</span> Ringkasan
          </router-link>
        </template>
      </div>
    </nav>

    <div class="p-4 border-t border-blue-50">
      <div class="flex items-center gap-3 px-4 py-3 mb-2">
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
          {{ authStore.user?.username?.charAt(0).toUpperCase() }}
        </div>
        <div class="overflow-hidden">
          <p class="text-sm font-bold text-gray-800 truncate">{{ authStore.user?.full_name || authStore.user?.username }}</p>
          <p class="text-[10px] text-gray-400 font-bold uppercase">{{ formatRole(authStore.user?.role) }}</p>
          <p v-if="authStore.user?.whatsapp" class="text-[11px] text-green-600 font-medium mt-0.5">
            📞 {{ authStore.user?.whatsapp }}
          </p>
        </div>
      </div>
      <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
        <span>🚪</span> Keluar
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()
const unreadCount = ref(0)
let timer = null

const fetchUnreadCount = async () => {
  if (!authStore.token) return
  try {
    const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    unreadCount.value = response.data.count
  } catch (e) {
    console.error('Failed to fetch unread count', e)
  }
}

onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 10000) // Polling every 10s
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formatRole = (role) => {
  switch(role) {
    case 'admin_penjualan': return 'Admin Sales'
    case 'keuangan': return 'Keuangan'
    case 'gm': return 'General Manager'
    case 'master_admin': return 'Master Admin'
    default: return 'User'
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
