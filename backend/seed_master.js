const { Product, Customer } = require('./models');

async function seed() {
    try {
        await Product.bulkCreate([
            { name: 'Buku Tulis Kiky', price: 5000, stock: 100, category: 'Alat Tulis' },
            { name: 'Pulpen Pilot G2', price: 15000, stock: 50, category: 'Alat Tulis' },
            { name: 'Seragam Pramuka Putera L', price: 125000, stock: 20, category: 'Seragam' },
            { name: 'Kaos Kaki Baknus', price: 15000, stock: 200, category: 'Atribut' },
            { name: 'Topi Baknus', price: 25000, stock: 50, category: 'Atribut' }
        ]);

        await Customer.bulkCreate([
            { name: 'Siswa Umum', phone: '-', address: 'Kampus Baknus', type: 'umum' },
            { name: 'Budi Santoso', phone: '08123456789', address: 'Jl. Merdeka No. 1', type: 'anggota' },
            { name: 'Siti Aminah', phone: '08987654321', address: 'Jl. Mawar No. 12', type: 'anggota' }
        ]);

        console.log('Master data seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
