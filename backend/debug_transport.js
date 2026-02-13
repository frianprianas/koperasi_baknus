const { TransportRequest, sequelize } = require('./models');

async function debugTransport() {
    try {
        const startDate = '2026-02-01';
        const endDate = '2026-02-14'; // Besok
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const { Op } = require('sequelize');

        // Check 1: All completed
        const allCompleted = await TransportRequest.findAll({
            where: { status: 'completed' }
        });
        console.log('--- ALL COMPLETED TRANSPORT ---');
        allCompleted.forEach(t => {
            console.log(`ID: ${t.id}, Amount: ${t.total_amount}, Created: ${t.createdAt}, Completed: ${t.completed_at}`);
        });

        // Check 2: Filter Logic
        const filtered = await TransportRequest.findAll({
            where: {
                status: 'completed',
                completed_at: {
                    [Op.between]: [start, end]
                }
            }
        });
        console.log(`--- FILTERED (${start.toISOString()} - ${end.toISOString()}) ---`);
        console.log(`Found: ${filtered.length}`);
        filtered.forEach(t => {
            console.log(`ID: ${t.id}, Amount: ${t.total_amount}, Completed: ${t.completed_at}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

debugTransport();
