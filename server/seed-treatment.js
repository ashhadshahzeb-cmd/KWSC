const { pool } = require('./db');

const seedData = async () => {
    try {
        console.log('🌱 Seeding treatment data for Emp No: 121...');

        // Ensure table exists (though server should have created it)

        const query = `
            INSERT INTO treatment2 (
                treatment, emp_no, emp_name, visit_date, patient_name, qr_code,
                medicine_amount, hospital_name, description, medicine1, price1
            ) VALUES 
            ('OPD', '121', 'Ashhad', NOW() - INTERVAL '1 day', 'Ashhad', 'TEST_QR_1', 1500, 'City Hospital', 'Flu Checkup', 'Panadol', 500),
            ('Dental', '121', 'Ashhad', NOW() - INTERVAL '5 days', 'Ashhad', 'TEST_QR_2', 5000, 'Dental Clinic', 'Root Canal', 'Painkiller', 1000),
            ('Lab', '121', 'Ashhad', NOW() - INTERVAL '10 days', 'Ashhad', 'TEST_QR_3', 2000, 'Aga Khan Lab', 'Blood Test', '', 0)
        `;

        await pool.query(query);
        console.log('✅ Seed data inserted successfully');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        // Close pool only if running standalone
        // pool.end();
        process.exit();
    }
};

seedData();
