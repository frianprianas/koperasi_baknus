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
          <div class="inline-block p-1 bg-white rounded-3xl mb-4 shadow-xl">
            <img src="/logo_koperasi.png" alt="Logo Koperasi" class="w-20 h-20 object-contain" />
          </div>
          <h2 class="text-3xl font-black text-white tracking-tight">Koperasi Baknus</h2>
          <p class="text-brand-green text-xs mt-2 font-bold uppercase tracking-[0.2em] opacity-90 drop-shadow-sm">Sistem Terintegrasi v2.1</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-[10px] font-black text-white uppercase mb-2 tracking-widest opacity-70">Username</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-white/40 group-focus-within:text-brand-green transition-all">
                👤
              </span>
              <input 
                v-model="username" 
                type="text" 
                placeholder="Username Anda"
                class="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:bg-white/15 transition-all text-sm font-medium" 
                required 
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-white uppercase mb-2 tracking-widest opacity-70">Password</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-white/40 group-focus-within:text-brand-green transition-all">
                🔒
              </span>
              <input 
                v-model="password" 
                type="password" 
                placeholder="••••••••"
                class="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:bg-white/15 transition-all text-sm font-medium" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-4 bg-gradient-to-r from-brand-navy to-brand-green text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group border border-white/10"
          >
            <span>Masuk Sekarang</span>
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
