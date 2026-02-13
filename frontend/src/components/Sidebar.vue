<template>
  <div class="h-screen w-64 bg-white border-r border-gray-100 flex flex-col shadow-lg fixed left-0 top-0">
    <div class="p-6 border-b border-gray-50 flex flex-col items-center">
      <img src="/logo_koperasi.png" alt="Logo Koperasi" class="w-16 h-16 object-contain mb-2" />
      <h1 class="text-xl font-bold text-brand-navy tracking-tight">Baknus</h1>
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sistem Koperasi Terpadu</p>
    </div>

    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <div v-if="authStore.user">
        <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Menu {{ formatRole(authStore.user.role) }}
        </p>
        
        <!-- Common -->
        <router-link to="/dashboard" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
          <span>🏠</span> Dashboard
        </router-link>

        <router-link to="/notifications" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy relative">
          <span>🔔</span> Notifikasi
          <span v-if="unreadCount > 0" class="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {{ unreadCount }}
          </span>
        </router-link>

        <!-- Purchase Menu (Admin Pembelian) -->
        <template v-if="authStore.isAdminPurchase">
          <router-link to="/purchase/input" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📦</span> Input Pembelian
          </router-link>
          <router-link to="/purchase/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📜</span> Riwayat Pembelian
          </router-link>
          <router-link to="/transport" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🚚</span> Biaya Angkutan
          </router-link>
        </template>
        
        <!-- Purchase Approvals (Admin GM) -->
         <template v-if="authStore.isAdminGM">
          <router-link to="/purchase/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🛡️</span> Persetujuan Pembelian
          </router-link>
           <router-link to="/transport" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🚚</span> Persetujuan Transport
          </router-link>
        </template>

        <!-- Sales Menu -->
        <template v-if="authStore.isAdminSales" >
          <router-link to="/sales/input" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📝</span> Input Penjualan
          </router-link>
          <router-link to="/sales/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📋</span> Riwayat Transaksi
          </router-link>
          <router-link to="/sales/piutang" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>💳</span> Kelola Piutang
          </router-link>
        </template>

        <!-- Finance Menu -->
        <template v-if="authStore.isFinance">
          <router-link to="/finance/approvals" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>✅</span> Persetujuan
          </router-link>
          <router-link to="/finance/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📚</span> Semua Transaksi
          </router-link>
           <router-link to="/purchase/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>💸</span> Pembayaran Restock
          </router-link>
           <router-link to="/transport" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🚚</span> Pembayaran Transport
          </router-link>
          <router-link to="/finance/cash-flow" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📈</span> Arus Kas
          </router-link>
        </template>

        <template v-if="authStore.isAdminSales || authStore.isFinance || authStore.isGM">
          <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
            Master Data
          </p>
          <router-link to="/master" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🗂️</span> Master Data
          </router-link>
        </template>

        <template v-if="authStore.isMaster">
          <p class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
            Administrator
          </p>
          <router-link to="/accounts" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>👤</span> Manajemen Akun
          </router-link>
        </template>

        <!-- GM Menu -->
        <template v-if="authStore.isGM">
          <router-link to="/gm" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📊</span> Ringkasan
          </router-link>
          <router-link to="/purchase/history" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📝</span> Persetujuan Pembelian
          </router-link>
           <router-link to="/transport" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>🚚</span> Persetujuan Transport
          </router-link>
          <router-link to="/finance/cash-flow" active-class="bg-brand-green/10 text-brand-green font-bold" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50 hover:text-brand-navy">
            <span>📈</span> Laporan Arus Kas
          </router-link>
        </template>
      </div>
    </nav>

    <div class="p-4 border-t border-gray-50 bg-gray-50/50">
      <div class="flex items-center gap-3 px-4 py-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center font-bold text-base shadow-sm">
          {{ authStore.user?.username?.charAt(0).toUpperCase() }}
        </div>
        <div class="overflow-hidden">
          <p class="text-sm font-bold text-gray-800 truncate leading-tight">{{ authStore.user?.full_name || authStore.user?.username }}</p>
          <p class="text-[10px] text-brand-green font-bold uppercase mt-0.5">{{ formatRole(authStore.user?.role) }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all">
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
    case 'admin_pembelian': return 'Purchasing'
    case 'admin_gm': return 'Admin GM'
    default: return 'User'
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
