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
            <tr v-else v-for="t in paginatedTransactions" :key="t.id" class="border-b last:border-0 hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-gray-600 font-medium">{{ new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
              <td class="px-6 py-4 font-bold text-gray-900 text-xs">{{ t.invoice_number }}</td>
              <td class="px-6 py-4 text-gray-600">{{ t.customer_name || '-' }}</td>
              <td class="px-6 py-4 font-bold text-blue-700">Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4 capitalize text-gray-500 text-xs">{{ t.payment_type }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(t.status)">
                  {{ translateStatus(t.status) }}
                </span>
                <p v-if="t.status === 'rejected'" class="text-xs text-red-500 mt-1 mb-1">{{ t.rejection_reason }}</p>
                <!-- Edit Button if Rejected -->
                <router-link v-if="t.status === 'rejected'" :to="`/sales/edit/${t.id}`" class="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded hover:bg-yellow-200 transition">
                   ✏️ Edit / Ajukan Ulang
                </router-link>

                <div class="flex flex-wrap gap-2 mt-2">
                  <button v-if="t.proof_of_payment" @click="openProofModal(t.proof_of_payment)" class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                    📄 Bukti
                  </button>
                  <button @click="printInvoice(t, false)" class="text-[10px] text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
                    💾 PDF
                  </button>
                  <button @click="printInvoice(t, true)" class="text-[10px] text-white font-bold bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1 shadow-sm">
                    🖨️ Cetak
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Menampilkan <span class="font-bold">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> - 
          <span class="font-bold">{{ Math.min(currentPage * itemsPerPage, transactions.length) }}</span> dari 
          <span class="font-bold">{{ transactions.length }}</span> data
        </div>
        <div class="flex gap-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border bg-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            &laquo; Prev
          </button>
          <div class="flex gap-1">
             <button 
                v-for="p in totalPages" :key="p"
                @click="currentPage = p"
                :class="currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'"
                class="w-8 h-8 rounded-lg border text-xs font-bold transition flex items-center justify-center border-gray-200"
             >
                {{ p }}
             </button>
          </div>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-lg border bg-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Next &raquo;
          </button>
        </div>
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
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'
import { generateInvoicePDF } from '../../utils/pdfGenerator'

const transactions = ref([])
const loading = ref(true)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showProofModal = ref(false)
const selectedProofUrl = ref('')
const authStore = useAuthStore()

const printInvoice = (transaction, shouldPrint = false) => {
  generateInvoicePDF(transaction, shouldPrint)
}

const totalPages = computed(() => Math.ceil(transactions.value.length / itemsPerPage.value))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return transactions.value.slice(start, end)
})

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
