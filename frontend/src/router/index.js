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
import PurchaseInput from '../views/purchase/Input.vue'
import PurchaseHistory from '../views/purchase/History.vue'
import CashFlow from '../views/finance/CashFlow.vue'

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
            { path: 'sales/piutang', name: 'SalesPiutang', component: () => import('../views/sales/Piutang.vue'), meta: { role: 'admin_penjualan' } },

            // Finance Routes
            { path: 'finance', redirect: '/finance/approvals' },
            { path: 'finance/approvals', name: 'FinanceApprovals', component: FinanceApprovals, meta: { role: 'keuangan' } },
            { path: 'finance/history', name: 'FinanceHistory', component: FinanceHistory, meta: { role: 'keuangan' } },
            { path: 'finance/cash-flow', name: 'CashFlow', component: CashFlow, meta: { role: ['keuangan', 'gm', 'master_admin'] } },

            // GM Routes
            { path: 'gm', name: 'GMOverview', component: GMOverview, meta: { role: ['gm', 'master_admin', 'admin_gm'] } },

            // Purchase Routes
            { path: 'purchase', redirect: '/purchase/history' },
            { path: 'purchase/input', name: 'PurchaseInput', component: PurchaseInput, meta: { role: 'admin_pembelian' } },
            { path: 'purchase/history', name: 'PurchaseHistory', component: PurchaseHistory, meta: { role: ['admin_pembelian', 'admin_gm', 'gm', 'keuangan', 'master_admin'] } },

            // Transport Routes
            { path: 'transport', name: 'Transport', component: () => import('../views/transport/Transport.vue'), meta: { role: ['admin_pembelian', 'admin_gm', 'gm', 'keuangan', 'master_admin'] } }
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
            if (authStore.isAdminPurchase) return next('/purchase/input');
            if (authStore.isAdminGM) return next('/purchase/history');
            return next('/dashboard');
        }
    }

    next();
})

export default router
