const { pool } = require('./db');
const QRCode = require('qrcode');

async function seed() {
    try {
        console.log('Starting seeding of treatment2...');

        // 1. Get some real patients
        const patientsRes = await pool.query('SELECT emp_no, emp_name, patient_type, patient_nic, phone, book_no FROM registration LIMIT 5');
        const patients = patientsRes.rows;

        if (patients.length === 0) {
            console.error('No patients found in registration table.');
            process.exit(1);
        }

        const treatments = ['Medicine', 'Lab', 'Hospital', 'NoteSheet'];
        const hospitals = ['Dow Hospital', 'Hill Park Hospital', '7 Day Hospital'];
        const labs = ['City Lab', 'Health Diagnostic', 'Standard Lab'];

        const date = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const allowMonth = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
        const day = date.getDate();
        const cycleNo = day <= 15 ? '1' : '2';

        for (let i = 0; i < 20; i++) {
            const patient = patients[i % patients.length];
            const treatmentType = treatments[i % treatments.length];

            const qrData = `${patient.emp_no}|${patient.emp_name}|${date.toISOString().split('T')[0]}`;
            const qrCode = await QRCode.toDataURL(qrData);

            const insertQuery = `
                INSERT INTO Treatment2 (
                    Treatment, Emp_no, Emp_name, Visit_Date, Patient_name, Qr_code,
                    Medicine1, Price1, Medicine2, Price2, Medicine3, Price3,
                    Lab_name, Hospital_name, Opd_Ipd, Allow_month, Cycle_no,
                    Book_no, Patient_type, Patient_nic, Refrence, Vendor,
                    Store, Invoice_no, Description, Medicine_amount, Patient
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22,
                    $23, $24, $25, $26, $27
                )
            `;

            const values = [
                treatmentType,
                patient.emp_no,
                patient.emp_name,
                new Date(date.getTime() - i * 24 * 60 * 60 * 1000),
                patient.emp_name,
                qrCode,
                'Panadol', 100,
                'Brufen', 150,
                'Amoxicillin', 500,
                treatmentType === 'Lab' ? labs[i % labs.length] : '',
                treatmentType === 'Hospital' ? hospitals[i % hospitals.length] : '',
                i % 2 === 0 ? 'OPD' : 'IPD',
                allowMonth,
                cycleNo,
                patient.book_no || '',
                patient.patient_type || 'Self',
                patient.patient_nic || '',
                'Direct',
                'General',
                'Pharmacy Central',
                `INV-${Date.now()}-${i}`,
                'Sample test record',
                750,
                patient.patient_type || 'Self'
            ];

            await pool.query(insertQuery, values);
            process.stdout.write('.');
        }

        console.log('\nSeeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('\nSeeding error:', err);
        process.exit(1);
    }
}

seed();
