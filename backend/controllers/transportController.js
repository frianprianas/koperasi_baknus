const { TransportRequest, User, Notification, sequelize } = require('../models');
const { sendWANotification } = require('../utils/waNotification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config for transport
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/transport';
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
exports.upload = upload.single('proof'); // For general proof or transfer proof

// 1. Create Transport Request
exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            driver_name, vehicle_plate, labor_cost, fuel_cost,
            maintenance_cost, maintenance_description, invoice_number
        } = req.body;

        const receipt_image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Calculate total
        const total = parseFloat(labor_cost || 0) + parseFloat(fuel_cost || 0) + parseFloat(maintenance_cost || 0);

        if (total <= 0) {
            return res.status(400).json({ message: 'Total costs must be greater than 0' });
        }

        const transport = await TransportRequest.create({
            invoice_number: invoice_number || `INV-TRP-${Date.now()}`,
            driver_name,
            vehicle_plate,
            labor_cost,
            fuel_cost,
            maintenance_cost,
            maintenance_description,
            total_amount: total,
            receipt_image: receipt_image,
            created_by_id: req.user.id,
            status: 'pending_admin_gm'
        }, { transaction: t });

        // Notify Admin GM via WA
        const adminGms = await User.findAll({ where: { role: 'admin_gm' } });
        for (const admin of adminGms) {
            await Notification.create({
                user_id: admin.id,
                title: 'Pengajuan Biaya Angkutan Baru',
                message: `Biaya Angkutan ${transport.invoice_number} sebesar Rp ${total.toLocaleString('id-ID')} perlu persetujuan.`,
                type: 'info',
                related_id: transport.id,
                is_read: false
            }, { transaction: t });

            if (admin.whatsapp) {
                const message = `🚚 *PENGAJUAN ANGKUTAN BARU*\n\n` +
                    `No INV: ${transport.invoice_number}\n` +
                    `Driver: ${transport.driver_name}\n` +
                    `Total: Rp ${transport.total_amount.toLocaleString('id-ID')}\n\n` +
                    `_Mohon segera dijawab melalui sistem Baknus._`;
                await sendWANotification(admin.whatsapp, message);
            }
        }

        await t.commit();
        res.status(201).json({ message: 'Transport request created successfully', transport });
    } catch (error) {
        await t.rollback();
        console.error('Create Transport Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Get All
exports.getAll = async (req, res) => {
    try {
        const requests = await TransportRequest.findAll({
            include: [{ model: User, as: 'creator', attributes: ['username', 'full_name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 3. Approve Admin GM
exports.approveAdminGm = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const request = await TransportRequest.findByPk(id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending_admin_gm') {
            return res.status(400).json({ message: 'Invalid status for Admin GM approval' });
        }

        request.status = 'pending_gm';
        request.approved_admin_gm_at = new Date();
        await request.save({ transaction: t });

        // Notify GM via WA
        const gms = await User.findAll({ where: { role: 'gm' } });
        for (const gm of gms) {
            await Notification.create({
                user_id: gm.id,
                title: 'Persetujuan Biaya Angkutan (Admin GM)',
                message: `Pengajuan ${request.invoice_number} diteruskan oleh Admin GM.`,
                type: 'info',
                related_id: request.id
            }, { transaction: t });

            if (gm.whatsapp) {
                const message = `🛡️ *ANGKUTAN DISETUJUI ADMIN GM*\n\n` +
                    `Pengajuan ${request.invoice_number} telah disetujui Admin GM dan diteruskan kepada Anda.\n\n` +
                    `Driver: ${request.driver_name}\n` +
                    `Total: Rp ${parseFloat(request.total_amount).toLocaleString('id-ID')}`;
                await sendWANotification(gm.whatsapp, message);
            }
        }

        await t.commit();
        res.json({ message: 'Approved by Admin GM', request });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 4. Approve GM
exports.approveGm = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const request = await TransportRequest.findByPk(id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending_gm') {
            return res.status(400).json({ message: 'Invalid status for GM approval' });
        }

        request.status = 'approved_gm';
        request.approved_gm_at = new Date();
        await request.save({ transaction: t });

        // Notify Finance via WA
        const financeUsers = await User.findAll({ where: { role: 'keuangan' } });
        for (const finance of financeUsers) {
            await Notification.create({
                user_id: finance.id,
                title: 'Biaya Angkutan Disetujui GM',
                message: `Pengajuan ${request.invoice_number} disetujui GM. Siap dicairkan.`,
                type: 'success',
                related_id: request.id
            }, { transaction: t });

            if (finance.whatsapp) {
                const message = `💰 *ANGKUTAN DISETUJUI GM*\n\n` +
                    `Biaya Angkutan ${request.invoice_number} telah disetujui GM.\n\n` +
                    `Driver: ${request.driver_name}\n` +
                    `Total: Rp ${parseFloat(request.total_amount).toLocaleString('id-ID')}\n` +
                    `_Silakan cairkan melalui menu pembayaran._`;
                await sendWANotification(finance.whatsapp, message);
            }
        }

        await t.commit();
        res.json({ message: 'Approved by GM', request });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 5. Process Finance
exports.processFinance = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { payment_method, fund_source, bank_name, transfer_reference_number, account_holder_name, completed_at } = req.body;
        const transfer_proof_image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const request = await TransportRequest.findByPk(id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'approved_gm') {
            return res.status(400).json({ message: 'Invalid status for Finance processing' });
        }

        request.status = 'completed';
        request.payment_method = payment_method;
        request.fund_source = fund_source || null;
        request.bank_name = bank_name || null;
        request.transfer_reference_number = transfer_reference_number || null;
        request.account_holder_name = account_holder_name || null;
        request.transfer_proof_image = transfer_proof_image || null;
        request.completed_at = completed_at ? new Date(completed_at) : new Date();

        await request.save({ transaction: t });

        // Notify Creator via WA
        const creator = await User.findByPk(request.created_by_id);
        await Notification.create({
            user_id: request.created_by_id,
            title: 'Biaya Angkutan Cair',
            message: `Pengajuan ${request.invoice_number} telah dicairkan oleh Keuangan.`,
            type: 'success',
            related_id: request.id
        }, { transaction: t });

        if (creator && creator.whatsapp) {
            const message = `✅ *DANA ANGKUTAN CAIR*\n\n` +
                `No INV: ${request.invoice_number}\n` +
                `Total: Rp ${parseFloat(request.total_amount).toLocaleString('id-ID')}\n` +
                `Status: TELAH DIBAYAR / CAIR`;
            await sendWANotification(creator.whatsapp, message);
        }

        await t.commit();
        res.json({ message: 'Disbursed successfully', request });
    } catch (error) {
        await t.rollback();
        console.error('Transport Finance Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 6. Reject
exports.reject = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const request = await TransportRequest.findByPk(id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'rejected';
        request.rejection_reason = reason;
        await request.save({ transaction: t });

        // Notify Creator via WA
        const creator = await User.findByPk(request.created_by_id);
        await Notification.create({
            user_id: request.created_by_id,
            title: 'Biaya Angkutan Ditolak',
            message: `Pengajuan ${request.invoice_number} ditolak. Alasan: ${reason}`,
            type: 'danger',
            related_id: request.id
        }, { transaction: t });

        if (creator && creator.whatsapp) {
            const message = `❌ *BIAYA ANGKUTAN DITOLAK*\n\n` +
                `No INV: ${request.invoice_number}\n` +
                `Alasan: ${reason}`;
            await sendWANotification(creator.whatsapp, message);
        }

        await t.commit();
        res.json({ message: 'Request rejected', request });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
