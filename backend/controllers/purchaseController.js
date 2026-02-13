const { Purchase, PurchaseItem, Product, User, Notification, sequelize } = require('../models');
const { sendWANotification } = require('../utils/waNotification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/purchases';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
exports.upload = upload.single('proof');

// Create Purchase Request
exports.createPurchase = async (req, res) => {
    console.log('[DEBUG] createPurchase called');
    console.log('[DEBUG] Body:', req.body);
    console.log('[DEBUG] File:', req.file);
    const t = await sequelize.transaction();
    try {
        const { items, supplier_name, total_amount, invoice_number } = req.body;
        const proof_image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Parse items if stringified
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

        // Basic validation
        if (!parsedItems || parsedItems.length === 0) {
            return res.status(400).json({ message: 'No items in purchase request' });
        }

        const purchase = await Purchase.create({
            // item_count removed as it is not in the model
            total_amount,
            supplier_name,
            invoice_number: invoice_number || `INV-PUR-${Date.now()}`,
            proof_image,
            created_by_id: req.user.id,
            status: 'pending_admin_gm'
        }, { transaction: t });

        for (const item of parsedItems) {
            await PurchaseItem.create({
                purchase_id: purchase.id,
                product_id: item.product_id,
                quantity: item.quantity,
                buy_price: item.buy_price,
                subtotal: item.subtotal
            }, { transaction: t });
        }

        // Notify Admin GM via WA
        const adminGms = await User.findAll({ where: { role: 'admin_gm' } });
        for (const admin of adminGms) {
            await Notification.create({
                user_id: admin.id,
                title: 'Permintaan Pembelian Baru',
                message: `Permintaan Pembelian ${invoice_number} perlu persetujuan.`,
                type: 'info',
                related_id: purchase.id,
                is_read: false
            }, { transaction: t });

            if (admin.whatsapp) {
                const message = `🔔 *PENGAJUAN PEMBELIAN BARU*\n\n` +
                    `No. Invoice: ${purchase.invoice_number}\n` +
                    `Supplier: ${purchase.supplier_name}\n` +
                    `Total: Rp ${parseFloat(purchase.total_amount).toLocaleString('id-ID')}\n\n` +
                    `_Mohon segera dijawab melalui sistem Baknus._`;
                await sendWANotification(admin.whatsapp, message);
            }
        }

        await t.commit();
        res.status(201).json({ message: 'Purchase request created successfully', purchase });
    } catch (error) {
        await t.rollback();
        console.error('[DEBUG] createPurchase Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// Get Purchases
exports.getPurchases = async (req, res) => {
    try {
        const { status } = req.query;
        const whereClause = {};
        if (status) whereClause.status = status;

        const purchases = await Purchase.findAll({
            where: whereClause,
            include: [
                { model: PurchaseItem, as: 'details', include: ['product'] },
                { model: User, as: 'creator', attributes: ['username', 'full_name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Approve by Admin GM
exports.approveAdminGm = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id);

        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        if (purchase.status !== 'pending_admin_gm') {
            return res.status(400).json({ message: 'Invalid status for Admin GM approval' });
        }

        purchase.status = 'pending_gm';
        purchase.approved_admin_gm_at = new Date();
        await purchase.save({ transaction: t });

        // Notify GM via WA
        const gms = await User.findAll({ where: { role: 'gm' } });
        for (const gm of gms) {
            await Notification.create({
                user_id: gm.id,
                title: 'Persetujuan Admin GM',
                message: `Pembelian ${purchase.invoice_number} diteruskan oleh Admin GM.`,
                type: 'info',
                related_id: purchase.id
            }, { transaction: t });

            if (gm.whatsapp) {
                const message = `🛡️ *PERSETUJUAN ADMIN GM*\n\n` +
                    `Pembelian ${purchase.invoice_number} telah disetujui Admin GM dan memerlukan persetujuan akhir Anda.\n\n` +
                    `Supplier: ${purchase.supplier_name}\n` +
                    `Total: Rp ${parseFloat(purchase.total_amount).toLocaleString('id-ID')}`;
                await sendWANotification(gm.whatsapp, message);
            }
        }

        await t.commit();
        res.json({ message: 'Approved by Admin GM', purchase });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve by GM
exports.approveGm = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id);

        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        if (purchase.status !== 'pending_gm') {
            return res.status(400).json({ message: 'Invalid status for GM approval' });
        }

        purchase.status = 'approved_gm';
        purchase.approved_gm_at = new Date();
        await purchase.save({ transaction: t });

        // Notify Finance via WA
        const financeUsers = await User.findAll({ where: { role: 'keuangan' } });
        for (const finance of financeUsers) {
            await Notification.create({
                user_id: finance.id,
                title: 'Pembelian Disetujui GM',
                message: `Pembelian ${purchase.invoice_number} disetujui GM. Siap dicairkan.`,
                type: 'success',
                related_id: purchase.id
            }, { transaction: t });

            if (finance.whatsapp) {
                const message = `💰 *PEMBELIAN DISETUJUI GM*\n\n` +
                    `Pembelian ${purchase.invoice_number} telah disetujui GM.\n\n` +
                    `Supplier: ${purchase.supplier_name}\n` +
                    `Total: Rp ${parseFloat(purchase.total_amount).toLocaleString('id-ID')}\n` +
                    `_Silakan cek menu pembayaran untuk proses pencairan._`;
                await sendWANotification(finance.whatsapp, message);
            }
        }

        await t.commit();
        res.json({ message: 'Approved by GM', purchase });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error' });
    }
};

// Process by Finance (Disburse & Stock Update)
exports.processFinance = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { payment_method, fund_source, bank_name, transfer_reference_number, account_holder_name, completed_at } = req.body;
        const transfer_proof_image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const purchase = await Purchase.findByPk(id, { include: ['details'] });

        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        if (purchase.status !== 'approved_gm') {
            return res.status(400).json({ message: 'Invalid status for Finance processing' });
        }

        purchase.status = 'completed';
        purchase.payment_method = payment_method;
        purchase.fund_source = fund_source || null;
        purchase.bank_name = bank_name || null;
        purchase.transfer_reference_number = transfer_reference_number || null;
        purchase.account_holder_name = account_holder_name || null;
        purchase.transfer_proof_image = transfer_proof_image || null;
        purchase.completed_at = completed_at ? new Date(completed_at) : new Date();

        await purchase.save({ transaction: t });

        // Update Stock
        for (const item of purchase.details) {
            const product = await Product.findByPk(item.product_id);
            if (product) {
                product.stock += item.quantity;
                await product.save({ transaction: t });
            }
        }

        // Notify Purchasing Admin via WA
        const creator = await User.findByPk(purchase.created_by_id);
        await Notification.create({
            user_id: purchase.created_by_id,
            title: 'Pembelian Selesai',
            message: `Pembelian ${purchase.invoice_number} telah dibayar dan stok diperbarui.`,
            type: 'success',
            related_id: purchase.id
        }, { transaction: t });

        if (creator && creator.whatsapp) {
            const message = `✅ *PEMBELIAN SELESAI*\n\n` +
                `No INV: ${purchase.invoice_number}\n` +
                `Status: TELAH DIBAYAR\n` +
                `Stok barang telah otomatis diperbarui ke sistem.`;
            await sendWANotification(creator.whatsapp, message);
        }

        await t.commit();
        res.json({ message: 'Purchase completed, stock updated', purchase });
    } catch (error) {
        await t.rollback();
        console.error('[DEBUG] processFinance Error:', error);
        res.status(500).json({ message: 'Server error during finance processing', error: error.message, stack: error.stack });
    }
};

// Reject
exports.rejectPurchase = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const purchase = await Purchase.findByPk(id);

        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

        purchase.status = 'rejected';
        purchase.rejection_reason = reason;
        await purchase.save({ transaction: t });

        // Notify Creator via WA
        const creator = await User.findByPk(purchase.created_by_id);
        await Notification.create({
            user_id: purchase.created_by_id,
            title: 'Pembelian Ditolak',
            message: `Pembelian ${purchase.invoice_number} ditolak. Alasan: ${reason}`,
            type: 'danger',
            related_id: purchase.id
        }, { transaction: t });

        if (creator && creator.whatsapp) {
            const message = `❌ *PEMBELIAN DITOLAK*\n\n` +
                `No INV: ${purchase.invoice_number}\n` +
                `Alasan: ${reason}`;
            await sendWANotification(creator.whatsapp, message);
        }

        await t.commit();
        res.json({ message: 'Purchase rejected', purchase });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error' });
    }
};
