<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden">
    <!-- Video Background -->
    <video 
      autoplay 
      muted 
      loop 
      playsinline 
      class="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
    >
      <source src="/assets/videos/bg_login.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <!-- Overlay -->
    <div class="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px]"></div>

    <!-- Login Card -->
    <div class="relative z-20 w-full max-w-md p-8 mx-4">
      <div class="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl animate-fadeIn">
        <div class="text-center mb-8">
          <div class="inline-block p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <span class="text-3xl text-white font-bold">KB</span>
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">Koperasi Baknus</h2>
          <p class="text-blue-100/70 text-sm mt-2 font-medium uppercase tracking-widest">Sistem Terintegrasi</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-xs font-bold text-blue-100 uppercase mb-2 tracking-wider">Username</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300 pointer-events-none group-focus-within:text-blue-400 transition">
                👤
              </span>
              <input 
                v-model="username" 
                type="text" 
                placeholder="Masukkan username Anda"
                class="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all" 
                required 
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-blue-100 uppercase mb-2 tracking-wider">Password</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300 pointer-events-none group-focus-within:text-blue-400 transition">
                🔒
              </span>
              <input 
                v-model="password" 
                type="password" 
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Masuk ke Akun</span>
            <span class="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </form>

        <div class="mt-8 text-center">
            <p class="text-xs text-blue-200/50">Copyright &copy; 2026 Koperasi Baknus. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.8s ease-out forwards;
}
</style>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  const success = await authStore.login(username.value, password.value)
  if (success) {
    if (authStore.isAdminSales) router.push('/sales')
    else if (authStore.isFinance) router.push('/finance')
    else if (authStore.isGM) router.push('/gm')
    else router.push('/dashboard')
  } else {
    alert('Username atau password salah')
  }
}
</script>
