const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', authMiddleware, customerController.getCustomers);
router.post('/', authMiddleware, roleCheck('admin_penjualan'), customerController.createCustomer);

module.exports = router;
