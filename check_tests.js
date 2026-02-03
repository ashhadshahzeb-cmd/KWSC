const { pool } = require('./server/db.cjs');

async function checkTests() {
    try {
        const res = await pool.query("SELECT * FROM treatment2 WHERE \"Treatment\" = 'Lab' LIMIT 5");
        console.log("Lab Records:", JSON.stringify(res.rows, null, 2));

        // Attempt to list tables again, but safely
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("All Tables:", tables.rows.map(t => t.table_name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkTests();
