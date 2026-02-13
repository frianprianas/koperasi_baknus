const { TransportRequest, sequelize } = require('./models');

async function fixTransportData() {
    try {
        const trs = await TransportRequest.findAll({
            where: { status: 'completed' }
        });

        console.log(`Found ${trs.length} completed transport requests`);

        for (const tr of trs) {
            console.log(`Checking ${tr.id} - ${tr.invoice_number}`);
            let updated = false;

            if (!tr.payment_method) {
                console.log(' - Fixing payment_method to cash');
                tr.payment_method = 'cash';
                updated = true;
            }
            if (!tr.completed_at) {
                console.log(' - Fixing completed_at to createdAt');
                tr.completed_at = tr.createdAt;
                updated = true;
            }

            if (updated) {
                await tr.save();
                console.log(' - Saved updates');
            } else {
                console.log(' - No updates needed');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixTransportData();
