const { pool } = require('./db');
async function test() {
    try {
        console.log('--- TABLES ---');
        const tables = await pool.query("SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_name = 'registration'");
        console.log(JSON.stringify(tables.rows, null, 2));

        console.log('--- COLUMNS ---');
        const cols = await pool.query("SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_name = 'registration'");
        console.log(JSON.stringify(cols.rows, null, 2));

        console.log('--- BPS CHECK ---');
        try {
            await pool.query('SELECT bps FROM registration LIMIT 1');
            console.log('SELECT bps SUCCESS');
        } catch (e) {
            console.log('SELECT bps FAILED:', e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
