const { Customer } = require('../models');

exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({ order: [['name', 'ASC']] });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
