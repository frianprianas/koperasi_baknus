const { Transaction } = require('./models');

async function fixPaths() {
    try {
        const transactions = await Transaction.findAll();
        let fixedCount = 0;

        for (const tx of transactions) {
            if (tx.proof_of_payment && tx.proof_of_payment.includes('\\')) {
                const oldPath = tx.proof_of_payment;
                tx.proof_of_payment = oldPath.replace(/\\/g, '/');
                await tx.save();
                fixedCount++;
                console.log(`Fixed path: ${oldPath} -> ${tx.proof_of_payment}`);
            }
        }

        console.log(`Successfully fixed ${fixedCount} transaction paths.`);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing paths:', error);
        process.exit(1);
    }
}

fixPaths();
