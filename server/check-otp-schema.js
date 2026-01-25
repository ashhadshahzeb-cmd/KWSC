const { pool } = require('./db');
async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'otp_verifications'");
        console.log('OTP Table Columns:');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkSchema();
