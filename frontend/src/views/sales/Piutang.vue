<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">Manajemen Piutang</h2>
      <div v-if="loading" class="text-sm text-blue-600 animate-pulse font-medium">Memuat data piutang...</div>
    </div>

    <!-- Alert for Piutang Info -->
    <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
      <span class="text-xl">ℹ️</span>
      <div>
        <p class="text-amber-800 font-bold text-sm">Informasi Piutang</p>
        <p class="text-amber-700 text-xs">Daftar ini menampilkan transaksi dengan metode pembayaran **Piutang** yang belum lunas (belum status 'Selesai'). Unggah bukti pembayaran jika pelanggan sudah membayar.</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Invoice</th>
              <th class="px-6 py-3">Pelanggan</th>
              <th class="px-6 py-3">Total Tagihan</th>
              <th class="px-6 py-3">Status ACC</th>
              <th class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="piutangList.length === 0 && !loading" class="text-center">
              <td colspan="6" class="px-6 py-12 text-gray-400">
                <div class="text-4xl mb-2">🎉</div>
                <p>Tidak ada piutang yang perlu ditindaklanjuti.</p>
              </td>
            </tr>
            <tr v-for="t in piutangList" :key="t.id" class="border-b last:border-0 hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-gray-600">{{ new Date(t.createdAt).toLocaleDateString('id-ID') }}</td>
              <td class="px-6 py-4 font-bold text-gray-800">{{ t.invoice_number }}</td>
              <td class="px-6 py-4">{{ t.customer_name }}</td>
              <td class="px-6 py-4 font-bold text-blue-700">Rp {{ parseFloat(t.total_amount).toLocaleString('id-ID') }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(t.status)">{{ translateStatus(t.status) }}</span>
              </td>
              <td class="px-6 py-4">
                <button 
                  @click="openPayModal(t)"
                  class="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm flex items-center gap-2"
                >
                  <span>💳</span> Lunasi / Upload Bukti
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pay Modal -->
    <div v-if="showPayModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" @click.stop>
        <div class="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h3 class="font-extrabold text-gray-800">Pelunasan Piutang</h3>
            <p class="text-xs text-gray-500">{{ selectedTransaction?.invoice_number }} - {{ selectedTransaction?.customer_name }}</p>
          </div>
          <button @click="showPayModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <form @submit.prevent="submitPayment" class="p-6 space-y-4">
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
            <p class="text-xs text-blue-600 font-bold uppercase mb-1">Total yang harus dibayar</p>
            <p class="text-2xl font-extrabold text-blue-900">Rp {{ parseFloat(selectedTransaction?.total_amount).toLocaleString('id-ID') }}</p>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Unggah Bukti Pembayaran</label>
            <div class="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition group cursor-pointer" @click="$refs.fileInput.click()">
              <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*,application/pdf" required />
              <div v-if="!paymentFile" class="text-center">
                <span class="text-3xl block mb-2">📸</span>
                <p class="text-xs text-gray-500 group-hover:text-blue-500 font-medium">Klik untuk memilih foto atau PDF bukti transfer</p>
              </div>
              <div v-else class="flex items-center gap-3">
                <span class="text-2xl">📄</span>
                <div class="flex-1 overflow-hidden">
                  <p class="text-xs font-bold text-gray-800 truncate">{{ paymentFile.name }}</p>
                  <p class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ (paymentFile.size / 1024).toFixed(1) }} KB</p>
                </div>
                <button type="button" @click.stop="paymentFile = null" class="text-rose-500 hover:text-rose-700 text-xl">&times;</button>
              </div>
            </div>
          </div>

          <div class="pt-4 flex gap-3">
            <button type="button" @click="showPayModal = false" class="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
            <button 
              type="submit" 
              class="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
              :disabled="submitting || !paymentFile"
            >
              {{ submitting ? 'Mengirim...' : 'Kirim Bukti Pelunasan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const piutangList = ref([])
const loading = ref(false)
const submitting = ref(false)
const showPayModal = ref(false)
const selectedTransaction = ref(null)
const paymentFile = ref(null)

const fetchPiutang = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:5000/api/transactions/piutang', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    piutangList.value = response.data
  } catch (error) {
    console.error("Failed to fetch piutang", error)
  } finally {
    loading.value = false
  }
}

const openPayModal = (transaction) => {
  selectedTransaction.value = transaction
  paymentFile.value = null
  showPayModal.value = true
}

const handleFileChange = (e) => {
  if (e.target.files.length > 0) {
    paymentFile.value = e.target.files[0]
  }
}

const submitPayment = async () => {
  if (!paymentFile.value) return alert("Pilih bukti pembayaran terlebih dahulu.")
  
  submitting.value = true
  const formData = new FormData()
  formData.append('proof', paymentFile.value)

  try {
    await axios.put(`http://localhost:5000/api/transactions/${selectedTransaction.value.id}/pay`, formData, {
      headers: { 
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    alert("Bukti pelunasan berhasil dikirim! Menunggu verifikasi Bagian Keuangan.")
    showPayModal.value = false
    fetchPiutang()
  } catch (error) {
    console.error("Payment submission failed", error)
    alert("Gagal mengirim bukti: " + (error.response?.data?.error || error.message))
  } finally {
    submitting.value = false
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-amber-100 text-amber-700'
    case 'approved': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-blue-100 text-blue-700'
    case 'rejected': return 'px-2 py-1 text-[10px] font-extrabold rounded bg-rose-100 text-rose-700'
    default: return 'px-2 py-1 text-[10px] font-extrabold rounded bg-gray-100 text-gray-700'
  }
}

const translateStatus = (status) => {
  switch (status) {
    case 'pending': return 'PROSES ACC'
    case 'approved': return 'DISETUJUI (HUTANG)'
    case 'rejected': return 'DITOLAK'
    default: return status
  }
}

onMounted(fetchPiutang)
</script>
