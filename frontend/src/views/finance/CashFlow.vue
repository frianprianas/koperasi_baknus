<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">Laporan Arus Kas (Cash Flow)</h2>
      
      <!-- Date Filter -->
      <div class="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-gray-500 uppercase">Dari:</label>
            <input type="date" v-model="startDate" class="text-sm border-gray-200 rounded border p-1" />
        </div>
        <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-gray-500 uppercase">Sampai:</label>
            <input type="date" v-model="endDate" class="text-sm border-gray-200 rounded border p-1" />
        </div>
        <button @click="fetchReport" class="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition">
            Filter
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Income -->
        <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pemasukan</p>
                <h3 class="text-2xl font-bold text-green-600">Rp {{ summary.totalIncome.toLocaleString('id-ID') }}</h3>
            </div>
            <div class="p-3 bg-green-50 rounded-full text-green-600">
                <span class="text-xl">💰</span>
            </div>
        </div>

        <!-- Expense -->
        <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pengeluaran</p>
                <h3 class="text-2xl font-bold text-red-600">Rp {{ summary.totalExpense.toLocaleString('id-ID') }}</h3>
            </div>
            <div class="p-3 bg-red-50 rounded-full text-red-600">
                <span class="text-xl">💸</span>
            </div>
        </div>

    </div>

    <!-- Details Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 class="font-bold text-gray-700">Rincian Transaksi</h3>
            <button @click="printReport" class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-900 transition">
                🖨️ Cetak Laporan
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3">Tanggal</th>
                        <th class="px-6 py-3">Tipe</th>
                        <th class="px-6 py-3">Keterangan</th>
                        <th class="px-6 py-3">Metode</th>
                        <th class="px-6 py-3 text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    <tr v-if="loading" class="text-center">
                        <td colspan="5" class="px-6 py-8 text-gray-500">Memuat data...</td>
                    </tr>
                    <tr v-else-if="details.length === 0" class="text-center">
                        <td colspan="5" class="px-6 py-8 text-gray-400">Tidak ada data transaksi pada periode ini.</td>
                    </tr>
                    <tr v-else v-for="item in details" :key="item.id" class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {{ new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                        </td>
                        <td class="px-6 py-4">
                            <span v-if="item.type === 'IN'" class="px-2 py-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 rounded-full">Pemasukan</span>
                            <span v-else class="px-2 py-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded-full">Pengeluaran</span>
                        </td>
                        <td class="px-6 py-4 font-medium text-gray-800">{{ item.description }}</td>
                        <td class="px-6 py-4 text-gray-500 capitalize">{{ item.method || '-' }}</td>
                        <td class="px-6 py-4 text-right font-bold font-mono" :class="item.type === 'IN' ? 'text-green-600' : 'text-red-600'">
                            {{ item.type === 'IN' ? '+' : '-' }} Rp {{ item.amount.toLocaleString('id-ID') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const startDate = ref(new Date().toISOString().split('T')[0].substring(0, 7) + '-01') // First day of current month
const endDate = ref(new Date().toISOString().split('T')[0]) // Today

const summary = ref({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
})
const details = ref([])

const fetchReport = async () => {
    loading.value = true
    try {
        const response = await axios.get('http://localhost:5000/api/reports/cash-flow', {
            params: { startDate: startDate.value, endDate: endDate.value },
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        summary.value = response.data.summary
        details.value = response.data.details
    } catch (error) {
        console.error('Error fetching report:', error)
    } finally {
        loading.value = false
    }
}

const printReport = () => {
    window.print()
}

onMounted(fetchReport)
</script>

<style scoped>
@media print {
    button, input, label { display: none !important; }
    .shadow-sm, .shadow-xl { box-shadow: none !important; }
    .border { border: 1px solid #ddd !important; }
}
</style>
