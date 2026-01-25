const { pool } = require('./db');
async function list() {
    try {
        const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'otp_verifications'");
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.is_nullable}`));
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}
list();
