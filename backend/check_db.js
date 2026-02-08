const { Transaction } = require('./models');
Transaction.findAll().then(txs => {
    console.log('Total Transactions:', txs.length);
    txs.forEach(t => console.log(`ID: ${t.id}, Invoice: ${t.invoice_number}, Status: ${t.status}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
