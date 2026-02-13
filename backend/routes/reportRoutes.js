const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get Cash Flow Report
// Accessible by Finance, GM, Master Admin
router.get('/cash-flow',
    authMiddleware,
    roleCheck(['keuangan', 'gm', 'master_admin']),
    reportController.getCashFlow
);

// Get GM Dashboard Stats
router.get('/gm-stats',
    authMiddleware,
    roleCheck(['gm', 'master_admin', 'admin_gm']),
    reportController.getGMDashboardStats
);

module.exports = router;
