const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Create Purchase Request (Admin Pembelian)
router.post('/',
    authMiddleware,
    roleCheck(['admin_pembelian']),
    purchaseController.upload,
    purchaseController.createPurchase
);

// 2. Get Purchases (All capable roles)
router.get('/',
    authMiddleware,
    roleCheck(['admin_pembelian', 'admin_gm', 'gm', 'keuangan', 'master_admin']),
    purchaseController.getPurchases
);

// 3. Approve by Admin GM
router.put('/:id/approve-admin-gm',
    authMiddleware,
    roleCheck(['admin_gm']),
    purchaseController.approveAdminGm
);

// 4. Approve by GM
router.put('/:id/approve-gm',
    authMiddleware,
    roleCheck(['gm']),
    purchaseController.approveGm
);

// 5. Process by Finance (Disburse & Stock Update)
router.post('/:id/process-finance',
    authMiddleware,
    roleCheck(['keuangan']),
    purchaseController.upload, // Reuse upload middleware for transfer proof
    purchaseController.processFinance
);

// 6. Reject (Admin GM, GM, Finance)
router.put('/:id/reject',
    authMiddleware,
    roleCheck(['admin_gm', 'gm', 'keuangan']),
    purchaseController.rejectPurchase
);

module.exports = router;
