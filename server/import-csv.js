const { Pool } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1Xb-O8ywI8pHbNxXMJd0wXcV7OPptRhcidjCguafqnCw/export?format=csv';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importData() {
    try {
        console.log('Fetching CSV data...');
        const response = await fetch(CSV_URL);
        const text = await response.text();

        const lines = text.split('\r\n');
        const headers = lines[0].split(',');
        const dataLines = lines.slice(1);

        console.log(`Found ${dataLines.length} records in CSV.`);

        let successCount = 0;
        let errorCount = 0;

        const batchSize = 100;
        for (let i = 0; i < dataLines.length; i += batchSize) {
            const batch = dataLines.slice(i, i + batchSize);
            const promises = batch.map(line => {
                if (!line.trim()) return Promise.resolve();

                const parts = line.split(',');
                const empNo = parts[1];
                const name = parts[2];
                const bookNo = parts[4];
                const status = parts[7];
                const bps = parts[3];
                const ptmoCode = parts[5];

                if (!empNo) return Promise.resolve();

                const query = `
                    INSERT INTO registration (emp_no, emp_name, book_no, patient_type, custom_fields)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (emp_no) DO UPDATE SET
                        emp_name = EXCLUDED.emp_name,
                        book_no = EXCLUDED.book_no,
                        patient_type = EXCLUDED.patient_type,
                        custom_fields = EXCLUDED.custom_fields
                `;
                const customFields = JSON.stringify({ bps, ptmoCode });

                return pool.query(query, [empNo, name, bookNo, status, customFields])
                    .then(() => { successCount++; })
                    .catch(e => {
                        console.error(`Error inserting Emp No ${empNo}:`, e.message);
                        errorCount++;
                    });
            });

            await Promise.all(promises);
            process.stdout.write(`\rProgress: ${Math.min(i + batchSize, dataLines.length)} / ${dataLines.length}`);
        }

        console.log('\n\nImport complete!');
        console.log('Success:', successCount);
        console.log('Errors:', errorCount);

    } catch (err) {
        console.error('Import failed:', err.message);
    } finally {
        await pool.end();
    }
}

importData();
