<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Daftar Pembelian / Restock</h2>
      <router-link v-if="authStore.isAdminPurchase" to="/purchase/input" class="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition shadow-lg">
        + Ajukan Pembelian
      </router-link>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Supplier</th>
              <th class="px-6 py-3">Total</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="6" class="px-6 py-4">Memuat data...</td>
            </tr>
            <tr v-else-if="purchases.length === 0" class="text-center">
              <td colspan="6" class="px-6 py-4 text-gray-400">Belum ada data pembelian</td>
            </tr>
            <tr v-else v-for="p in paginatedPurchases" :key="p.id" class="border-b last:border-0 hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-gray-600 font-medium">{{ new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
              <td class="px-6 py-4 font-bold text-gray-900 text-xs">{{ p.invoice_number }}</td>
              <td class="px-6 py-4 text-gray-600">{{ p.supplier_name }}</td>
              <td class="px-6 py-4 font-bold text-brand-navy">Rp {{ parseFloat(p.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(p.status)">
                  {{ formatStatus(p.status) }}
                </span>
                <p v-if="p.status === 'rejected'" class="text-xs text-red-500 mt-1 italic">{{ p.rejection_reason }}</p>
              </td>
              <td class="px-6 py-4 flex flex-wrap gap-2">
                 <!-- Proof Btn -->
                <button v-if="p.proof_image" @click="viewProof(p.proof_image)" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 font-bold">
                    📄 Bukti
                </button>
                <button v-if="p.status === 'completed'" @click="viewDisbursementDetails(p)" class="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 font-bold border border-green-200">
                    ℹ️ Pencairan
                </button>
                <button @click="viewPurchaseDetails(p)" class="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold border border-blue-200">
                    👁️ Detail
                </button>

                <!-- Action Buttons based on Role and Status -->
                <!-- Admin GM Approval -->
                <template v-if="authStore.isAdminGM && p.status === 'pending_admin_gm'">
                    <button @click="approveAdminGm(p.id)" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold">
                        ✅ ACC (Admin GM)
                    </button>
                    <button @click="reject(p.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">
                        ❌ Tolak
                    </button>
                </template>

                <!-- GM Approval -->
                <template v-if="authStore.isGM && p.status === 'pending_gm'">
                    <button @click="approveGm(p.id)" class="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold">
                        ✅ ACC (GM)
                    </button>
                    <button @click="reject(p.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">
                        ❌ Tolak
                    </button>
                </template>

                 <!-- Finance Processing -->
                <template v-if="authStore.isFinance && p.status === 'approved_gm'">
                    <button @click="processFinance(p.id)" class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">
                        💰 Cairkan Dana
                    </button>
                    <button @click="reject(p.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">
                        ❌ Tolak
                    </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
       <!-- Pagination Controls -->
       <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
         <!-- Simplified pagination for brevity -->
         <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 rounded bg-white border text-xs">Prev</button>
         <span class="text-xs text-gray-500">Page {{ currentPage }} of {{ totalPages }}</span>
         <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 rounded bg-white border text-xs">Next</button>
      </div>
    </div>

    <!-- View Cash Flow / Disbursement Details Modal -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn relative">
            <button @click="showDetailModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h3 class="text-xl font-bold text-brand-navy mb-4">Detail Pencairan Dana</h3>
            
            <div class="space-y-4 text-sm" v-if="selectedPurchase">
                <div class="grid grid-cols-2 gap-2 border-b pb-2">
                    <span class="text-gray-500">No. Invoice</span>
                    <span class="font-bold text-right">{{ selectedPurchase.invoice_number }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 border-b pb-2">
                    <span class="text-gray-500">Total Pencairan</span>
                    <span class="font-bold text-right text-brand-green">Rp {{ parseFloat(selectedPurchase.total_amount).toLocaleString('id-ID') }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 border-b pb-2">
                    <span class="text-gray-500">Tanggal Cair</span>
                    <span class="font-bold text-right">{{ new Date(selectedPurchase.completed_at).toLocaleDateString('id-ID') }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 border-b pb-2">
                    <span class="text-gray-500">Metode Bayar</span>
                    <span class="font-bold text-right uppercase">{{ selectedPurchase.payment_method }}</span>
                </div>

                <!-- Cash Details -->
                <div v-if="selectedPurchase.payment_method === 'cash'" class="grid grid-cols-2 gap-2 border-b pb-2">
                    <span class="text-gray-500">Sumber Dana</span>
                    <span class="font-bold text-right uppercase bg-yellow-100 px-2 rounded">{{ selectedPurchase.fund_source?.replace('_', ' ') }}</span>
                </div>

                <!-- Transfer Details -->
                <template v-if="selectedPurchase.payment_method === 'transfer'">
                    <div class="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-xs">Bank</span>
                            <span class="font-bold">{{ selectedPurchase.bank_name }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-xs">Penerima</span>
                            <span class="font-bold">{{ selectedPurchase.account_holder_name }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-xs">Ref No.</span>
                            <span class="font-mono font-bold">{{ selectedPurchase.transfer_reference_number }}</span>
                        </div>
                        <div v-if="selectedPurchase.transfer_proof_image" class="mt-2 pt-2 border-t border-blue-100 text-center">
                            <button @click="viewProof(selectedPurchase.transfer_proof_image)" class="text-blue-600 text-xs font-bold hover:underline">
                                🖼️ Lihat Bukti Transfer
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>

    <!-- Disbursement Modal -->
    <div v-if="showDisburseModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <h3 class="text-xl font-bold text-brand-navy mb-4">Pencairan Dana Restock</h3>
            <form @submit.prevent="submitDisbursement">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Tanggal Pencairan</label>
                        <input v-model="disburseForm.completed_at" type="date" class="w-full border-gray-200 border p-2 rounded-lg" required />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Metode Pembayaran</label>
                        <select v-model="disburseForm.payment_method" class="w-full border-gray-200 border p-2 rounded-lg" required>
                            <option value="cash">Tunai (Cash)</option>
                            <option value="transfer">Transfer Bank</option>
                        </select>
                    </div>

                    <div v-if="disburseForm.payment_method === 'cash'" class="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                         <label class="block text-sm font-semibold text-gray-700 mb-1">Sumber Dana</label>
                        <div class="flex gap-4 mt-2">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="disburseForm.fund_source" value="kas_kecil" required />
                                <span class="text-sm">Kas Kecil</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="disburseForm.fund_source" value="dana_yayasan" required />
                                <span class="text-sm">Dana Yayasan</span>
                            </label>
                        </div>
                    </div>

                    <div v-if="disburseForm.payment_method === 'transfer'" class="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Bank</label>
                            <input v-model="disburseForm.bank_name" type="text" placeholder="Contoh: BCA, Mandiri" class="w-full border-gray-200 border p-2 rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">No. Referensi / Ref No.</label>
                            <input v-model="disburseForm.transfer_reference_number" type="text" class="w-full border-gray-200 border p-2 rounded-lg text-sm" required />
                        </div>
                         <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Atas Nama (Penerima)</label>
                            <input v-model="disburseForm.account_holder_name" type="text" class="w-full border-gray-200 border p-2 rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Bukti Transfer</label>
                            <input type="file" @change="e => disburseForm.transfer_proof = e.target.files[0]" class="w-full text-xs text-gray-500" required />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-8">
                    <button type="button" @click="showDisburseModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-brand-green text-white hover:bg-green-600 rounded-lg font-bold">
                        Simpan & Cairkan
                    </button>
                </div>
            </form>
        </div>
    </div>
  </div>

      <!-- View Purchase Item Details Modal -->
    <div v-if="showPurchaseDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-fadeIn relative max-h-[90vh] overflow-y-auto">
            <button @click="showPurchaseDetailModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            <h3 class="text-xl font-bold text-brand-navy mb-4 border-b pb-2">Detail Pembelian: {{ selectedPurchase?.invoice_number }}</h3>
            
            <div class="space-y-4" v-if="selectedPurchase">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                        <p class="text-gray-500 font-medium">Tanggal</p>
                        <p class="font-bold">{{ new Date(selectedPurchase.createdAt).toLocaleDateString('id-ID') }}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 font-medium">Dibuat Oleh</p>
                        <p class="font-bold">{{ selectedPurchase.creator?.full_name || 'System' }}</p>
                    </div>
                     <div>
                        <p class="text-gray-500 font-medium">Status</p>
                        <span :class="getStatusClass(selectedPurchase.status)" class="inline-block mt-1">{{ formatStatus(selectedPurchase.status) }}</span>
                    </div>
                    <div>
                         <p class="text-gray-500 font-medium">Total</p>
                         <p class="font-bold text-brand-green">Rp {{ parseFloat(selectedPurchase.total_amount).toLocaleString('id-ID') }}</p>
                    </div>
                </div>

                <div v-if="selectedPurchase.details && selectedPurchase.details.length > 0">
                    <h4 class="font-bold text-gray-700 mb-2">Item Barang</h4>
                    <div class="overflow-x-auto border rounded-lg">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-gray-100 text-xs uppercase text-gray-600 font-bold">
                                <tr>
                                    <th class="px-4 py-2">Produk</th>
                                    <th class="px-4 py-2 text-center">Qty</th>
                                    <th class="px-4 py-2 text-right">Harga Beli</th>
                                    <th class="px-4 py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                <tr v-for="item in selectedPurchase.details" :key="item.id">
                                    <td class="px-4 py-2 font-medium">{{ item.product?.name || 'Produk Dihapus' }}</td>
                                    <td class="px-4 py-2 text-center">{{ item.quantity }}</td>
                                    <td class="px-4 py-2 text-right">Rp {{ parseFloat(item.buy_price).toLocaleString('id-ID') }}</td>
                                    <td class="px-4 py-2 text-right font-bold">Rp {{ parseFloat(item.subtotal).toLocaleString('id-ID') }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div v-else class="text-center py-4 text-gray-500 italic bg-gray-50 rounded">
                    Tidak ada detil item.
                </div>
                
                 <!-- Approval History (Mockup based on timestamps) -->
                <div class="mt-4 border-t pt-4">
                     <h4 class="font-bold text-gray-700 mb-2">Riwayat Proses</h4>
                     <ul class="text-sm space-y-2">
                        <li class="flex items-center gap-2">
                            <span class="text-green-500">✔</span> 
                            <span class="text-gray-600">Diajukan: {{ new Date(selectedPurchase.createdAt).toLocaleString('id-ID') }} </span>
                        </li>
                        <li v-if="selectedPurchase.approved_admin_gm_at" class="flex items-center gap-2">
                            <span class="text-green-500">✔</span> 
                            <span class="text-gray-600">ACC Admin GM: {{ new Date(selectedPurchase.approved_admin_gm_at).toLocaleString('id-ID') }}</span>
                        </li>
                        <li v-if="selectedPurchase.approved_gm_at" class="flex items-center gap-2">
                            <span class="text-green-500">✔</span> 
                            <span class="text-gray-600">ACC GM: {{ new Date(selectedPurchase.approved_gm_at).toLocaleString('id-ID') }}</span>
                        </li>
                         <li v-if="selectedPurchase.completed_at" class="flex items-center gap-2">
                            <span class="text-green-500">✔</span> 
                            <span class="text-gray-600">Dicairkan Keuangan: {{ new Date(selectedPurchase.completed_at).toLocaleString('id-ID') }}</span>
                        </li>
                         <li v-if="selectedPurchase.status === 'rejected'" class="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                            <span>❌</span> 
                            <span>Ditolak. Alasan: {{ selectedPurchase.rejection_reason }}</span>
                        </li>
                     </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const purchases = ref([])
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Disburse Modal State
const showDisburseModal = ref(false)
const selectedPurchaseId = ref(null)
const disburseForm = ref({
    payment_method: 'cash',
    fund_source: '',
    bank_name: '',
    transfer_reference_number: '',
    account_holder_name: '',
    completed_at: new Date().toISOString().split('T')[0],
    transfer_proof: null
})

// Detail Disburse Modal State
const showDetailModal = ref(false)
const selectedPurchase = ref(null)

// Detail Purchase Modal State
const showPurchaseDetailModal = ref(false)

const fetchPurchases = async () => {
    loading.value = true
    try {
        const response = await axios.get('http://localhost:5000/api/purchases', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        purchases.value = response.data
    } catch (error) {
        console.error("Error fetching purchases", error)
    } finally {
        loading.value = false
    }
}

const getStatusClass = (status) => {
    switch(status) {
        case 'completed': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold';
        case 'rejected': return 'bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold';
        case 'pending_admin_gm': return 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold';
        case 'pending_gm': return 'bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold';
        case 'approved_gm': return 'bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold';
        default: return 'bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold';
    }
}

const formatStatus = (status) => {
    switch(status) {
        case 'pending_admin_gm': return 'Menunggu Admin GM'
        case 'pending_gm': return 'Menunggu GM'
        case 'approved_gm': return 'Menunggu Pencairan (Keuangan)'
        case 'completed': return 'Selesai'
        case 'rejected': return 'Ditolak'
        default: return status
    }
}

const viewProof = (path) => {
    window.open(`http://localhost:5000/${path}`, '_blank')
}

// Actions
const approveAdminGm = async (id) => {
    if(!confirm('Setujui dan teruskan ke GM?')) return
    try {
        await axios.put(`http://localhost:5000/api/purchases/${id}/approve-admin-gm`, {}, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchPurchases()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const approveGm = async (id) => {
    if(!confirm('Setujui pembelian ini?')) return
    try {
        await axios.put(`http://localhost:5000/api/purchases/${id}/approve-gm`, {}, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchPurchases()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const processFinance = (id) => {
    selectedPurchaseId.value = id
    // Reset form
    disburseForm.value = {
        payment_method: 'cash',
        fund_source: '',
        bank_name: '',
        transfer_reference_number: '',
        account_holder_name: '',
        completed_at: new Date().toISOString().split('T')[0],
        transfer_proof: null
    }
    showDisburseModal.value = true
}

const submitDisbursement = async () => {
    try {
        const formData = new FormData()
        formData.append('payment_method', disburseForm.value.payment_method)
        formData.append('completed_at', disburseForm.value.completed_at)

        if (disburseForm.value.payment_method === 'cash') {
             formData.append('fund_source', disburseForm.value.fund_source)
        } else {
             formData.append('bank_name', disburseForm.value.bank_name)
             formData.append('transfer_reference_number', disburseForm.value.transfer_reference_number)
             formData.append('account_holder_name', disburseForm.value.account_holder_name)
             if (disburseForm.value.transfer_proof) {
                 formData.append('proof', disburseForm.value.transfer_proof) // 'proof' matches upload middleware
             }
        }

        await axios.post(`http://localhost:5000/api/purchases/${selectedPurchaseId.value}/process-finance`, formData, {
            headers: { 
                'Authorization': `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        })

        alert('Berhasil dicairkan!')
        showDisburseModal.value = false
        fetchPurchases()
    } catch(e) {
        console.error('Submit Disbursement Error:', e) 
        const serverMsg = e.response?.data?.message || e.message || 'Unknown Error';
        const errorDetails = e.response?.data?.error ? `\nDetails: ${e.response.data.error}` : '';
        alert(`Gagal: ${serverMsg}${errorDetails}`) 
    }
}

const reject = async (id) => {
    const reason = prompt('Masukkan alasan penolakan:')
    if(!reason) return
    try {
        await axios.put(`http://localhost:5000/api/purchases/${id}/reject`, { reason }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchPurchases()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const viewDisbursementDetails = (purchase) => {
    selectedPurchase.value = purchase
    showDetailModal.value = true
}

const viewPurchaseDetails = (purchase) => {
    selectedPurchase.value = purchase
    showPurchaseDetailModal.value = true
}

onMounted(fetchPurchases)

const totalPages = computed(() => Math.ceil(purchases.value.length / itemsPerPage))
const paginatedPurchases = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return purchases.value.slice(start, start + itemsPerPage)
})
</script>
