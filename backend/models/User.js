const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin_penjualan', 'keuangan', 'gm', 'master_admin'),
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = User;
