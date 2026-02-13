const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransportRequest = sequelize.define('TransportRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // User info
    created_by_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // Details
    driver_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vehicle_plate: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Costs
    labor_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    fuel_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    maintenance_cost: { // Perbaikan / Sparepart
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    maintenance_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },

    // Proofs
    receipt_image: { // Foto Bon/Struk/Nota
        type: DataTypes.STRING,
        allowNull: true
    },

    // Status Flow
    status: {
        type: DataTypes.ENUM('pending_admin_gm', 'pending_gm', 'approved_gm', 'completed', 'rejected'),
        defaultValue: 'pending_admin_gm'
    },
    rejection_reason: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Timestamps for Approvals
    approved_admin_gm_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approved_gm_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Finance / Disbursement Details
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'transfer'),
        allowNull: true
    },
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
    }
});

module.exports = TransportRequest;
