const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/users', authMiddleware, authController.getUsers);
router.put('/users/:id', authMiddleware, authController.updateUser);

module.exports = router;
