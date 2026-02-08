const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Transaction = require('./Transaction');

const TransactionItem = sequelize.define('TransactionItem', {
    item_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
});

// Relationships
Transaction.hasMany(TransactionItem, { as: 'items', foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });

module.exports = TransactionItem;
