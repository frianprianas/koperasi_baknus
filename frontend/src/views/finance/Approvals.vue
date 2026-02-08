<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800">Antrian Persetujuan Keuangan</h2>
    
    <div v-if="loading" class="text-center py-10 text-gray-500">Memuat data...</div>
    
    <div v-else-if="transactions.length === 0" class="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
      <div class="text-5xl mb-4">✨</div>
      <h3 class="text-lg font-medium text-gray-900">Semua Cleared!</h3>
      <p class="text-gray-500 mt-1">Tidak ada transaksi yang perlu disetujui saat ini.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div v-for="tx in transactions" :key="tx.id" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col md:flex-row">
        <div class="w-2 bg-yellow-400 md:h-auto h-2"></div>
        
        <div class="p-6 flex-1">
          <div class="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">INVOICE</span>
                <span class="text-sm font-medium text-gray-500">{{ new Date(tx.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900">{{ tx.invoice_number }}</h3>
              <p class="text-gray-600">Pelanggan: <span class="font-medium">{{ tx.customer_name || 'Tamu' }}</span></p>
            </div>
            
            <div class="text-left md:text-right">
              <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Tagihan</p>
              <p class="text-2xl font-bold text-blue-600">Rp {{ parseFloat(tx.total_amount).toLocaleString('id-ID') }}</p>
              <span :class="{'bg-green-100 text-green-700': tx.payment_type === 'cash', 'bg-blue-100 text-blue-700': tx.payment_type === 'transfer', 'bg-purple-100 text-purple-700': tx.payment_type === 'piutang' }" class="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded uppercase">
                {{ tx.payment_type }}
              </span>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
            <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Rincian Barang</h4>
            <ul class="space-y-1">
              <li v-for="item in tx.details" :key="item.id" class="flex justify-between text-sm">
                <span class="text-gray-700">{{ item.item_name }} <span class="text-gray-400">x{{ item.quantity }}</span></span>
                <span class="font-medium text-gray-900">Rp {{ parseFloat(item.subtotal).toLocaleString('id-ID') }}</span>
              </li>
            </ul>
          </div>
          
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
             <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">Sales: <span class="font-medium text-gray-800">{{ tx.sales_admin?.username || '-' }}</span></span>
                <span v-if="tx.proof_of_payment" class="text-gray-300">|</span>
                <button v-if="tx.proof_of_payment" @click="openProofModal(tx.proof_of_payment)" class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition">
                    <span class="text-xs">📎</span> Lihat Bukti
                </button>
             </div>

             <div class="flex gap-3 w-full sm:w-auto">
                <button @click="promptReject(tx.id)" class="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition">
                  Tolak
                </button>
                <button @click="confirmApprove(tx.id)" class="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm hover:shadow rounded-lg transition flex items-center justify-center gap-2">
                  <span>✓</span> Setujui
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Proof Modal -->
    <div v-if="showProofModal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200" @click.self="showProofModal = false">
      <div class="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800">Bukti Transfer / Pembayaran</h3>
          <button @click="showProofModal = false" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div class="p-2 bg-gray-100 flex justify-center">
          <template v-if="selectedProofUrl.toLowerCase().endsWith('.pdf')">
            <iframe :src="`http://localhost:5000/${selectedProofUrl.replace(/\\/g, '/')}`" class="w-full h-[70vh] rounded-lg" frameborder="0"></iframe>
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
    const response = await axios.get('http://localhost:5000/api/transactions?status=pending', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    transactions.value = response.data.filter(t => t.status === 'pending')
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    loading.value = false
  }
}

const handleAction = async (id, status, reason = null) => {
  try {
    await axios.put(`http://localhost:5000/api/transactions/${id}/approve`, {
      status,
      rejection_reason: reason,
      approved_by: authStore.user.id
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    transactions.value = transactions.value.filter(t => t.id !== id)
    alert(`Transaksi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`)
  } catch (error) {
    console.error('Error updating transaction:', error)
    alert('Gagal memperbarui transaksi.')
  }
}

const promptReject = (id) => {
  const reason = prompt('Masukkan alasan penolakan:')
  if (reason) {
    handleAction(id, 'rejected', reason)
  }
}

const confirmApprove = (id) => {
  if (confirm('Apakah Anda yakin ingin menyetujui transaksi ini?')) {
    handleAction(id, 'approved')
  }
}

onMounted(fetchTransactions)
</script>
