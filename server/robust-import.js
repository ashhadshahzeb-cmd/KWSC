const { pool } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1Xb-O8ywI8pHbNxXMJd0wXcV7OPptRhcidjCguafqnCw/export?format=csv';

async function importData() {
    try {
        console.log('--- CSV IMPORT START ---');
        console.log('Fetching CSV...');
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');

        if (lines.length < 2) {
            console.log('CSV is empty or only has headers.');
            return;
        }

        console.log(`Processing ${lines.length - 1} records...`);

        let successCount = 0;
        let errorCount = 0;

        const batchSize = 100;
        for (let i = 1; i < lines.length; i += batchSize) {
            const batch = lines.slice(i, i + batchSize);
            const promises = batch.map(line => {
                const parts = line.split(',');
                if (parts.length < 8) return Promise.resolve();

                const empNo = parts[1]?.trim();
                const name = parts[2]?.trim();
                const bps = parts[3]?.trim();
                const bookNo = parts[4]?.trim();
                const ptmoCode = parts[5]?.trim();
                const status = parts[7]?.trim();

                if (!empNo || empNo === '') return Promise.resolve();

                const query = `
                    INSERT INTO registration (emp_no, emp_name, book_no, patient_type, custom_fields)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (emp_no) DO UPDATE SET
                        emp_name = EXCLUDED.emp_name,
                        book_no = EXCLUDED.book_no,
                        patient_type = EXCLUDED.patient_type,
                        custom_fields = EXCLUDED.custom_fields
                `;

                const customFields = JSON.stringify({
                    bps: bps,
                    ptmo_code: ptmoCode,
                    original_srno: parts[0]
                });

                return pool.query(query, [empNo, name, bookNo, status, customFields])
                    .then(() => { successCount++; })
                    .catch(e => {
                        errorCount++;
                    });
            });

            await Promise.all(promises);
            if (i % 500 === 0 || i === 1) {
                process.stdout.write(`\rProgress: ${Math.min(i + batchSize - 1, lines.length - 1)} / ${lines.length - 1}`);
            }
        }

        console.log('\n\n--- IMPORT SUMMARY ---');
        console.log('Total Records:', lines.length - 1);
        console.log('Successfully Imported:', successCount);
        console.log('Errors/Skipped:', errorCount);
        console.log('-----------------------');

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

importData();
