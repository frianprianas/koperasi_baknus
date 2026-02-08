const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

// Create Transaction (Sales Admin)
router.post('/', authMiddleware, transactionController.upload, transactionController.createTransaction);

// Get Transactions (All or Filtered)
router.get('/', authMiddleware, transactionController.getTransactions);

// Approve Transaction (Finance/GM)
router.put('/:id/approve', authMiddleware, transactionController.approveTransaction);

// Get Single Transaction (Update)
router.get('/:id', authMiddleware, transactionController.getTransactionById);

// Update Transaction (Sales Admin - Rejected)
router.put('/:id', authMiddleware, transactionController.upload, transactionController.updateTransaction);

module.exports = router;
