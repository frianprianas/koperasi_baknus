const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', authMiddleware, productController.getProducts);
router.post('/', authMiddleware, roleCheck('admin_penjualan'), productController.createProduct);
router.put('/:id', authMiddleware, roleCheck('admin_penjualan'), productController.updateProduct);

module.exports = router;
