const { pool } = require('./db');
async function checkCount() {
    try {
        const res = await pool.query('SELECT count(*) FROM registration');
        console.log('Registration count:', res.rows[0].count);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkCount();
