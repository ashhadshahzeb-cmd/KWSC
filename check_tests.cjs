const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./server/db.cjs');

async function checkTests() {
    try {
        console.log("Fetching distinct tests from Treatment2...");
        // Fetch all Medicine1..10 columns where Treatment is Lab
        // This is a bit heavy but effectively gets us the list of USED tests.
        // We will just do Medicine1 and Medicine2 for now as a sample.
        const res = await pool.query(`
            SELECT DISTINCT "Medicine1" as test FROM treatment2 WHERE "Treatment" = 'Lab' AND "Medicine1" IS NOT NULL AND "Medicine1" != ''
            UNION
            SELECT DISTINCT "Medicine2" as test FROM treatment2 WHERE "Treatment" = 'Lab' AND "Medicine2" IS NOT NULL AND "Medicine2" != ''
            LIMIT 50
        `);
        console.log("Distinct Tests found:", res.rows.map(r => r.test));

        // Also check if there is a 'tests' or 'services' table
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables:", tables.rows.map(t => t.table_name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkTests();
