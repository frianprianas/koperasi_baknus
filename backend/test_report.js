const { Transaction, Purchase, TransportRequest, sequelize } = require('./models');
const { Op } = require('sequelize');

async function testReport() {
    try {
        const startDate = '2026-02-01';
        const endDate = '2026-02-13';

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        console.log(`Checking range: ${start.toISOString()} - ${end.toISOString()}`);

        const transactions = await Transaction.findAll({
            where: {
                status: { [Op.in]: ['approved', 'completed'] },
                payment_type: { [Op.in]: ['cash', 'transfer'] },
                createdAt: { [Op.between]: [start, end] }
            }
        });
        console.log(`Transactions found: ${transactions.length}`);

        const purchases = await Purchase.findAll({
            where: {
                status: 'completed',
                createdAt: { [Op.between]: [start, end] }
            }
        });
        console.log(`Purchases found: ${purchases.length}`);
        if (purchases.length === 0) {
            // Debug why
            const allPurchases = await Purchase.findAll();
            console.log('All purchases in DB:', allPurchases.map(p => ({
                id: p.id,
                status: p.status,
                createdAt: p.createdAt,
                completed_at: p.completed_at
            })));
        }

        const transportRequests = await TransportRequest.findAll({
            where: {
                status: 'completed',
                createdAt: { [Op.between]: [start, end] }
            }
        });
        console.log(`Transport Requests found: ${transportRequests.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

testReport();
