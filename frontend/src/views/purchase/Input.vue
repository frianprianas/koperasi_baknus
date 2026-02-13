<template>
  <div class="container mx-auto p-8">
    <h2 class="text-3xl font-bold mb-6 text-brand-navy">Input Pembelian (Restock)</h2>
    
    <div v-if="loadingData" class="text-center py-10">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
      <p class="text-gray-500 font-medium">Memuat data produk...</p>
    </div>

    <div v-else class="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-5xl mx-auto">
      <form @submit.prevent="submitPurchase">
        
        <div class="mb-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <h3 class="text-lg font-bold text-brand-navy mb-4 flex items-center gap-2">
              <span>🏭</span> Informasi Supplier
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nama Supplier</label>
                <input v-model="supplierName" type="text" placeholder="Contoh: PT. Alat Tulis Jaya" class="w-full border-gray-200 border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nomor Invoice (Opsional)</label>
                <input v-model="invoiceNumber" type="text" placeholder="Kosongkan untuk auto-generate" class="w-full border-gray-200 border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
        </div>

        <div class="mb-8">
          <h3 class="text-lg font-bold text-brand-navy mb-4 flex items-center gap-2">
            <span>📦</span> Detail Barang Restock
          </h3>
          <div class="space-y-3">
            <div v-for="(item, index) in items" :key="index" class="flex flex-wrap md:flex-nowrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end animate-fadeIn">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Barang</label>
                <select 
                  v-model="item.product_id" 
                  @change="onProductSelect(index)"
                  class="w-full border-gray-200 border p-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="" disabled>-- Pilih Barang --</option>
                  <option v-for="p in masterProducts" :key="p.id" :value="p.id">{{ p.name }} (Stok Saat Ini: {{ p.stock }})</option>
                </select>
              </div>
              <div class="w-24">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Jml Beli</label>
                <input v-model.number="item.quantity" type="number" min="1" class="w-full border-gray-200 border p-2 rounded-lg text-center" required />
              </div>
              <div class="w-32">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Harga Beli</label>
                <input v-model.number="item.buy_price" type="number" min="0" class="w-full border-gray-200 border p-2 rounded-lg text-right" required />
              </div>
              <div class="w-32">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Subtotal</label>
                <div class="p-2 text-right font-bold text-blue-700">
                  {{ (item.quantity * item.buy_price).toLocaleString('id-ID') }}
                </div>
              </div>
              <button type="button" @click="items.splice(index, 1)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus Barang">
                🗑️
              </button>
            </div>
          </div>
          <button type="button" @click="items.push({ product_id: '', quantity: 1, buy_price: 0 })" class="mt-4 flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition px-4 py-2 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 w-full justify-center">
            <span>➕</span> Tambah Barang
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div class="space-y-4">
             <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label class="block font-bold text-gray-700 mb-2">Upload Bukti / Invoice / Faktur</label>
                <input type="file" @change="e => proofFile = e.target.files[0]" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <p class="text-xs text-gray-400 mt-2 italic">* Optional tapi disarankan.</p>
             </div>
          </div>

          <div class="bg-brand-navy text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <p class="text-blue-300 text-sm font-bold uppercase tracking-wider mb-1">Total Pengajuan</p>
              <h3 class="text-4xl font-extrabold">Rp {{ totalAmount.toLocaleString('id-ID') }}</h3>
            </div>
            <div class="mt-8 flex gap-3">
              <button type="button" @click="$router.push('/purchase/history')" class="flex-1 px-4 py-3 bg-blue-900 hover:bg-blue-800 rounded-lg font-bold transition">Batal</button>
              <button 
                type="submit" 
                class="flex-[2] px-4 py-3 bg-brand-green hover:bg-green-600 text-white rounded-lg font-bold shadow-lg transition disabled:opacity-50" 
                :disabled="loading"
              >
                {{ loading ? 'Mengajukan...' : 'Ajukan Pembelian' }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const items = ref([{ product_id: '', quantity: 1, buy_price: 0 }])
const supplierName = ref('')
const invoiceNumber = ref('')
const proofFile = ref(null)
const loading = ref(false)
const loadingData = ref(false)
const masterProducts = ref([])

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity * item.buy_price), 0)
})

const fetchProducts = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${authStore.token}` } })
        masterProducts.value = response.data
    } catch (e) {
        console.error("Failed to load products", e)
    }
}

const onProductSelect = (index) => {
    // Optional: Pre-fill buy price if we track it in product, but mostly it changes.
    // Keeping it 0 or last known could be useful. For now keeping manual.
}

onMounted(async () => {
    loadingData.value = true
    await fetchProducts()
    loadingData.value = false
})

const submitPurchase = async () => {
  if (items.value.length === 0) return alert('Tambahkan setidaknya satu barang.')
  if (!supplierName.value) return alert('Nama supplier harus diisi.')

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('total_amount', totalAmount.value)
    formData.append('supplier_name', supplierName.value)
    if (invoiceNumber.value) formData.append('invoice_number', invoiceNumber.value)
    
    // items must be stringified for FormData
    // Item structure matches backend expectation: { product_id, quantity, buy_price, subtotal }
    const itemsPayload = items.value.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        buy_price: i.buy_price,
        subtotal: i.quantity * i.buy_price
    }))
    formData.append('items', JSON.stringify(itemsPayload))

    if (proofFile.value) {
      formData.append('proof', proofFile.value)
    }

    await axios.post('http://localhost:5000/api/purchases', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    alert('Pengajuan pembelian berhasil dikirim!')
    router.push('/purchase/history')
  } catch (error) {
    console.error('Submission error:', error)
    // Detailed error for easier debugging
    if (error.response) {
        console.error('Data:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        const serverMsg = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
         alert('Gagal Server: ' + serverMsg);
    } else if (error.request) {
        console.error('Request:', error.request);
        alert('Gagal: Tidak ada respon dari server.');
    } else {
        console.error('Error', error.message);
        alert('Gagal: ' + error.message);
    }
  } finally {
    loading.value = false
  }
}
</script>
