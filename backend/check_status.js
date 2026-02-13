const { Purchase, TransportRequest, sequelize } = require('./models');

async function checkData() {
    try {
        const purchases = await Purchase.findAll({
            attributes: ['id', 'invoice_number', 'status', 'createdAt', 'total_amount']
        });
        console.log('--- Purchases ---');
        console.table(purchases.map(p => p.toJSON()));

        const transports = await TransportRequest.findAll({
            attributes: ['id', 'invoice_number', 'status', 'createdAt', 'total_amount']
        });
        console.log('--- Transport Requests ---');
        console.table(transports.map(t => t.toJSON()));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
