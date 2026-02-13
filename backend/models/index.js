const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');
const Notification = require('./Notification');
const Product = require('./Product');
const Customer = require('./Customer');
const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');
const TransportRequest = require('./TransportRequest');

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

// Purchase Relationships
User.hasMany(Purchase, { foreignKey: 'created_by_id', as: 'purchases' });
Purchase.belongsTo(User, { foreignKey: 'created_by_id', as: 'creator' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'details' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });

Product.hasMany(PurchaseItem, { foreignKey: 'product_id' });
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// TransportRequest Relationships
User.hasMany(TransportRequest, { foreignKey: 'created_by_id', as: 'transport_requests' });
TransportRequest.belongsTo(User, { foreignKey: 'created_by_id', as: 'creator' });


module.exports = {
    sequelize,
    User,
    Transaction,
    TransactionItem,
    Notification,
    Product,
    Customer,
    Purchase,
    PurchaseItem,
    TransportRequest
};
