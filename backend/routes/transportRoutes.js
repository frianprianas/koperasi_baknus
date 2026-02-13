const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Create (Admin Pembelian only)
router.post('/',
    authMiddleware,
    roleCheck(['admin_pembelian']),
    transportController.upload, // For receipt/proof
    transportController.create
);

// 2. Get All (Admin Pembelian, Admin GM, GM, Finance)
router.get('/',
    authMiddleware,
    roleCheck(['admin_pembelian', 'admin_gm', 'gm', 'keuangan', 'master_admin']),
    transportController.getAll
);

// 3. Approve Admin GM
router.put('/:id/approve-admin-gm',
    authMiddleware,
    roleCheck(['admin_gm']),
    transportController.approveAdminGm
);

// 4. Approve GM
router.put('/:id/approve-gm',
    authMiddleware,
    roleCheck(['gm']),
    transportController.approveGm
);

// 5. Process Finance (Disburse)
router.post('/:id/process-finance',
    authMiddleware,
    roleCheck(['keuangan']),
    transportController.upload,
    transportController.processFinance
);

// 6. Reject
router.put('/:id/reject',
    authMiddleware,
    roleCheck(['admin_gm', 'gm', 'keuangan']),
    transportController.reject
);

module.exports = router;
