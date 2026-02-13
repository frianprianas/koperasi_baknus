<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">Semua Transaksi (Konsolidasi)</h2>
      <div class="flex flex-wrap gap-2">
        <!-- Search Bar -->
        <div class="relative min-w-[200px]">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari invoice/nama..." 
            class="pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none w-full"
          />
        </div>

        <!-- Category Filter -->
        <select v-model="filterType" class="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option value="">Semua Kategori</option>
          <option value="PENJUALAN">Penjualan (Sales)</option>
          <option value="PEMBELIAN">Pembelian (Restock)</option>
          <option value="ANGKUTAN">Biaya Angkutan</option>
        </select>
        
        <!-- Status Filter -->
        <select v-model="filterStatus" class="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu ACC</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="completed">Selesai</option>
        </select>

        <!-- Month Filter -->
        <select v-model="filterMonth" class="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
          <option v-for="(m, index) in months" :key="index" :value="index">
            {{ m }}
          </option>
        </select>

        <!-- Year Filter -->
        <select v-model="filterYear" class="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
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
              <th class="px-6 py-3">Kategori</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Pihak Terkait</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3">Bayar via</th>
               <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="8" class="px-6 py-12">
                <div class="inline-block animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                <p class="text-gray-400 font-medium">Memproses data...</p>
              </td>
            </tr>
            <tr v-else-if="filteredTransactions.length === 0" class="text-center">
              <td colspan="8" class="px-6 py-12 text-gray-400">Belum ada data transaksi untuk filter ini</td>
            </tr>
            <tr v-else v-for="t in paginatedTransactions" :key="t.uid" class="border-b last:border-0 hover:bg-gray-50 transition text-xs sm:text-sm">
              <td class="px-6 py-4 text-gray-600 font-medium">
                {{ new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}
              </td>
              <td class="px-6 py-4">
                <span :class="getTypeClass(t.type)" class="px-2 py-0.5 text-[10px] font-extrabold rounded">
                   {{ t.type }}
                </span>
              </td>
              <td class="px-6 py-4 font-bold text-gray-900">{{ t.invoice_number }}</td>
              <td class="px-6 py-4">
                <p class="text-gray-800 font-bold leading-tight">{{ t.entity_name }}</p>
                <p class="text-[10px] text-gray-400 uppercase font-medium">Oleh: {{ t.creator_name }}</p>
              </td>
              <td class="px-6 py-4 font-bold text-right" :class="t.type === 'PENJUALAN' ? 'text-emerald-600' : 'text-rose-600'">
                {{ t.type === 'PENJUALAN' ? '+' : '-' }}Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-gray-100 text-gray-600 border border-gray-200">
                  {{ t.payment_method || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="getStatusClass(t.status)">
                  {{ translateStatus(t.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button @click="showDetail(t)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Lihat Detail">
                    👁️
                  </button>
                  <button v-if="t.type === 'PENJUALAN'" @click="printInvoice(t)" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Cetak Invoice">
                    🖨️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredTransactions.length > 0" class="bg-gray-50 border-t">
            <tr>
              <td colspan="4" class="px-6 py-3 text-right font-bold text-gray-700">Net Flow Periode Ini:</td>
              <td class="px-6 py-3 text-right font-black":class="netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                 Rp {{ netFlow.toLocaleString('id-ID') }}
              </td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Showing <span class="font-bold">{{ (currentPage-1)*itemsPerPage+1 }}</span> - <span class="font-bold">{{ Math.min(currentPage*itemsPerPage, filteredTransactions.length) }}</span> of <span class="font-bold">{{ filteredTransactions.length }}</span> data
        </div>
        <div class="flex gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 bg-white border rounded-lg text-xs font-bold disabled:opacity-50">Prev</button>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 bg-white border rounded-lg text-xs font-bold disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedData" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" @click.stop>
        <div class="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-extrabold text-blue-900 leading-tight">Detail Transaksi</h3>
            <p class="text-xs text-gray-500 uppercase font-bold tracking-wider">{{ selectedData.type }} - {{ selectedData.invoice_number }}</p>
          </div>
          <button @click="selectedData = null" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>
        
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Pihak Terkait</p>
              <p class="font-bold text-gray-900">{{ selectedData.entity_name }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Dibuat Oleh</p>
              <p class="font-bold text-gray-900">{{ selectedData.creator_name }}</p>
            </div>
          </div>

          <div v-if="selectedData.details && selectedData.details.length > 0" class="border rounded-xl overflow-hidden">
             <table class="w-full text-xs">
                <thead class="bg-blue-50 text-blue-800 font-bold">
                   <tr>
                      <th class="px-4 py-2 text-left">Deskripsi</th>
                      <th class="px-4 py-2 text-center">Qty</th>
                      <th class="px-4 py-2 text-right">Subtotal</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                   <tr v-for="(d, i) in selectedData.details" :key="i">
                      <td class="px-4 py-2">{{ d.item_name || d.product?.name || 'Barang' }}</td>
                      <td class="px-4 py-2 text-center">{{ d.quantity }}</td>
                      <td class="px-4 py-2 text-right font-bold">Rp {{ parseFloat(d.subtotal).toLocaleString('id-ID') }}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          <div class="p-6 bg-blue-900 rounded-2xl text-white flex justify-between items-center shadow-lg">
             <div>
                <p class="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Total Transaksi</p>
                <p class="text-2xl font-black">Rp {{ parseFloat(selectedData.total_amount).toLocaleString('id-ID') }}</p>
             </div>
             <div class="text-right">
                <p class="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Metode Bayar</p>
                <p class="text-lg font-bold uppercase">{{ selectedData.payment_method }}</p>
             </div>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button v-if="selectedData.proof" @click="openProofModal(selectedData.proof)" class="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition">📎 Lihat Bukti</button>
          <button @click="selectedData = null" class="px-8 py-2 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Proof Modal -->
    <div v-if="showProofModal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200" @click.self="showProofModal = false">
      <div class="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800">Bukti Pembayaran / Dokumen</h3>
          <button @click="showProofModal = false" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        <div class="p-2 bg-gray-100 flex justify-center h-[70vh]">
          <template v-if="selectedProofUrl.toLowerCase().endsWith('.pdf')">
            <iframe :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="w-full h-full rounded-lg" frameborder="0"></iframe>
          </template>
          <template v-else>
            <img :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="h-full object-contain shadow-lg rounded-lg" alt="Bukti Pembayaran" />
          </template>
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

const authStore = useAuthStore()
const allData = ref([])
const loading = ref(true)
const selectedData = ref(null)
const showProofModal = ref(false)
const selectedProofUrl = ref('')
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterMonth = ref(new Date().getMonth())
const filterYear = ref(new Date().getFullYear())
const currentPage = ref(1)
const itemsPerPage = ref(15)

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const list = []
  for (let i = currentYear; i >= currentYear - 3; i--) list.push(i)
  return list
})

const fetchAll = async () => {
    loading.value = true
    try {
        const headers = { Authorization: `Bearer ${authStore.token}` }
        const [salesRes, purRes, trpRes] = await Promise.all([
            axios.get('http://localhost:5000/api/transactions', { headers }),
            axios.get('http://localhost:5000/api/purchases', { headers }),
            axios.get('http://localhost:5000/api/transport', { headers })
        ])

        // Transform Sales
        const sales = salesRes.data.map(s => ({
            ...s,
            uid: `SALE-${s.id}`,
            type: 'PENJUALAN',
            date: s.createdAt,
            entity_name: s.customer_name || 'Umum',
            creator_name: s.sales_admin?.username || '-',
            payment_method: s.payment_type,
            proof: s.proof_of_payment
        }))

        // Transform Purchases
        const purchases = purRes.data.map(p => ({
            ...p,
            uid: `PUR-${p.id}`,
            type: 'PEMBELIAN',
            date: p.completed_at || p.createdAt,
            entity_name: p.supplier_name || 'Supplier',
            creator_name: p.creator?.username || '-',
            payment_method: p.payment_method || 'PENDING',
            proof: p.transfer_proof_image || p.proof_image
        }))

        // Transform Transport
        const transport = trpRes.data.map(t => ({
            ...t,
            uid: `TRP-${t.id}`,
            type: 'ANGKUTAN',
            date: t.completed_at || t.createdAt,
            entity_name: t.driver_name || 'Driver',
            creator_name: t.creator?.username || '-',
            payment_method: t.payment_method || 'PENDING',
            proof: t.transfer_proof_image || t.receipt_image
        }))

        allData.value = [...sales, ...purchases, ...transport].sort((a,b) => new Date(b.date) - new Date(a.date))
    } catch (e) {
        console.error("Consolidation error", e)
    } finally {
        loading.value = false
    }
}

const filteredTransactions = computed(() => {
  return allData.value.filter(t => {
    const date = new Date(t.date)
    const matchesMonth = date.getMonth() === filterMonth.value
    const matchesYear = date.getFullYear() === filterYear.value
    const matchesType = filterType.value ? t.type === filterType.value : true
    const matchesStatus = filterStatus.value ? t.status === filterStatus.value : true
    
    // Search
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q || 
      t.invoice_number?.toLowerCase().includes(q) || 
      t.entity_name?.toLowerCase().includes(q) ||
      t.creator_name?.toLowerCase().includes(q)

    return matchesMonth && matchesYear && matchesType && matchesStatus && matchesSearch
  })
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredTransactions.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage.value))

const netFlow = computed(() => {
    return filteredTransactions.value.reduce((sum, t) => {
        const amt = parseFloat(t.total_amount || 0)
        return t.type === 'PENJUALAN' ? sum + amt : sum - amt
    }, 0)
})

const getTypeClass = (type) => {
    if (type === 'PENJUALAN') return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    if (type === 'PEMBELIAN') return 'bg-rose-50 text-rose-700 border border-rose-100'
    return 'bg-amber-50 text-amber-700 border border-amber-100'
}

const getStatusClass = (status) => {
  switch (status) {
    case 'completed': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-green-100 text-green-700'
    case 'pending': 
    case 'pending_admin_gm':
    case 'pending_gm': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-amber-100 text-amber-700'
    case 'rejected': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-red-100 text-red-700'
    case 'approved': 
    case 'approved_gm': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-blue-100 text-blue-700'
    default: return 'px-2 py-1 text-[10px] font-extrabold rounded bg-gray-100 text-gray-700'
  }
}

const translateStatus = (status) => {
  if (status?.startsWith('pending')) return 'PROSES'
  if (status?.startsWith('approved')) return 'DISETUJUI'
  if (status === 'completed') return 'SELESAI'
  if (status === 'rejected') return 'DITOLAK'
  return status
}

const showDetail = (t) => { selectedData.value = t }

const openProofModal = (url) => {
    selectedProofUrl.value = url
    showProofModal.value = true
}

const printInvoice = (t) => { generateInvoicePDF(t, true) }

onMounted(fetchAll)
</script>
