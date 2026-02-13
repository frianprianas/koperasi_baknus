const { Purchase, TransportRequest, sequelize } = require('./models');

async function checkData() {
    try {
        const purchases = await Purchase.findAll({
            where: { status: 'completed' },
            attributes: ['id', 'invoice_number', 'status', 'createdAt', 'completed_at', 'payment_method', 'total_amount']
        });
        console.log('--- Completed Purchases ---');
        console.table(purchases.map(p => p.toJSON()));

        const transports = await TransportRequest.findAll({
            where: { status: 'completed' },
            attributes: ['id', 'invoice_number', 'status', 'createdAt', 'completed_at', 'payment_method', 'total_amount']
        });
        console.log('--- Completed Transport Requests ---');
        console.table(transports.map(t => t.toJSON()));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
