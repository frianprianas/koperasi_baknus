const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
    try {
        await sequelize.sync({ alter: true }); // Ensure schema is updated

        const users = [
            { username: 'admin_sales', password: 'password123', role: 'admin_penjualan' },
            { username: 'finance', password: 'password123', role: 'keuangan' },
            { username: 'gm_user', password: 'password123', role: 'gm' },
            { username: 'admin_purchase', password: 'password123', role: 'admin_pembelian' },
            { username: 'admin_gm', password: 'password123', role: 'admin_gm' }
        ];

        for (const user of users) {
            const existing = await User.findOne({ where: { username: user.username } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await User.create({ ...user, password: hashedPassword });
                console.log(`Created user: ${user.username}`);
            } else {
                console.log(`User ${user.username} already exists`);
            }
        }

        console.log('Seeding completed');
    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        process.exit();
    }
};

seedUsers();
