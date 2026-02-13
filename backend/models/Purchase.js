const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Purchase = sequelize.define('Purchase', {
    invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    supplier_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    purchase_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    proof_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending_admin_gm', 'pending_gm', 'approved_gm', 'completed', 'rejected'),
        defaultValue: 'pending_admin_gm'
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'transfer'),
        allowNull: true // Set by Finance when completing
    },
    // Finance Details
    fund_source: {
        type: DataTypes.ENUM('kas_kecil', 'dana_yayasan'),
        allowNull: true
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transfer_reference_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_holder_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transfer_proof_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    approved_admin_gm_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approved_gm_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

Purchase.belongsTo(User, { as: 'createdBy', foreignKey: 'created_by_id' }); // Purchasing Admin

module.exports = Purchase;
