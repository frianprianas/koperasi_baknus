const { Transaction, TransactionItem, User, Notification, Product } = require('../models');
const { Op } = require('sequelize');
const { sendWANotification } = require('../utils/waNotification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads';
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

exports.upload = upload.single('proof'); // 'proof' field name

exports.createTransaction = async (req, res) => {
    const { total_amount, payment_type, items, status, customer_name, created_by } = req.body;
    const proof_of_payment = req.file ? req.file.path.replace(/\\/g, '/') : null;

    try {
        const transaction = await Transaction.create({
            invoice_number: `INV-${Date.now()}`,
            total_amount,
            payment_type,
            status: 'pending', // All transactions require Finance approval
            proof_of_payment,
            customer_name,
            created_by_id: created_by // Should come from JWT or req.user
        });

        if (items && items.length > 0) {
            // Parse items if stringified (often with FormData)
            const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

            const transactionItems = parsedItems.map(item => ({
                ...item,
                transaction_id: transaction.id,
                subtotal: item.quantity * item.price
            }));
            await TransactionItem.bulkCreate(transactionItems);

            // Update Stock
            for (const item of parsedItems) {
                const product = await Product.findOne({ where: { name: item.item_name } });
                if (product) {
                    product.stock -= item.quantity;
                    await product.save();
                }
            }
        }

        // Create Notifications
        await Notification.bulkCreate([
            {
                role: 'keuangan',
                title: 'Transaksi Baru',
                message: `Ada transaksi baru ${transaction.invoice_number} sebesar Rp ${parseFloat(total_amount).toLocaleString('id-ID')} perlu diperiksa.`,
                type: 'info',
                related_id: transaction.id
            },
            {
                role: 'gm',
                title: 'Laporan Penjualan Baru',
                message: `Sales Admin telah memasukkan transaksi ${transaction.invoice_number} senilai Rp ${parseFloat(total_amount).toLocaleString('id-ID')}.`,
                type: 'info',
                related_id: transaction.id
            }
        ]);

        // Send WhatsApp Notification to Finance
        const financeUser = await User.findOne({ where: { role: 'keuangan' } });
        if (financeUser && financeUser.whatsapp) {
            const waMessage = `Kepada : Bagian Keuangan\n\n` +
                `*TRANSAKSI BARU PERLU PERSETUJUAN*\n\n` +
                `No. Invoice: ${transaction.invoice_number}\n` +
                `Pelanggan: ${customer_name}\n` +
                `Total: Rp ${parseFloat(total_amount).toLocaleString('id-ID')}\n` +
                `Pembayaran: ${payment_type}\n\n` +
                `Mohon segera diperiksa di sistem Koperasi Baknus.\n\n` +
                `_Notifikasi otomatis dari Aplikasi Koprasi Baknus_`;
            await sendWANotification(financeUser.whatsapp, waMessage);
        }

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: User, as: 'sales_admin', attributes: ['username'] },
                { model: TransactionItem, as: 'details' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSalesStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const stats = {
            todaySales: await Transaction.sum('total_amount', {
                where: {
                    created_by_id: userId,
                    status: { [Op.in]: ['approved', 'completed'] },
                    createdAt: { [Op.gte]: today }
                }
            }) || 0,
            monthSales: await Transaction.sum('total_amount', {
                where: {
                    created_by_id: userId,
                    status: { [Op.in]: ['approved', 'completed'] },
                    createdAt: { [Op.gte]: firstDayOfMonth }
                }
            }) || 0,
            pendingCount: await Transaction.count({
                where: { created_by_id: userId, status: 'pending' }
            }),
            rejectedCount: await Transaction.count({
                where: { created_by_id: userId, status: 'rejected' }
            })
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPiutang = async (req, res) => {
    try {
        const userId = req.user.id;
        const piutang = await Transaction.findAll({
            where: {
                created_by_id: userId,
                payment_type: 'piutang',
                status: { [Op.not]: 'completed' }
            },
            include: [{ model: TransactionItem, as: 'details' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(piutang);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveTransaction = async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason, approved_by } = req.body; // status: 'approved' or 'rejected'

    try {
        const transaction = await Transaction.findByPk(id);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (status === 'approved') {
            transaction.approved_at = new Date();
            // Business Logic:
            // 1. If Cash / Transfer -> Immediately 'completed' because money is received/proof exist
            // 2. If Piutang but has proof -> 'completed' (Repayment)
            // 3. If Piutang no proof -> 'approved' (Debt acknowledged)
            if (transaction.payment_type === 'cash' || transaction.payment_type === 'transfer' || (transaction.payment_type === 'piutang' && transaction.proof_of_payment)) {
                transaction.status = 'completed';
            } else {
                transaction.status = 'approved';
            }
        } else {
            transaction.status = status; // e.g. 'rejected'
        }
        transaction.approved_by_id = approved_by;
        await transaction.save();

        const finalStatus = transaction.status;

        // Create notification for Sales Admin
        await Notification.create({
            user_id: transaction.created_by_id,
            title: status === 'approved' ? (finalStatus === 'completed' ? 'Pembayaran Selesai' : 'Hutang Disetujui') : 'Transaksi Ditolak',
            message: status === 'approved'
                ? `Transaksi ${transaction.invoice_number} ${finalStatus === 'completed' ? 'telah lunas/selesai.' : 'telah disetujui sebagai piutang.'}`
                : `Transaksi ${transaction.invoice_number} ditolak. Alasan: ${rejection_reason}`,
            type: status === 'approved' ? 'success' : 'danger',
            related_id: transaction.id
        });

        // Trigger notification logic here (e.g. websocket or email) for GM/Finance

        // Send WhatsApp Notifications
        if (status === 'approved') {
            const gmUser = await User.findOne({ where: { role: 'gm' } });
            if (gmUser && gmUser.whatsapp) {
                const waMessage = `Kepada : General Manager\n\n` +
                    `*TRANSAKSI ${finalStatus === 'completed' ? 'SELESAI' : 'DISETUJUI'}*\n\n` +
                    `No. Invoice: ${transaction.invoice_number}\n` +
                    `Pelanggan: ${transaction.customer_name}\n` +
                    `Total: Rp ${parseFloat(transaction.total_amount).toLocaleString('id-ID')}\n` +
                    `Status: ${finalStatus === 'completed' ? 'LUNAS/SELESAI' : 'PIUTANG (DISETUJUI)'}\n\n` +
                    `_Notifikasi otomatis dari Aplikasi Koprasi Baknus_`;
                await sendWANotification(gmUser.whatsapp, waMessage);
            }
        } else if (status === 'rejected') {
            const salesAdmin = await User.findByPk(transaction.created_by_id);
            if (salesAdmin && salesAdmin.whatsapp) {
                const waMessage = `Kepada : Admin Sales\n\n` +
                    `*TRANSAKSI DITOLAK*\n\n` +
                    `No. Invoice: ${transaction.invoice_number}\n` +
                    `Total: Rp ${parseFloat(transaction.total_amount).toLocaleString('id-ID')}\n` +
                    `Alasan: ${rejection_reason}\n\n` +
                    `Mohon segera diperbaiki dan diajukan ulang di sistem.\n\n` +
                    `_Notifikasi otomatis dari Aplikasi Koprasi Baknus_`;
                await sendWANotification(salesAdmin.whatsapp, waMessage);
            }
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [{ model: TransactionItem, as: 'details' }]
        });
        if (!transaction) return res.status(404).json({ error: `Transaction with ID ${req.params.id} not found in DB` });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; // Added missing semicolon

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { total_amount, payment_type, items, customer_name } = req.body;
    const proof_of_payment = req.file ? req.file.path.replace(/\\/g, '/') : undefined;

    try {
        const transaction = await Transaction.findByPk(id);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        // Only allow update if pending or rejected (but we are targeting rejected)
        if (transaction.status === 'approved' || transaction.status === 'completed') {
            return res.status(400).json({ error: 'Cannot update approved or completed transactions' });
        }

        transaction.total_amount = total_amount;
        transaction.payment_type = payment_type;
        transaction.customer_name = customer_name;
        transaction.status = 'pending'; // Reset status to pending for re-approval
        transaction.rejection_reason = null; // Clear rejection reason

        if (proof_of_payment) {
            transaction.proof_of_payment = proof_of_payment;
        }

        await transaction.save();

        if (items && items.length > 0) {
            // Restore old stock before deleting old items
            const oldItems = await TransactionItem.findAll({ where: { transaction_id: id } });
            for (const oldItem of oldItems) {
                const product = await Product.findOne({ where: { name: oldItem.item_name } });
                if (product) {
                    product.stock += oldItem.quantity;
                    await product.save();
                }
            }

            // Delete old items and recreate
            await TransactionItem.destroy({ where: { transaction_id: id } });

            const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
            const transactionItems = parsedItems.map(item => ({
                ...item,
                transaction_id: transaction.id,
                subtotal: item.quantity * item.price
            }));
            await TransactionItem.bulkCreate(transactionItems);

            // Deduct new stock
            for (const newItem of parsedItems) {
                const product = await Product.findOne({ where: { name: newItem.item_name } });
                if (product) {
                    product.stock -= newItem.quantity;
                    await product.save();
                }
            }
        }

        // Notify Finance and GM about resubmission
        await Notification.bulkCreate([
            {
                role: 'keuangan',
                title: 'Transaksi Diajukan Kembali',
                message: `Transaksi ${transaction.invoice_number} telah diperbaiki oleh Sales Admin dan diajukan ulang.`,
                type: 'warning',
                related_id: transaction.id
            },
            {
                role: 'gm',
                title: 'Update Transaksi Rejected',
                message: `Transaksi ${transaction.invoice_number} yang sebelumnya ditolak telah diperbarui.`,
                related_id: transaction.id
            }
        ]);

        // Send WhatsApp Notification to Finance for Re-submission
        const financeUser = await User.findOne({ where: { role: 'keuangan' } });
        if (financeUser && financeUser.whatsapp) {
            const waMessage = `Kepada : Bagian Keuangan\n\n` +
                `*TRANSAKSI DIAJUKAN ULANG*\n\n` +
                `No. Invoice: ${transaction.invoice_number}\n` +
                `Pelanggan: ${transaction.customer_name}\n` +
                `Total: Rp ${parseFloat(total_amount).toLocaleString('id-ID')}\n\n` +
                `Admin Sales telah memperbaiki transaksi yang sebelumnya ditolak. Mohon periksa kembali.\n\n` +
                `_Notifikasi otomatis dari Aplikasi Koprasi Baknus_`;
            await sendWANotification(financeUser.whatsapp, waMessage);
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payPiutang = async (req, res) => {
    const { id } = req.params;
    const proof_of_payment = req.file ? req.file.path.replace(/\\/g, '/') : null;

    if (!proof_of_payment) return res.status(400).json({ error: 'Bukti pembayaran wajib dilampirkan.' });

    try {
        const transaction = await Transaction.findByPk(id);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (transaction.payment_type !== 'piutang') {
            return res.status(400).json({ error: 'Hanya transaksi piutang yang dapat melakukan pelunasan lewat menu ini.' });
        }

        transaction.proof_of_payment = proof_of_payment;
        transaction.status = 'pending'; // Back to pending for finance to verify payment
        transaction.rejection_reason = null;
        await transaction.save();

        // Notify Finance
        await Notification.create({
            role: 'keuangan',
            title: 'Pelunasan Piutang',
            message: `Ada pelunasan piutang untuk ${transaction.invoice_number} sebesar Rp ${parseFloat(transaction.total_amount).toLocaleString('id-ID')}. Perlu verifikasi.`,
            type: 'warning',
            related_id: transaction.id
        });

        // WhatsApp to Finance
        const financeUser = await User.findOne({ where: { role: 'keuangan' } });
        if (financeUser && financeUser.whatsapp) {
            const waMessage = `Kepada : Bagian Keuangan\n\n` +
                `*PELUNASAN PIUTANG PERLU VERIFIKASI*\n\n` +
                `No. Invoice: ${transaction.invoice_number}\n` +
                `Pelanggan: ${transaction.customer_name}\n` +
                `Total: Rp ${parseFloat(transaction.total_amount).toLocaleString('id-ID')}\n\n` +
                `Admin Sales telah mengunggah bukti pelunasan. Mohon segera diperiksa.\n\n` +
                `_Notifikasi otomatis dari Aplikasi Koprasi Baknus_`;
            await sendWANotification(financeUser.whatsapp, waMessage);
        }

        res.json({ message: 'Bukti pelunasan berhasil diunggah. Menunggu verifikasi keuangan.', transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
