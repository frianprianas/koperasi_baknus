<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Biaya Angkutan & Perbaikan</h2>
      <button v-if="authStore.isAdminPurchase" @click="showCreateModal = true" class="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition shadow-lg flex items-center gap-2">
        <span>+</span> Ajukan Biaya
      </button>
    </div>

    <!-- Stats Summary for Finance/GM? Maybe later -->

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Driver / Plat</th>
              <th class="px-6 py-3 text-right">Ongkos</th>
              <th class="px-6 py-3 text-right">Bensin</th>
              <th class="px-6 py-3 text-right">Perbaikan</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="9" class="px-6 py-4">Memuat data...</td>
            </tr>
            <tr v-else-if="requests.length === 0" class="text-center">
              <td colspan="9" class="px-6 py-4 text-gray-400">Belum ada pengajuan</td>
            </tr>
             <tr v-else v-for="r in paginatedRequests" :key="r.id" class="border-b last:border-0 hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-gray-600">{{ new Date(r.createdAt).toLocaleDateString('id-ID') }}</td>
                <td class="px-6 py-4 font-bold text-xs">{{ r.invoice_number }}</td>
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">{{ r.driver_name || '-' }}</div>
                    <div class="text-xs text-gray-500">{{ r.vehicle_plate || '-' }}</div>
                </td>
                <td class="px-6 py-4 text-right">Rp {{ parseFloat(r.labor_cost).toLocaleString('id-ID') }}</td>
                <td class="px-6 py-4 text-right">Rp {{ parseFloat(r.fuel_cost).toLocaleString('id-ID') }}</td>
                <td class="px-6 py-4 text-right">
                    <div>Rp {{ parseFloat(r.maintenance_cost).toLocaleString('id-ID') }}</div>
                    <div v-if="r.maintenance_description" class="text-[10px] text-gray-500 italic truncate max-w-[100px]">{{ r.maintenance_description }}</div>
                </td>
                <td class="px-6 py-4 text-right font-bold text-brand-green">Rp {{ parseFloat(r.total_amount).toLocaleString('id-ID') }}</td>
                <td class="px-6 py-4 text-center">
                    <span :class="getStatusClass(r.status)">{{ formatStatus(r.status) }}</span>
                     <p v-if="r.status === 'rejected'" class="text-xs text-red-500 mt-1 italic">{{ r.rejection_reason }}</p>
                </td>
                <td class="px-6 py-4 flex flex-wrap gap-2">
                    <!-- Receipt Proof -->
                    <button v-if="r.receipt_image" @click="viewProof(r.receipt_image)" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 font-bold border border-gray-300">
                        📄 Nota
                    </button>
                    <!-- Transfer Proof -->
                    <button v-if="r.transfer_proof_image" @click="viewProof(r.transfer_proof_image)" class="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 font-bold border border-green-200">
                        💸 Bukti TF
                    </button>

                    <!-- Actions based on Role -->
                    <!-- Admin GM -->
                    <template v-if="authStore.isAdminGM && r.status === 'pending_admin_gm'">
                         <button @click="approveAdminGm(r.id)" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold">✅ ACC</button>
                         <button @click="reject(r.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">❌ Tolak</button>
                    </template>

                    <!-- GM -->
                    <template v-if="authStore.isGM && r.status === 'pending_gm'">
                         <button @click="approveGm(r.id)" class="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold">✅ ACC</button>
                         <button @click="reject(r.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">❌ Tolak</button>
                    </template>

                    <!-- Finance -->
                    <template v-if="authStore.isFinance && r.status === 'approved_gm'">
                         <button @click="processFinance(r.id)" class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">💰 Cairkan</button>
                         <button @click="reject(r.id)" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">❌ Tolak</button>
                    </template>
                </td>
             </tr>
          </tbody>
        </table>
      </div>
       <!-- Pagination Controls -->
       <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
         <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 rounded bg-white border text-xs">Prev</button>
         <span class="text-xs text-gray-500">Page {{ currentPage }} of {{ totalPages }}</span>
         <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 rounded bg-white border text-xs">Next</button>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-brand-navy mb-4">Pengajuan Biaya Angkutan</h3>
            <form @submit.prevent="createRequest">
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Nama Driver</label>
                            <input v-model="form.driver_name" type="text" class="w-full border p-2 rounded-lg" placeholder="Opsional" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Plat Nomor</label>
                            <input v-model="form.vehicle_plate" type="text" class="w-full border p-2 rounded-lg" placeholder="Contoh: D 1234 ABC" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Ongkos Supir</label>
                            <input v-model="form.labor_cost" type="number" class="w-full border p-2 rounded-lg" required />
                        </div>
                        <div>
                             <label class="block text-sm font-semibold text-gray-700 mb-1">Bensin</label>
                            <input v-model="form.fuel_cost" type="number" class="w-full border p-2 rounded-lg" required />
                        </div>
                    </div>

                    <div class="border-t pt-4">
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Biaya Perbaikan / Sparepart</label>
                         <div class="grid grid-cols-3 gap-4">
                             <div class="col-span-2">
                                <input v-model="form.maintenance_description" type="text" class="w-full border p-2 rounded-lg text-sm" placeholder="Keterangan (co: Ganti Oli)" />
                             </div>
                             <div>
                                <input v-model="form.maintenance_cost" type="number" class="w-full border p-2 rounded-lg" placeholder="Rp" />
                             </div>
                         </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Foto Bukti / Nota (Opsional)</label>
                        <input type="file" @change="e => form.receipt_image = e.target.files[0]" class="w-full text-xs text-gray-500" />
                    </div>

                    <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <span class="font-bold text-gray-700">Total Pengajuan</span>
                        <span class="font-bold text-xl text-brand-green">Rp {{ calculateTotal().toLocaleString('id-ID') }}</span>
                    </div>

                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" @click="showCreateModal = false" class="px-4 py-2 text-gray-600 font-bold">Batal</button>
                    <button type="submit" class="bg-brand-green text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600">Ajukan</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Disburse Modal (Finance) -->
    <div v-if="showDisburseModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <h3 class="text-xl font-bold text-brand-navy mb-4">Pencairan Dana Angkutan</h3>
            <form @submit.prevent="submitDisbursement">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Tanggal Cair</label>
                        <input v-model="disburseForm.completed_at" type="date" class="w-full border p-2 rounded-lg" required />
                    </div>
                     <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Metode Bayar</label>
                        <select v-model="disburseForm.payment_method" class="w-full border p-2 rounded-lg" required>
                            <option value="cash">Tunai (Cash)</option>
                            <option value="transfer">Transfer Bank</option>
                        </select>
                    </div>

                    <div v-if="disburseForm.payment_method === 'cash'" class="p-4 bg-yellow-50 rounded-lg">
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Sumber Dana</label>
                         <div class="flex gap-4">
                            <label class="flex items-center gap-2"><input type="radio" v-model="disburseForm.fund_source" value="kas_kecil" required /> Kas Kecil</label>
                            <label class="flex items-center gap-2"><input type="radio" v-model="disburseForm.fund_source" value="dana_yayasan" required /> Dana Yayasan</label>
                        </div>
                    </div>

                    <div v-if="disburseForm.payment_method === 'transfer'" class="space-y-3 p-4 bg-blue-50 rounded-lg">
                        <input v-model="disburseForm.bank_name" type="text" placeholder="Nama Bank" class="w-full border p-2 rounded-lg text-sm" required />
                        <input v-model="disburseForm.account_holder_name" type="text" placeholder="Atas Nama" class="w-full border p-2 rounded-lg text-sm" required />
                        <input v-model="disburseForm.transfer_reference_number" type="text" placeholder="No. Referensi" class="w-full border p-2 rounded-lg text-sm" required />
                         <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Bukti Transfer</label>
                            <input type="file" @change="e => disburseForm.transfer_proof = e.target.files[0]" class="w-full text-xs text-gray-500" required />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" @click="showDisburseModal = false" class="px-4 py-2 text-gray-600 font-bold">Batal</button>
                    <button type="submit" class="bg-brand-green text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600">Simpan & Cairkan</button>
                </div>
            </form>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const requests = ref([])
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Create Modal
const showCreateModal = ref(false)
const form = ref({
    driver_name: '',
    vehicle_plate: '',
    labor_cost: 0,
    fuel_cost: 0,
    maintenance_cost: 0,
    maintenance_description: '',
    receipt_image: null
})

// Disburse Modal
const showDisburseModal = ref(false)
const selectedId = ref(null)
const disburseForm = ref({
    payment_method: 'cash',
    fund_source: '',
    bank_name: '',
    transfer_reference_number: '',
    account_holder_name: '',
    completed_at: new Date().toISOString().split('T')[0],
    transfer_proof: null
})

const fetchRequests = async () => {
    loading.value = true
    try {
        const response = await axios.get('http://localhost:5000/api/transport', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        requests.value = response.data
    } catch (e) { console.error(e) } 
    finally { loading.value = false }
}

const calculateTotal = () => {
    return (parseFloat(form.value.labor_cost) || 0) + (parseFloat(form.value.fuel_cost) || 0) + (parseFloat(form.value.maintenance_cost) || 0)
}

const createRequest = async () => {
    if (calculateTotal() <= 0) return alert('Total biaya harus lebih dari 0')
    const formData = new FormData()
    formData.append('driver_name', form.value.driver_name)
    formData.append('vehicle_plate', form.value.vehicle_plate)
    formData.append('labor_cost', form.value.labor_cost)
    formData.append('fuel_cost', form.value.fuel_cost)
    formData.append('maintenance_cost', form.value.maintenance_cost)
    formData.append('maintenance_description', form.value.maintenance_description)
    if (form.value.receipt_image) formData.append('proof', form.value.receipt_image)

    try {
        await axios.post('http://localhost:5000/api/transport', formData, {
            headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'multipart/form-data' }
        })
        alert('Pengajuan berhasil dibuat')
        showCreateModal.value = false
        form.value = { driver_name: '', vehicle_plate: '', labor_cost: 0, fuel_cost: 0, maintenance_cost: 0, maintenance_description: '', receipt_image: null }
        fetchRequests()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
}

// Approval Actions
const approveAdminGm = async (id) => {
    if(!confirm('Setujui dan teruskan ke GM?')) return
    try {
        await axios.put(`http://localhost:5000/api/transport/${id}/approve-admin-gm`, {}, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchRequests()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const approveGm = async (id) => {
    if(!confirm('Setujui pengajuan ini?')) return
    try {
        await axios.put(`http://localhost:5000/api/transport/${id}/approve-gm`, {}, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchRequests()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const reject = async (id) => {
    const reason = prompt('Masukkan alasan penolakan:')
    if(!reason) return
    try {
        await axios.put(`http://localhost:5000/api/transport/${id}/reject`, { reason }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        fetchRequests()
    } catch(e) { alert(e.response?.data?.message || 'Error') }
}

const processFinance = (id) => {
    selectedId.value = id
    disburseForm.value = { payment_method: 'cash', fund_source: '', bank_name: '', transfer_reference_number: '', account_holder_name: '', completed_at: new Date().toISOString().split('T')[0], transfer_proof: null }
    showDisburseModal.value = true
}

const submitDisbursement = async () => {
    const formData = new FormData()
    formData.append('payment_method', disburseForm.value.payment_method)
    formData.append('completed_at', disburseForm.value.completed_at)
    if(disburseForm.value.payment_method === 'cash') {
        formData.append('fund_source', disburseForm.value.fund_source)
    } else {
        formData.append('bank_name', disburseForm.value.bank_name)
        formData.append('account_holder_name', disburseForm.value.account_holder_name)
        formData.append('transfer_reference_number', disburseForm.value.transfer_reference_number)
        if(disburseForm.value.transfer_proof) formData.append('proof', disburseForm.value.transfer_proof)
    }

    try {
        await axios.post(`http://localhost:5000/api/transport/${selectedId.value}/process-finance`, formData, {
            headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'multipart/form-data' }
        })
        alert('Berhasil dicairkan!')
        showDisburseModal.value = false
        fetchRequests()
    } catch (e) { 
        console.error(e)
        alert(e.response?.data?.message || 'Error') 
    }
}

const viewProof = (path) => {
    window.open(`http://localhost:5000/${path}`, '_blank')
}

// Utils
const getStatusClass = (status) => {
    switch(status) {
        case 'completed': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold'
        case 'rejected': return 'bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold'
        case 'pending_admin_gm': return 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold'
        case 'pending_gm': return 'bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold'
        case 'approved_gm': return 'bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold'
        default: return 'bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold'
    }
}

const formatStatus = (status) => {
    switch(status) {
        case 'pending_admin_gm': return 'Menunggu Admin GM'
        case 'pending_gm': return 'Menunggu GM'
        case 'approved_gm': return 'Menunggu Keuangan'
        case 'completed': return 'Selesai'
        case 'rejected': return 'Ditolak'
        default: return status
    }
}

onMounted(fetchRequests)

const totalPages = computed(() => Math.ceil(requests.value.length / itemsPerPage))
const paginatedRequests = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return requests.value.slice(start, start + itemsPerPage)
})
</script>
