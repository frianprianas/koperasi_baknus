<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">Dashboard General Manager</h2>
      <div class="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
        <button 
          @click="filterIncome = 'today'" 
          :class="filterIncome === 'today' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          Hari Ini
        </button>
        <button 
          @click="filterIncome = 'month'" 
          :class="filterIncome === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          Bulan Ini
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-blue-600 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
        <div>
          <p class="text-blue-100 text-sm font-medium uppercase tracking-wider">Penjualan ({{ filterIncome === 'today' ? 'Hari Ini' : 'Bulan Ini' }})</p>
          <h3 class="text-3xl font-bold mt-1">{{ filteredSalesCount }}</h3>
        </div>
        <div class="p-3 bg-blue-500 rounded-lg">
          <span class="text-2xl">📈</span>
        </div>
      </div>
      
      <div class="bg-indigo-600 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
        <div>
          <p class="text-indigo-100 text-sm font-medium uppercase tracking-wider">Pendapatan ({{ filterIncome === 'today' ? 'Hari Ini' : 'Bulan Ini' }})</p>
          <h3 class="text-3xl font-bold mt-1">Rp {{ filteredRevenue.toLocaleString('id-ID') }}</h3>
        </div>
        <div class="p-3 bg-indigo-500 rounded-lg">
          <span class="text-2xl">💰</span>
        </div>
      </div>
      
      <div class="bg-yellow-500 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
        <div>
          <p class="text-yellow-100 text-sm font-medium uppercase tracking-wider">Menunggu ACC</p>
          <h3 class="text-3xl font-bold mt-1">{{ pendingCount }}</h3>
        </div>
        <div class="p-3 bg-yellow-400 rounded-lg">
          <span class="text-2xl">⏳</span>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800">Transaksi Terakhir</h3>
        <button class="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Pelanggan</th>
              <th class="px-6 py-3">Total</th>
              <th class="px-6 py-3">Metode</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-center">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in paginatedTransactions" :key="t.id" class="border-b last:border-0 hover:bg-gray-50 transition">
              <td class="px-6 py-4 font-bold text-gray-900">{{ t.invoice_number }}</td>
              <td class="px-6 py-4 text-gray-600 text-xs">{{ new Date(t.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) }}</td>
              <td class="px-6 py-4 text-gray-600 truncate max-w-[150px]">{{ t.customer_name || '-' }}</td>
              <td class="px-6 py-4 font-bold text-gray-900">Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4 capitalize text-gray-500 text-xs">{{ t.payment_type }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(t.status)">
                  {{ translateStatus(t.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <button @click="showDetail(t)" class="p-1 px-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition text-blue-600 font-bold text-xs">
                  Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination for Table -->
      <div v-if="totalPagesTable > 1" class="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
        <span class="text-[10px] text-gray-400 font-bold uppercase">Halaman {{ currentTablePage }} / {{ totalPagesTable }}</span>
        <div class="flex gap-1">
          <button @click="currentTablePage--" :disabled="currentTablePage === 1" class="px-2 py-1 border rounded bg-white text-xs disabled:opacity-30">&laquo;</button>
          <button @click="currentTablePage++" :disabled="currentTablePage === totalPagesTable" class="px-2 py-1 border rounded bg-white text-xs disabled:opacity-30">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedTransaction" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button @click="selectedTransaction = null" class="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        
        <h3 class="text-xl font-bold text-blue-900 mb-1">Rincian Transaksi</h3>
        <p class="text-xs text-gray-500 mb-6 font-mono">{{ selectedTransaction.invoice_number }}</p>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p class="text-[10px] text-gray-400 font-bold uppercase">Pelanggan</p>
            <p class="text-sm font-bold text-gray-800">{{ selectedTransaction.customer_name || '-' }}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p class="text-[10px] text-gray-400 font-bold uppercase">Status</p>
            <span :class="getStatusClass(selectedTransaction.status)" class="mt-1 inline-block">
               {{ translateStatus(selectedTransaction.status) }}
            </span>
          </div>
        </div>

        <div class="max-h-60 overflow-y-auto mb-6">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase">
              <tr>
                <th class="px-4 py-2 text-left">Item</th>
                <th class="px-4 py-2 text-center">Qty</th>
                <th class="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in selectedTransaction.details" :key="item.id">
                <td class="px-4 py-3 text-gray-800 font-medium">{{ item.item_name }}</td>
                <td class="px-4 py-3 text-center text-gray-600">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right font-bold text-gray-900">Rp {{ parseFloat(item.subtotal).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="selectedTransaction.proof_of_payment" class="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
            <span class="text-xs font-bold text-blue-700">📎 Bukti Pembayaran Tersedia</span>
            <button @click="openProofModal(selectedTransaction.proof_of_payment)" class="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition uppercase shadow-sm">Lihat Bukti</button>
        </div>

        <div class="flex items-center justify-between pt-4 border-t">
          <div>
            <p class="text-[10px] text-gray-400 font-bold uppercase">Total Tagihan</p>
            <p class="text-2xl font-black text-blue-600 leading-none">Rp {{ parseFloat(selectedTransaction.total_amount).toLocaleString('id-ID') }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="printInvoice(selectedTransaction)" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition flex items-center gap-2">
              <span>🖨️</span> Cetak
            </button>
            <button @click="selectedTransaction = null" class="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg">Tutup</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Proof Preview Modal (Top Layer) -->
    <div v-if="showProofModal" class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] animate-in zoom-in duration-200" @click.self="showProofModal = false">
      <div class="relative max-w-4xl w-full flex flex-col items-center">
        <button @click="showProofModal = false" class="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300">&times;</button>
        <template v-if="selectedProofUrl.toLowerCase().endsWith('.pdf')">
          <iframe :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="w-full h-[85vh] rounded-lg border-4 border-white bg-white" frameborder="0"></iframe>
        </template>
        <template v-else>
          <img :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl border-4 border-white" alt="Bukti Pembayaran" />
        </template>
        <p class="text-white mt-4 text-sm font-bold bg-black/50 px-4 py-2 rounded-full">Klik di luar gambar untuk menutup</p>
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
const selectedTransaction = ref(null)
const showProofModal = ref(false)
const selectedProofUrl = ref('')
const authStore = useAuthStore()

const printInvoice = (transaction, shouldPrint = true) => {
  generateInvoicePDF(transaction, shouldPrint)
}
const filterIncome = ref('today')

// Table Pagination state
const currentTablePage = ref(1)
const itemsPerPageTable = ref(10)

const totalPagesTable = computed(() => Math.ceil(transactions.value.length / itemsPerPageTable.value))

const paginatedTransactions = computed(() => {
  const start = (currentTablePage.value - 1) * itemsPerPageTable.value
  return transactions.value.slice(start, start + itemsPerPageTable.value)
})

const fetchTransactions = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    transactions.value = response.data
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

const showDetail = (t) => {
  selectedTransaction.value = t
}

const openProofModal = (url) => {
  selectedProofUrl.value = url
  showProofModal.value = true
}
// Existing logic...
const filteredSalesCount = computed(() => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return transactions.value.filter(t => {
    if (!t.createdAt) return false
    const date = new Date(t.createdAt)
    if (filterIncome.value === 'today') {
      return t.createdAt.startsWith(today)
    } else {
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }
  }).length
})

const filteredRevenue = computed(() => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return transactions.value
    .filter(t => {
      if (!t.createdAt) return false
      const date = new Date(t.createdAt)
      const isApproved = t.status === 'completed' || t.status === 'approved'
      if (!isApproved) return false

      if (filterIncome.value === 'today') {
        return t.createdAt.startsWith(today)
      } else {
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }
    })
    .reduce((sum, t) => sum + parseFloat(t.total_amount), 0)
})

const pendingCount = computed(() => transactions.value.filter(t => t.status === 'pending').length)

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
