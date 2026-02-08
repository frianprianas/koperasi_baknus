const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function seedMasterAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('master123', 10);

        // Use findOrCreate to avoid duplicates
        const [user, created] = await User.findOrCreate({
            where: { username: 'master_admin' },
            defaults: {
                password: hashedPassword,
                role: 'master_admin',
                full_name: 'Super Administrator',
                whatsapp: '628123456789'
            }
        });

        if (created) {
            console.log('Master Admin created successfully!');
        } else {
            console.log('Master Admin already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error seeding Master Admin:', error);
        process.exit(1);
    }
}

seedMasterAdmin();
