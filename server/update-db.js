const { pool } = require('./db');

async function update() {
    try {
        console.log('Updating database for OTP support...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                phone TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Database updated successfully!');
    } catch (err) {
        console.error('❌ Update failed:', err.message);
    } finally {
        await pool.end();
    }
}

update();
