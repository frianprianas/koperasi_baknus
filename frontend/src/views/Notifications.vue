<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Pusat Notifikasi</h2>
      <button 
        @click="markAllAsRead" 
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        v-if="notifications.some(n => !n.is_read)"
      >
        Tandai Semua Sudah Dibaca
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        Memuat notifikasi...
      </div>
      
      <div v-else-if="notifications.length === 0" class="p-8 text-center text-gray-400">
        Tidak ada notifikasi untuk Anda.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div 
          v-for="n in notifications" 
          :key="n.id" 
          class="p-4 hover:bg-gray-50 transition cursor-pointer"
          :class="{ 'bg-blue-50/30': !n.is_read }"
          @click="handleNotifClick(n)"
        >
          <div class="flex gap-4">
            <div class="mt-1">
              <div :class="getTypeClass(n.type)" class="w-2 h-2 rounded-full"></div>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold text-gray-900" :class="{ 'text-blue-900': !n.is_read }">
                  {{ n.title }}
                </h3>
                <span class="text-xs text-gray-400 whitespace-nowrap">
                  {{ formatTime(n.createdAt) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ n.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const notifications = ref([])
const loading = ref(true)
const authStore = useAuthStore()
const router = useRouter()

const fetchNotifications = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    notifications.value = response.data
  } catch (error) {
    console.error('Error fetching notifications:', error)
  } finally {
    loading.value = false
  }
}

const handleNotifClick = async (notif) => {
  if (!notif.is_read) {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notif.id}/read`, {}, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      notif.is_read = true
    } catch (e) {
      console.error(e)
    }
  }

  // Navigation logic based on notification type/related_id
  if (notif.related_id) {
    if (authStore.isAdminSales) {
        router.push('/sales/history')
    } else if (authStore.isFinance) {
        router.push('/finance/approvals')
    } else if (authStore.isGM) {
        router.push('/gm')
    }
  }
}

const markAllAsRead = async () => {
  try {
    await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    notifications.value.forEach(n => n.is_read = true)
  } catch (e) {
    console.error(e)
  }
}

const getTypeClass = (type) => {
  switch (type) {
    case 'success': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'danger': return 'bg-red-500'
    default: return 'bg-blue-500'
  }
}

const formatTime = (date) => {
  const d = new Date(date)
  return d.toLocaleString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(fetchNotifications)
</script>
