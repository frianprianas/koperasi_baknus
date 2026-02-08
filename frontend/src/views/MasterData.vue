<template>
  <div class="space-y-6">
    <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-50 mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-blue-900">Master Data</h2>
          <p class="text-sm text-gray-500">Kelola informasi barang dan data konsumen tetap</p>
        </div>
        <div class="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            @click="activeTab = 'products'" 
            :class="activeTab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'" 
            class="px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <span>📦</span> Master Barang
          </button>
          <button 
            @click="activeTab = 'customers'" 
            :class="activeTab === 'customers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'" 
            class="px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <span>👥</span> Master Konsumen
          </button>
        </div>
      </div>
    </div>

    <!-- Products Tab -->
    <div v-if="activeTab === 'products'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-bold">Daftar Produk</h3>
        <button v-if="authStore.isAdminSales" @click="openAddModal" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700">+ Tambah Produk</button>
      </div>
      
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-6 py-3">Nama Produk</th>
            <th class="px-6 py-3">Kategori</th>
            <th class="px-6 py-3">Harga</th>
            <th class="px-6 py-3">Stok</th>
            <th v-if="authStore.isAdminSales" class="px-6 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="p in products" :key="p.id" class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-medium text-gray-900">{{ p.name }}</td>
            <td class="px-6 py-4 text-gray-500">{{ p.category || '-' }}</td>
            <td class="px-6 py-4 font-bold text-blue-600">Rp {{ parseFloat(p.price).toLocaleString('id-ID') }}</td>
            <td class="px-6 py-4">{{ p.stock }}</td>
            <td v-if="authStore.isAdminSales" class="px-6 py-4 text-center">
              <button @click="editProduct(p)" class="text-blue-600 hover:text-blue-800 font-bold text-xs p-1 px-2 border border-blue-200 rounded hover:bg-blue-50">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Customers Tab -->
    <div v-if="activeTab === 'customers'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-bold">Daftar Konsumen</h3>
        <button v-if="authStore.isAdminSales" @click="openAddModal" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700">+ Tambah Konsumen</button>
      </div>
      
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-6 py-3">Nama</th>
            <th class="px-6 py-3">Telepon</th>
            <th class="px-6 py-3">Tipe</th>
            <th class="px-6 py-3">Alamat</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in customers" :key="c.id" class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-medium text-gray-900">{{ c.name }}</td>
            <td class="px-6 py-4 text-gray-500">{{ c.phone || '-' }}</td>
            <td class="px-6 py-4 italic">{{ c.type }}</td>
            <td class="px-6 py-4 text-gray-400 capitalize">{{ c.address || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
       <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-xl font-bold mb-4">Tambah {{ activeTab === 'products' ? 'Produk' : 'Konsumen' }} Baru</h3>
          <form @submit.prevent="saveMaster" class="space-y-4">
            <div v-if="activeTab === 'products'">
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Produk</label>
              <input v-model="form.name" type="text" class="w-full border p-2 rounded-lg" required />
              
              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Kategori</label>
              <select v-model="form.category" class="w-full border p-2 rounded-lg" required>
                <option value="" disabled>-- Pilih Kategori --</option>
                <option value="Alat Tulis">Alat Tulis</option>
                <option value="Sembako">Sembako</option>
                <option value="Seragam">Seragam</option>
                <option value="Atribut">Atribut</option>
                <option value="Makanan/Minuman">Makanan/Minuman</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Harga</label>
              <input v-model.number="form.price" type="number" class="w-full border p-2 rounded-lg" required />

              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Stok</label>
              <input v-model.number="form.stock" type="number" class="w-full border p-2 rounded-lg" required />
            </div>

            <div v-if="activeTab === 'customers'">
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Konsumen</label>
              <input v-model="form.name" type="text" class="w-full border p-2 rounded-lg" required />
              
              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Telepon</label>
              <input v-model="form.phone" type="text" class="w-full border p-2 rounded-lg" />

              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Tipe</label>
              <select v-model="form.type" class="w-full border p-2 rounded-lg">
                <option value="umum">Umum</option>
                <option value="anggota">Anggota</option>
              </select>

              <label class="block text-sm font-bold text-gray-700 mt-3 mb-1">Alamat</label>
              <textarea v-model="form.address" class="w-full border p-2 rounded-lg" rows="2"></textarea>
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" @click="showAddModal = false" class="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Batal</button>
              <button type="submit" class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Simpan</button>
            </div>
          </form>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeTab = ref('products')
const products = ref([])
const customers = ref([])
const showAddModal = ref(false)
const selectedId = ref(null)
const form = ref({ name: '', price: 0, stock: 0, phone: '', type: 'umum', category: '', address: '' })

const fetchData = async () => {
  try {
    const [pRes, cRes] = await Promise.all([
      axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${authStore.token}` } }),
      axios.get('http://localhost:5000/api/customers', { headers: { Authorization: `Bearer ${authStore.token}` } })
    ])
    products.value = pRes.data
    customers.value = cRes.data
  } catch (e) {
    console.error(e)
  }
}

const openAddModal = () => {
    selectedId.value = null
    form.value = { name: '', price: 0, stock: 0, phone: '', type: 'umum', category: '', address: '' }
    showAddModal.value = true
}

const editProduct = (product) => {
    selectedId.value = product.id
    form.value = { 
        name: product.name, 
        price: parseFloat(product.price), 
        stock: product.stock, 
        category: product.category,
        // Reset customer fields just in case
        phone: '', 
        type: 'umum', 
        address: '' 
    }
    showAddModal.value = true
}

const saveMaster = async () => {
    const isEdit = !!selectedId.value
    const type = activeTab.value === 'products' ? 'products' : 'customers'
    const url = isEdit 
        ? `http://localhost:5000/api/${type}/${selectedId.value}`
        : `http://localhost:5000/api/${type}`
    
    const method = isEdit ? 'put' : 'post'

    try {
        await axios[method](url, form.value, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        showAddModal.value = false
        selectedId.value = null
        form.value = { name: '', price: 0, stock: 0, phone: '', type: 'umum', category: '', address: '' }
        fetchData()
    } catch (e) {
        alert("Gagal menyimpan data master")
    }
}

onMounted(fetchData)
</script>
