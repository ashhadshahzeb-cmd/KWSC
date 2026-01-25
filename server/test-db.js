const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(config);

async function testConnection() {
    try {
        console.log('Connecting to database...');
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);
        await pool.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
