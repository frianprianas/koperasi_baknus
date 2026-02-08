<template>
  <div class="container mx-auto p-8">
    <h2 class="text-3xl font-bold mb-6 text-blue-800">{{ isEditing ? 'Edit Penjualan' : 'Input Penjualan' }}</h2>
    
    <div v-if="loadingData" class="text-center py-10">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
      <p class="text-gray-500 font-medium">Memuat data...</p>
    </div>

    <div v-else class="bg-white p-6 rounded-xl shadow-xl border border-blue-50 max-w-5xl mx-auto">
      <form @submit.prevent="submitSale">
        
        <div class="mb-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <h3 class="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>👤</span> Informasi Pelanggan
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Pilih Pelanggan</label>
                <select v-model="customerName" class="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" required>
                  <option value="" disabled>-- Pilih Pelanggan --</option>
                  <option v-for="c in masterCustomers" :key="c.id" :value="c.name">{{ c.name }} ({{ c.type }})</option>
                  <option value="Lainnya">-- Pelanggan Lainnya (Input Manual) --</option>
                </select>
              </div>
              <div v-if="customerName === 'Lainnya'">
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nama Pelanggan Manual</label>
                <input v-model="manualCustomerName" type="text" placeholder="Masukkan nama pelanggan baru" class="w-full border-gray-200 border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
        </div>

        <div class="mb-8">
          <h3 class="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>📦</span> Detail Barang
          </h3>
          <div class="space-y-3">
            <div v-for="(item, index) in items" :key="index" class="flex flex-wrap md:flex-nowrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end animate-fadeIn">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Barang</label>
                <select 
                  v-model="item.item_name" 
                  @change="onProductSelect(index)"
                  class="w-full border-gray-200 border p-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="" disabled>-- Pilih Barang --</option>
                  <option v-for="p in masterProducts" :key="p.id" :value="p.name">{{ p.name }} (Stok: {{ p.stock }})</option>
                </select>
              </div>
              <div class="w-24">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Jml</label>
                <input v-model.number="item.quantity" type="number" min="1" class="w-full border-gray-200 border p-2 rounded-lg text-center" required />
              </div>
              <div class="w-32">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Harga Satuan</label>
                <div class="p-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium">
                  {{ item.price.toLocaleString('id-ID') }}
                </div>
              </div>
              <div class="w-32">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Subtotal</label>
                <div class="p-2 text-right font-bold text-blue-700">
                  {{ (item.quantity * item.price).toLocaleString('id-ID') }}
                </div>
              </div>
              <button type="button" @click="items.splice(index, 1)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus Barang">
                🗑️
              </button>
            </div>
          </div>
          <button type="button" @click="items.push({ item_name: '', quantity: 1, price: 0 })" class="mt-4 flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition px-4 py-2 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 w-full justify-center">
            <span>➕</span> Tambah Barang Baru
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div class="space-y-4">
             <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
               <h3 class="font-bold text-gray-700 mb-2">Metode Pembayaran</h3>
               <div class="grid grid-cols-3 gap-2">
                 <button 
                  type="button" 
                  v-for="type in ['cash', 'transfer', 'piutang']" 
                  :key="type"
                  @click="paymentType = type"
                  class="p-2 rounded-lg border-2 transition capitalize text-sm font-bold"
                  :class="paymentType === type ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-400'"
                 >
                   {{ type }}
                 </button>
               </div>
             </div>

             <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label class="block font-bold text-gray-700 mb-2">Bukti Pembayaran / Dokumen</label>
                <input type="file" @change="e => proofFile = e.target.files[0]" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <p v-if="existingProof && !proofFile" class="text-xs text-blue-600 mt-2">📄 Bukti saat ini tersimpan: <a :href="`http://localhost:5000/${existingProof}`" target="_blank" class="underline font-bold">Lihat File</a></p>
                <p v-if="paymentType === 'transfer'" class="text-xs text-red-500 mt-2 font-medium italic">* Wajib melampirkan bukti transfer.</p>
             </div>
          </div>

          <div class="bg-blue-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <p class="text-blue-300 text-sm font-bold uppercase tracking-wider mb-1">Total Pembayaran</p>
              <h3 class="text-4xl font-extrabold">Rp {{ totalAmount.toLocaleString('id-ID') }}</h3>
            </div>
            <div class="mt-8 flex gap-3">
              <button type="button" @click="$router.push('/sales/history')" class="flex-1 px-4 py-3 bg-blue-800 hover:bg-blue-700 rounded-lg font-bold transition">Batal</button>
              <button 
                type="submit" 
                class="flex-[2] px-4 py-3 bg-green-500 hover:bg-green-400 text-white rounded-lg font-bold shadow-lg transition disabled:opacity-50" 
                :disabled="loading"
              >
                {{ loading ? 'Memproses...' : (isEditing ? 'Simpan Perubahan' : 'Kirim Transaksi') }}
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
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const items = ref([{ item_name: '', quantity: 1, price: 0 }])
const customerName = ref('')
const manualCustomerName = ref('')
const paymentType = ref('cash')
const proofFile = ref(null)
const existingProof = ref(null)
const loading = ref(false)
const loadingData = ref(false)
const isEditing = ref(false)

const masterProducts = ref([])
const masterCustomers = ref([])

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity * item.price), 0)
})

const fetchMasters = async () => {
    try {
        const [prodRes, custRes] = await Promise.all([
            axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${authStore.token}` } }),
            axios.get('http://localhost:5000/api/customers', { headers: { Authorization: `Bearer ${authStore.token}` } })
        ])
        masterProducts.value = prodRes.data
        masterCustomers.value = custRes.data
    } catch (e) {
        console.error("Failed to load master data", e)
    }
}

const onProductSelect = (index) => {
    const selectedItemName = items.value[index].item_name
    const product = masterProducts.value.find(p => p.name === selectedItemName)
    if (product) {
        items.value[index].price = parseFloat(product.price)
    }
}

onMounted(async () => {
    loadingData.value = true
    await fetchMasters()
    
    if (route.params.id) {
        isEditing.value = true
        try {
            const response = await axios.get(`http://localhost:5000/api/transactions/${route.params.id}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            })
            const data = response.data
            
            // If customer name is in master, set it. Otherwise set to 'Lainnya' and manual.
            const isKnownCustomer = masterCustomers.value.some(c => c.name === data.customer_name)
            if (isKnownCustomer) {
                customerName.value = data.customer_name
            } else {
                customerName.value = 'Lainnya'
                manualCustomerName.value = data.customer_name
            }

            paymentType.value = data.payment_type
            existingProof.value = data.proof_of_payment
            
            if (data.details && data.details.length > 0) {
                items.value = data.details.map(d => ({
                    item_name: d.item_name,
                    quantity: d.quantity,
                    price: parseFloat(d.price)
                }))
            }
        } catch (error) {
            console.error("Failed to load transaction", error)
            alert("Gagal memuat data transaksi")
            router.push('/sales/history')
        }
    }
    loadingData.value = false
})

const submitSale = async () => {
  if (items.value.length === 0) return alert('Tambahkan setidaknya satu barang.')
  
  if (paymentType.value === 'transfer' && !proofFile.value && !existingProof.value) {
      return alert('Transfer wajib menyertakan bukti pembayaran.')
  }

  const finalCustomerName = customerName.value === 'Lainnya' ? manualCustomerName.value : customerName.value
  if (!finalCustomerName) return alert('Nama pelanggan harus diisi.')

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('total_amount', totalAmount.value)
    formData.append('payment_type', paymentType.value)
    formData.append('items', JSON.stringify(items.value))
    formData.append('customer_name', finalCustomerName)
    
    if (!isEditing.value) {
        if (authStore.user && authStore.user.id) {
            formData.append('created_by', authStore.user.id)
        } else {
            throw new Error("User ID session expired.");
        }
    }

    if (proofFile.value) {
      formData.append('proof', proofFile.value)
    }

    const url = isEditing.value 
        ? `http://localhost:5000/api/transactions/${route.params.id}`
        : 'http://localhost:5000/api/transactions'
    
    const method = isEditing.value ? 'put' : 'post'

    await axios[method](url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    alert(`Transaksi berhasil ${isEditing.value ? 'diperbarui' : 'dikirim'}!`)
    router.push('/sales/history')
  } catch (error) {
    console.error('Submission error:', error)
    const msg = error.response?.data?.error || error.message || 'Gagal memproses transaksi.'
    alert('Gagal: ' + msg)
  } finally {
    loading.value = false
  }
}
</script>
