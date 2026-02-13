const { Transaction, Purchase, TransportRequest, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getCashFlow = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        // Ensure end includes the full day
        end.setHours(23, 59, 59, 999);

        // Fetch Income (Sales Transactions)
        // Include both 'approved' and 'completed' transactions
        const transactions = await Transaction.findAll({
            where: {
                status: { [Op.in]: ['approved', 'completed'] },
                payment_type: { [Op.in]: ['cash', 'transfer'] },
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'invoice_number', 'total_amount', 'payment_type', 'createdAt', 'customer_name']
        });

        // Fetch Expense (Purchases)
        // Only 'completed' purchases count as expense (processed by finance)
        const purchases = await Purchase.findAll({
            where: {
                status: 'completed',
                completed_at: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'invoice_number', 'total_amount', 'payment_method', 'createdAt', 'completed_at', 'supplier_name']
        });

        // Fetch Expense (Transport Requests)
        const transportRequests = await TransportRequest.findAll({
            where: {
                status: 'completed',
                completed_at: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'invoice_number', 'total_amount', 'payment_method', 'createdAt', 'completed_at', 'driver_name', 'vehicle_plate']
        });

        // Combine and Normalize Data
        const cashFlow = [];

        transactions.forEach(t => {
            cashFlow.push({
                id: `SALE-${t.id}`,
                date: t.createdAt, // Sales use transaction date
                type: 'IN',
                description: `Penjualan - ${t.customer_name || 'Umum'} (${t.invoice_number})`,
                amount: parseFloat(t.total_amount),
                method: t.payment_type
            });
        });

        purchases.forEach(p => {
            cashFlow.push({
                id: `PUR-${p.id}`,
                date: p.completed_at || p.createdAt, // Use completed_at for expense date
                type: 'OUT',
                description: `Pembelian - ${p.supplier_name || 'Supplier'} (${p.invoice_number})`,
                amount: parseFloat(p.total_amount),
                method: p.payment_method
            });
        });

        transportRequests.forEach(tr => {
            cashFlow.push({
                id: `TRP-${tr.id}`,
                date: tr.completed_at || tr.createdAt, // Use completed_at for expense date
                type: 'OUT',
                description: `Biaya Angkutan - ${tr.driver_name || 'Driver'} (${tr.vehicle_plate || '-'})`,
                amount: parseFloat(tr.total_amount),
                method: tr.payment_method
            });
        });

        // Sort by Date Descending
        cashFlow.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate Totals
        const totalIncome = transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
        const totalPurchase = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
        const totalTransport = transportRequests.reduce((sum, tr) => sum + parseFloat(tr.total_amount), 0);

        const totalExpense = totalPurchase + totalTransport;
        const balance = totalIncome - totalExpense;

        res.json({
            summary: {
                totalIncome,
                totalExpense,
                balance,
                breakdown: {
                    purchase: totalPurchase,
                    transport: totalTransport
                }
            },
            details: cashFlow
        });

    } catch (error) {
        console.error('Error fetching cash flow:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getGMDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`[DEBUG] GM Stats Check: Today=${today.toISOString()}, Month=${firstDayOfMonth.toISOString()}`);

        // --- Sales ---
        const salesToday = await Transaction.sum('total_amount', {
            where: {
                status: { [Op.in]: ['approved', 'completed'] },
                createdAt: { [Op.gte]: today }
            }
        });

        const salesMonth = await Transaction.sum('total_amount', {
            where: {
                status: { [Op.in]: ['approved', 'completed'] },
                createdAt: { [Op.gte]: firstDayOfMonth }
            }
        });

        // --- Purchases ---
        const purchaseToday = await Purchase.sum('total_amount', {
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: today }
            }
        });

        const purchaseMonth = await Purchase.sum('total_amount', {
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: firstDayOfMonth }
            }
        });

        // --- Transport Costs ---
        const transportToday = await TransportRequest.sum('total_amount', {
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: today }
            }
        });

        const transportMonth = await TransportRequest.sum('total_amount', {
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: firstDayOfMonth }
            }
        });

        // --- Pending Approvals (GM Focus) ---
        // Items waiting for GM Approval specifically
        const pendingPurchaseGM = await Purchase.count({ where: { status: 'pending_gm' } });
        const pendingTransportGM = await TransportRequest.count({ where: { status: 'pending_gm' } });

        res.json({
            sales: {
                today: salesToday || 0,
                month: salesMonth || 0
            },
            expense: {
                purchase: {
                    today: purchaseToday || 0,
                    month: purchaseMonth || 0
                },
                transport: {
                    today: transportToday || 0,
                    month: transportMonth || 0
                }
            },
            pending: {
                purchase: pendingPurchaseGM,
                transport: pendingTransportGM,
                total: pendingPurchaseGM + pendingTransportGM
            }
        });

    } catch (error) {
        console.error('Error fetching GM stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
