<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">Semua Transaksi</h2>
      <div class="flex flex-wrap gap-2">
        <!-- Status Filter -->
        <select v-model="filterStatus" class="border rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu ACC</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="completed">Selesai</option>
        </select>
        
        <!-- Payment Type Filter -->
        <select v-model="filterPayment" class="border rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option value="">Semua Pembayaran</option>
          <option value="cash">Cash (Tunai)</option>
          <option value="transfer">Transfer</option>
          <option value="piutang">Piutang</option>
        </select>

        <!-- Month Filter -->
        <select v-model="filterMonth" class="border rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option v-for="(m, index) in months" :key="index" :value="index">
            {{ m }}
          </option>
        </select>

        <!-- Year Filter -->
        <select v-model="filterYear" class="border rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option v-for="y in years" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Sales Admin</th>
              <th class="px-6 py-3">Pelanggan</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3">Pembayaran</th>
               <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="8" class="px-6 py-4">Memuat data...</td>
            </tr>
            <tr v-else-if="filteredTransactions.length === 0" class="text-center">
              <td colspan="8" class="px-6 py-4 text-gray-400">Belum ada transaksi</td>
            </tr>
            <tr v-else v-for="t in paginatedTransactions" :key="t.id" class="border-b last:border-0 hover:bg-gray-50 transition text-xs sm:text-sm">
              <td class="px-6 py-4 text-gray-600 font-bold">{{ new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}</td>
              <td class="px-6 py-4 font-bold text-gray-900">{{ t.invoice_number }}</td>
              <td class="px-6 py-4 text-gray-600">{{ t.sales_admin?.username || '-' }}</td>
              <td class="px-6 py-4 text-gray-600">{{ t.customer_name || '-' }}</td>
              <td class="px-6 py-4 font-bold text-gray-900 text-right">Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4">
                <span :class="{'bg-green-100 text-green-700': t.payment_type === 'cash', 'bg-blue-100 text-blue-700': t.payment_type === 'transfer', 'bg-purple-100 text-purple-700': t.payment_type === 'piutang' }" class="px-2 py-0.5 text-[10px] font-bold rounded uppercase">
                  {{ t.payment_type }}
                </span>
                <button v-if="t.proof_of_payment" @click="openProofModal(t.proof_of_payment)" class="block mt-1 text-[10px] text-blue-600 hover:underline">
                    Bukti 📎
                </button>
              </td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(t.status)">
                  {{ translateStatus(t.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button @click="showDetail(t)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Lihat Detail">
                    👁️
                  </button>
                  <button @click="printInvoice(t)" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Cetak Invoice">
                    🖨️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredTransactions.length > 0" class="bg-gray-50 border-t">
            <tr>
              <td colspan="4" class="px-6 py-3 text-right font-bold text-gray-700">Total Periode Ini:</td>
              <td class="px-6 py-3 text-right font-bold text-blue-700">Rp {{ totalAmountFiltered.toLocaleString('id-ID') }}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Halaman <span class="font-bold">{{ currentPage }}</span> dari <span class="font-bold">{{ totalPages }}</span>
        </div>
        <div class="flex gap-1">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 bg-white border rounded text-xs font-bold disabled:opacity-50"
          >
            Prev
          </button>
          <button 
            v-for="p in totalPages" :key="p"
            @click="currentPage = p"
            :class="currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'"
            class="w-8 h-8 border rounded text-xs font-bold transition flex items-center justify-center"
          >
            {{ p }}
          </button>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 bg-white border rounded text-xs font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedTransaction" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div class="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 class="text-xl font-bold text-blue-900">Detail Transaksi</h3>
            <p class="text-xs text-gray-500">{{ selectedTransaction.invoice_number }}</p>
          </div>
          <button @click="selectedTransaction = null" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div class="space-y-4 mb-6">
           <div class="flex justify-between text-sm">
             <span class="text-gray-500">Pelanggan:</span>
             <span class="font-bold text-gray-900">{{ selectedTransaction.customer_name || '-' }}</span>
           </div>
           <div class="flex justify-between text-sm">
             <span class="text-gray-500">Metode Pembayaran:</span>
             <span class="font-bold text-blue-600 uppercase">{{ selectedTransaction.payment_type }}</span>
           </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-60 overflow-y-auto">
          <table class="w-full text-xs text-left">
            <thead class="text-gray-400 uppercase font-bold border-b">
              <tr>
                <th class="pb-2">Barang</th>
                <th class="pb-2 text-center">Qty</th>
                <th class="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in selectedTransaction.details" :key="item.id">
                <td class="py-3 font-medium text-gray-800">{{ item.item_name }}</td>
                <td class="py-3 text-center text-gray-600">{{ item.quantity }}</td>
                <td class="py-3 text-right font-bold text-gray-900">Rp {{ parseFloat(item.subtotal).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 pt-4 border-t flex justify-between items-center">
          <div class="text-right flex-1">
             <p class="text-xs text-gray-500 uppercase font-bold">Total Akhir</p>
             <p class="text-xl font-black text-blue-700">Rp {{ parseFloat(selectedTransaction.total_amount).toLocaleString('id-ID') }}</p>
          </div>
          <div class="ml-6 flex gap-2">
            <button @click="printInvoice(selectedTransaction)" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition flex items-center gap-2">
              <span>🖨️</span> Cetak
            </button>
            <button @click="selectedTransaction = null" class="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700 transition">Tutup</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Proof Preview Modal -->
    <div v-if="showProofModal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in duration-200" @click.self="showProofModal = false">
      <div class="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800 text-sm">Pratinjau Bukti Transfer</h3>
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
const selectedTransaction = ref(null)
const showProofModal = ref(false)
const selectedProofUrl = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const filterStatus = ref('')

const printInvoice = (transaction, shouldPrint = true) => {
  generateInvoicePDF(transaction, shouldPrint)
}

const openProofModal = (url) => {
  selectedProofUrl.value = url
  showProofModal.value = true
}
const filterPayment = ref('')
// Default to current date
const filterMonth = ref(new Date().getMonth())
const filterYear = ref(new Date().getFullYear())

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const list = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    list.push(i)
  }
  return list
})

const authStore = useAuthStore()

const fetchTransactions = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    transactions.value = response.data
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    loading.value = false
  }
}

const showDetail = (t) => {
  selectedTransaction.value = t
}

const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    const date = new Date(t.createdAt)
    const matchesMonth = date.getMonth() === filterMonth.value
    const matchesYear = date.getFullYear() === filterYear.value
    const matchesStatus = filterStatus.value ? t.status === filterStatus.value : true
    const matchesPayment = filterPayment.value ? t.payment_type === filterPayment.value : true
    
    return matchesMonth && matchesYear && matchesStatus && matchesPayment
  })
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage.value))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const totalAmountFiltered = computed(() => {
  return filteredTransactions.value.reduce((sum, t) => sum + parseFloat(t.total_amount), 0)
})

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
