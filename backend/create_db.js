const { Sequelize } = require('sequelize');

// Connect to default 'postgres' database to create the new database
const sequelize = new Sequelize('postgres', 'postgres', 'buhun666', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

async function createDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Postgres.');
    
    // Check if database exists
    const [results] = await sequelize.query("SELECT 1 FROM pg_database WHERE datname = 'koprasi_baknus'");
    
    if (results.length === 0) {
      await sequelize.query('CREATE DATABASE koprasi_baknus');
      console.log('Database koprasi_baknus created successfully.');
    } else {
      console.log('Database koprasi_baknus already exists.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

createDatabase();
