const { pool } = require('./db');
async function list() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'medical_cards'");
        console.log('Columns:');
        res.rows.forEach(r => console.log(r.column_name));
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}
list();
