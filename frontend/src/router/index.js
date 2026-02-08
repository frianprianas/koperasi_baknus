import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import MainLayout from '../layouts/MainLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import SalesInput from '../views/sales/Input.vue'
import SalesHistory from '../views/sales/History.vue'
import FinanceApprovals from '../views/finance/Approvals.vue'
import FinanceHistory from '../views/finance/History.vue'
import GMOverview from '../views/gm/Overview.vue'
import Notifications from '../views/Notifications.vue'
import MasterData from '../views/MasterData.vue'
import AccountManagement from '../views/AccountManagement.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/dashboard' },
            { path: 'dashboard', name: 'Dashboard', component: Dashboard },
            { path: 'notifications', name: 'Notifications', component: Notifications },
            { path: 'master', name: 'MasterData', component: MasterData, meta: { role: ['admin_penjualan', 'keuangan', 'gm'] } },
            { path: 'accounts', name: 'AccountManagement', component: AccountManagement, meta: { role: 'master_admin' } },

            // Sales Routes
            { path: 'sales', redirect: '/sales/input' }, // Fix for /sales 404
            { path: 'sales/input', name: 'SalesInput', component: SalesInput, meta: { role: 'admin_penjualan' } },
            { path: 'sales/edit/:id', name: 'SalesEdit', component: SalesInput, meta: { role: 'admin_penjualan' } },
            { path: 'sales/history', name: 'SalesHistory', component: SalesHistory, meta: { role: 'admin_penjualan' } },

            // Finance Routes
            { path: 'finance', redirect: '/finance/approvals' },
            { path: 'finance/approvals', name: 'FinanceApprovals', component: FinanceApprovals, meta: { role: 'keuangan' } },
            { path: 'finance/history', name: 'FinanceHistory', component: FinanceHistory, meta: { role: 'keuangan' } },

            // GM Routes
            { path: 'gm', name: 'GMOverview', component: GMOverview, meta: { role: 'gm' } }
        ]
    },
    // Catch all 404
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // Always allow login
    if (to.path === '/login') {
        return next();
    }

    // Check auth
    if (to.meta.requiresAuth && !authStore.token) {
        return next('/login');
    }

    // Check roles
    if (to.meta.role) {
        const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
        if (!allowedRoles.includes(authStore.user?.role)) {
            // Redirect to appropriate dashboard based on role if access denied
            if (authStore.isAdminSales) return next('/sales/input');
            if (authStore.isFinance) return next('/finance/approvals');
            if (authStore.isGM) return next('/gm');
            if (authStore.isMaster) return next('/accounts');
            return next('/dashboard');
        }
    }

    next();
})

export default router
