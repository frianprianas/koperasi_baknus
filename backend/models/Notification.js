const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // If null, maybe it's for a specific role or everyone
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true, // Target role
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'danger'),
        defaultValue: 'info'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    related_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of related transaction e.g.
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;
