<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Riwayat Penjualan</h2>
      <router-link to="/sales/input" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
        + Input Baru
      </router-link>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Pelanggan</th>
              <th class="px-6 py-3">Total</th>
              <th class="px-6 py-3">Pembayaran</th>
              <th class="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="6" class="px-6 py-4">Memuat data...</td>
            </tr>
            <tr v-else-if="transactions.length === 0" class="text-center">
              <td colspan="6" class="px-6 py-4 text-gray-400">Belum ada transaksi</td>
            </tr>
            <tr v-else v-for="t in transactions" :key="t.id" class="border-b last:border-0 hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-gray-600">{{ new Date(t.createdAt).toLocaleDateString('id-ID') }}</td>
              <td class="px-6 py-4 font-medium text-gray-900">{{ t.invoice_number }}</td>
              <td class="px-6 py-4 text-gray-600">{{ t.customer_name || '-' }}</td>
              <td class="px-6 py-4 font-medium text-gray-900">Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4 capitalize text-gray-600">{{ t.payment_type }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(t.status)">
                  {{ translateStatus(t.status) }}
                </span>
                <p v-if="t.status === 'rejected'" class="text-xs text-red-500 mt-1 mb-1">{{ t.rejection_reason }}</p>
                <!-- Edit Button if Rejected -->
                <router-link v-if="t.status === 'rejected'" :to="`/sales/edit/${t.id}`" class="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition">
                   ✏️ Edit / Ajukan Ulang
                </router-link>

                <p v-if="(t.status === 'approved' || t.status === 'completed') && t.approved_at" class="text-xs text-green-600 mt-1">
                  ACC: {{ new Date(t.approved_at).toLocaleString('id-ID') }}
                </p>
                <button v-if="t.proof_of_payment" @click="openProofModal(t.proof_of_payment)" class="mt-2 text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 block w-fit">
                  📄 Lihat Bukti
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Proof Preview Modal -->
    <div v-if="showProofModal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in duration-200" @click.self="showProofModal = false">
      <div class="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800 text-sm">Pratinjau Bukti Transaksi</h3>
          <button @click="showProofModal = false" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div class="p-2 bg-gray-100 flex justify-center">
          <template v-if="selectedProofUrl.toLowerCase().endsWith('.pdf')">
            <iframe :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="w-full h-[70vh] border-0" frameborder="0"></iframe>
          </template>
          <template v-else>
            <img :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="max-h-[70vh] object-contain shadow-lg rounded-lg" alt="Bukti Pembayaran" />
          </template>
        </div>
        <div class="p-4 flex justify-end">
          <button @click="showProofModal = false" class="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const transactions = ref([])
const loading = ref(true)
const showProofModal = ref(false)
const selectedProofUrl = ref('')
const authStore = useAuthStore()

const openProofModal = (url) => {
  selectedProofUrl.value = url
  showProofModal.value = true
}

const fetchTransactions = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // Filter transactions created by this user
    transactions.value = response.data.filter(t => t.created_by_id === authStore.user.id)
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'completed': return 'px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700'
    case 'pending': return 'px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700'
    case 'rejected': return 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700'
    case 'approved': return 'px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700'
    default: return 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700'
  }
}

const translateStatus = (status) => {
  switch (status) {
    case 'completed': return 'Selesai'
    case 'pending': return 'Menunggu ACC'
    case 'rejected': return 'Ditolak'
    case 'approved': return 'Disetujui'
    default: return status
  }
}

onMounted(fetchTransactions)
</script>
