import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: (() => {
            try {
                return JSON.parse(localStorage.getItem('user')) || null;
            } catch {
                return null;
            }
        })(),
        token: localStorage.getItem('token') || null,
    }),
    getters: {
        isAdminSales: (state) => state.user?.role === 'admin_penjualan',
        isFinance: (state) => state.user?.role === 'keuangan',
        isGM: (state) => state.user?.role === 'gm',
        isMaster: (state) => state.user?.role === 'master_admin',
    },
    actions: {
        async login(username, password) {
            try {
                const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
                this.token = response.data.token;
                this.user = response.data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
})
