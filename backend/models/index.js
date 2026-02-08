const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');
const Notification = require('./Notification');
const Product = require('./Product');
const Customer = require('./Customer');

// Define relationships
User.hasMany(Transaction, { foreignKey: 'created_by_id', as: 'sales' });
Transaction.belongsTo(User, { foreignKey: 'created_by_id', as: 'sales_admin' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// Finance/GM can approve, maybe track approval?
User.hasMany(Transaction, { foreignKey: 'approved_by_id', as: 'approved_transactions' });
Transaction.belongsTo(User, { foreignKey: 'approved_by_id', as: 'approver' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id', as: 'details' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });

module.exports = {
    sequelize,
    User,
    Transaction,
    TransactionItem,
    Notification,
    Product,
    Customer
};
