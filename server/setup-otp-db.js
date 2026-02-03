const { pool } = require('./db');

async function setupOTPTable() {
    try {
        console.log('Checking for otp_verifications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255),
                phone VARCHAR(50),
                code VARCHAR(10) NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table otp_verifications is ready.');
        process.exit(0);
    } catch (err) {
        console.error('Error setting up OTP table:', err);
        process.exit(1);
    }
}

setupOTPTable();
