<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Selamat Datang, {{ authStore.user?.username }}!</h3>
      <p class="text-gray-500">Anda login sebagai <span class="font-medium text-blue-600">{{ authStore.user?.role }}</span>.</p>
      
      <div class="mt-6 flex flex-wrap gap-4">
        <template v-if="authStore.isAdminSales">
          <router-link to="/sales/input" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            📝 Mulai Input Penjualan
          </router-link>
          <router-link to="/sales/history" class="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg hover:bg-blue-50 transition">
            📋 Lihat Riwayat
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
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>
