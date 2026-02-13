const { TransportRequest, sequelize } = require('./models');

async function fixData() {
    try {
        const trs = await TransportRequest.findAll({
            where: { status: 'completed' }
        });

        console.log(`Found ${trs.length} completed transport requests`);

        for (const tr of trs) {
            console.log(`Updating ${tr.id} - ${tr.invoice_number}`);
            // Force completed_at to createdAt if null, just for testing
            if (!tr.completed_at) {
                tr.completed_at = tr.createdAt;
                await tr.save();
                console.log('Fixed completed_at');
            } else {
                console.log(`completed_at already set: ${tr.completed_at}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixData();
