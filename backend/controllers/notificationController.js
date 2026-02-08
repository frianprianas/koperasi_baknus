const { Notification } = require('../models');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                // Return notifications for the specific user OR for their role
                [require('sequelize').Op.or]: [
                    { user_id: req.user.id },
                    { role: req.user.role }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        await Notification.update({ is_read: true }, {
            where: { id: req.params.id }
        });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.update({ is_read: true }, {
            where: {
                [require('sequelize').Op.or]: [
                    { user_id: req.user.id },
                    { role: req.user.role }
                ]
            }
        });
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                [require('sequelize').Op.or]: [
                    { user_id: req.user.id },
                    { role: req.user.role }
                ],
                is_read: false
            }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

