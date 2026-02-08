const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Role check not strictly needed for generic login, but useful payload
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                whatsapp: user.whatsapp
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.register = async (req, res) => {
    // Only for dev/admin use
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword, role });
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        // Only return non-master roles as requested
        const { Op } = require('sequelize');
        const users = await User.findAll({
            where: {
                role: { [Op.ne]: 'master_admin' }
            },
            attributes: ['id', 'username', 'role', 'full_name', 'whatsapp']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, full_name, whatsapp } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        if (full_name !== undefined) user.full_name = full_name;
        if (whatsapp !== undefined) user.whatsapp = whatsapp;

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

