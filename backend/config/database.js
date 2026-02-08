const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('koprasi_baknus', 'postgres', 'buhun666', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
});

module.exports = sequelize;
