<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>
      <div v-if="loading" class="text-sm text-blue-600 animate-pulse font-medium">Memperbarui data...</div>
    </div>

    <!-- Stats for Sales Admin -->
    <div v-if="authStore.isAdminSales" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition">
        <div class="flex items-center gap-4 text-blue-600 mb-2">
          <div class="p-3 bg-blue-50 rounded-xl"><span class="text-2xl">💰</span></div>
          <span class="text-sm font-bold uppercase tracking-wider text-gray-400">Penjualan Hari Ini</span>
        </div>
        <h3 class="text-2xl font-extrabold text-blue-900 leading-tight">Rp {{ stats.todaySales.toLocaleString('id-ID') }}</h3>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition">
        <div class="flex items-center gap-4 text-emerald-600 mb-2">
          <div class="p-3 bg-emerald-50 rounded-xl"><span class="text-2xl">📈</span></div>
          <span class="text-sm font-bold uppercase tracking-wider text-gray-400">Total Bulan Ini</span>
        </div>
        <h3 class="text-2xl font-extrabold text-emerald-900 leading-tight">Rp {{ stats.monthSales.toLocaleString('id-ID') }}</h3>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 hover:shadow-md transition">
        <div class="flex items-center gap-4 text-amber-600 mb-2">
          <div class="p-3 bg-amber-50 rounded-xl"><span class="text-2xl">⏳</span></div>
          <span class="text-sm font-bold uppercase tracking-wider text-gray-400">Menunggu ACC</span>
        </div>
        <h3 class="text-2xl font-extrabold text-amber-900 leading-tight">{{ stats.pendingCount }} <span class="text-sm text-gray-400 font-medium">Transaksi</span></h3>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-rose-50 hover:shadow-md transition">
        <div class="flex items-center gap-4 text-rose-600 mb-2">
          <div class="p-3 bg-rose-50 rounded-xl"><span class="text-2xl">❌</span></div>
          <span class="text-sm font-bold uppercase tracking-wider text-gray-400">Ditolak</span>
        </div>
        <h3 class="text-2xl font-extrabold text-rose-900 leading-tight">{{ stats.rejectedCount }} <span class="text-sm text-gray-400 font-medium">Transaksi</span></h3>
      </div>
    </div>

    <!-- Main Welcome Card -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Selamat Datang, {{ authStore.user?.username }}!</h3>
      <p class="text-gray-500">Anda login sebagai <span class="font-medium text-blue-600">{{ authStore.user?.role }}</span>.</p>
      
      <div class="mt-6 flex flex-wrap gap-4">
        <template v-if="authStore.isAdminSales">
          <router-link to="/sales/input" class="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2">
            <span>📝</span> Mulai Input Penjualan
          </router-link>
          <router-link to="/sales/history" class="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-xl hover:bg-blue-50 transition flex items-center gap-2">
            <span>📋</span> Lihat Riwayat
          </router-link>
          <router-link to="/sales/piutang" class="bg-white text-amber-600 border border-amber-200 px-6 py-3 rounded-xl hover:bg-amber-50 transition flex items-center gap-2">
            <span>💳</span> Kelola Piutang
          </router-link>
        </template>
        
        <template v-if="authStore.isFinance">
          <router-link to="/finance/approvals" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            ✅ Cek Persetujuan
          </router-link>
        </template>
        
        <template v-if="authStore.isGM">
          <router-link to="/gm" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            📊 Lihat Ringkasan
          </router-link>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const stats = ref({
  todaySales: 0,
  monthSales: 0,
  pendingCount: 0,
  rejectedCount: 0
})

const fetchStats = async () => {
  if (!authStore.isAdminSales) return
  
  loading.value = true
  try {
    const response = await axios.get('http://localhost:5000/api/transactions/stats', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    stats.value = response.data
  } catch (error) {
    console.error("Failed to fetch dashboard stats", error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>
