const { pool } = require('./db');
async function test() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'registration' ORDER BY ordinal_position");
        const cols = res.rows.map(r => r.column_name);
        console.log('SCHEMA_COLS:' + JSON.stringify(cols));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
