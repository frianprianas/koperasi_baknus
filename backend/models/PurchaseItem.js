const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Purchase = require('./Purchase');
const Product = require('./Product');

const PurchaseItem = sequelize.define('PurchaseItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    buy_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
});

Purchase.hasMany(PurchaseItem, { as: 'items', foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = PurchaseItem;
