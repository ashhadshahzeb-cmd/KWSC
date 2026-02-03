const { pool } = require('./db');

const verify = async () => {
    try {
        console.log('🔍 Verifying data for Emp No: 121...');

        const result = await pool.query('SELECT COUNT(*) FROM Treatment2 WHERE Emp_no = $1', ['121']);
        console.log(`✅ Treatment Records for 121: ${result.rows[0].count}`);

        const card = await pool.query('SELECT * FROM medical_cards WHERE emp_no = $1', ['121']);
        if (card.rows.length > 0) {
            console.log(`✅ Medical Card Found. User ID: ${card.rows[0].user_id}`);
        } else {
            console.log('❌ Medical Card Not Found');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        process.exit();
    }
};

verify();
