const { pool } = require('./db');
async function test() {
    try {
        console.log('--- Testing Query by Emp_no 25772 ---');
        const res = await pool.query("SELECT * FROM Registration WHERE Emp_no = '25772'");
        console.log('Rows found:', res.rows.length);
        if (res.rows[0]) {
            console.log('Row data:', JSON.stringify(res.rows[0], null, 2));
            console.log('Column keys:', Object.keys(res.rows[0]));
        } else {
            console.log('No row found for 25772');
        }

        console.log('--- Testing Query by lowercase emp_no ---');
        const res2 = await pool.query("SELECT * FROM registration WHERE emp_no = '25772'");
        console.log('Rows found (lowercase):', res2.rows.length);

    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        process.exit();
    }
}
test();
