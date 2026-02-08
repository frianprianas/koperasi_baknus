const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
    invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    transaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_type: {
        type: DataTypes.ENUM('cash', 'transfer', 'piutang'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
        defaultValue: 'pending' // 'completed' if Cash/Transfer (auto), 'pending' if Piutang
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    proof_of_payment: {
        type: DataTypes.STRING, // path/URL to uploaded file
        allowNull: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

// Relationships
Transaction.belongsTo(User, { as: 'createdBy', foreignKey: 'created_by_id' }); // Sales Admin
Transaction.belongsTo(User, { as: 'approvedBy', foreignKey: 'approved_by_id' }); // Finance (if needed)

module.exports = Transaction;
