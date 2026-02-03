const { pool } = require('./db');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Xb-O8ywI8pHbNxXMJd0wXcV7OPptRhcidjCguafqnCw/export?format=csv';

async function migrate() {
    console.log('🚀 Starting Data Migration...');

    try {
        // 1. Fetch CSV
        console.log('📥 Fetching spreadsheet data...');
        const response = await fetch(SPREADSHEET_CSV_URL);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const csvContent = await response.text();

        const lines = csvContent.split(/\r?\n/);
        // Skip header
        const rows = lines.slice(1).filter(l => l.trim() !== '').map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        });

        console.log(`📊 Parsed ${rows.length} rows.`);

        // Deduplicate rows by emp_no
        const seenEmpNos = new Set();
        const uniqueRows = [];
        let duplicateCount = 0;

        rows.forEach(row => {
            const empNo = row[1]; // Index 1 is Emp_No
            if (empNo && !seenEmpNos.has(empNo)) {
                seenEmpNos.add(empNo);
                uniqueRows.push(row);
            } else {
                duplicateCount++;
            }
        });

        console.log(`🧹 Removed ${duplicateCount} duplicate records.`);
        console.log(`🚀 Processing ${uniqueRows.length} unique records.`);

        // 2. Backup
        console.log('💾 Creating backup table...');
        const backupTableName = `registration_backup_${Date.now()}`;
        await pool.query(`CREATE TABLE ${backupTableName} AS SELECT * FROM registration`);
        console.log(`✅ Backup created: ${backupTableName}`);

        // 3. Truncate
        console.log('🧹 Truncating current registration table...');
        await pool.query('TRUNCATE TABLE registration RESTART IDENTITY');

        // 4. Batch Insert
        console.log('✍️ Inserting new records...');
        const batchSize = 1000;
        for (let i = 0; i < uniqueRows.length; i += batchSize) {
            const batch = uniqueRows.slice(i, i + batchSize);
            const values = [];
            let placeholderIndex = 1;
            const queryParts = [];

            batch.forEach(row => {
                const [srno, empNo, name, bps, bookNo, ptmoCode, statusCode, status] = row;

                // 4 columns: emp_no, emp_name, book_no, patient_type
                // Excluding bps, ptmo_code, status
                queryParts.push(`($${placeholderIndex++}, $${placeholderIndex++}, $${placeholderIndex++}, $${placeholderIndex++})`);

                values.push(
                    empNo || '',
                    name || 'Unknown',
                    bookNo || '0',
                    // ptmoCode || null,
                    // status || '', 
                    'Self' // Default patient_type
                );
            });

            const query = `
                INSERT INTO registration (emp_no, emp_name, book_no, patient_type)
                VALUES ${queryParts.join(', ')}
            `;
            await pool.query(query, values);
            console.log(`✅ Inserted ${i + batch.length}/${rows.length} records...`);
        }

        console.log('🎉 Migration successful!');

        // 5. Verification
        console.log('🔍 Running quick verification...');
        const verifyRes = await pool.query("SELECT * FROM registration WHERE emp_no = '25771'");
        console.log('Matches for 25771:');
        verifyRes.rows.forEach(r => console.log(` - ID: ${r.id}, Name: ${r.emp_name}, EmpNo: ${r.emp_no}, BookNo: ${r.book_no}`));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.detail) console.error('Detail:', error.detail);
        if (error.hint) console.error('Hint:', error.hint);
        if (error.position) console.error('Position:', error.position);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } finally {
        process.exit();
    }
}

migrate();
