// KWSC Backend Server - SQL Server Version
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { pool } = require('./db');

// Email Transporter (For OTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '', // e.g. your-email@gmail.com
        pass: process.env.EMAIL_PASS || ''  // e.g. your-app-password
    }
});

const app = express();
const PORT = process.env.PORT || 5000;
const MASTER_KEY = process.env.MASTER_KEY || '8271933';

// Export for Vercel
module.exports = app;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Root route for status check
app.get('/', (req, res) => {
    res.json({ message: 'KWSC API is running', env: process.env.NODE_ENV });
});

// Standalone ping for quick verification
app.get('/api/ping', (req, res) => {
    res.json({ pong: true, time: new Date().toISOString() });
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1 as test');
        res.json({ status: 'OK', database: 'PostgreSQL Connected', timestamp: new Date() });
    } catch (err) {
        console.error('Health Check Error:', err);
        res.status(500).json({ status: 'ERROR', database: 'Not Connected', error: err.message || 'Unknown Error' });
    }
});

// List Tables
// ============================================================================
// NOTIFICATIONS API
// ============================================================================

app.get('/api/notifications', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET status = $1 WHERE id = $2', ['read', req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/notifications/read-all', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET status = $1 WHERE status = $2', ['read', 'unread']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/notifications', async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Laboratory Tests
app.get('/api/lab/tests', async (req, res) => {
    try {
        // Collect distinct tests from all Medicine columns (1-10) for Lab treatments
        const queries = [];
        for (let i = 1; i <= 10; i++) {
            queries.push(`SELECT DISTINCT "Medicine${i}" as test FROM treatment2 WHERE "Treatment" = 'Lab' AND "Medicine${i}" IS NOT NULL AND "Medicine${i}" != ''`);
        }

        const fullQuery = queries.join(' UNION ') + ' ORDER BY test';

        const result = await pool.query(fullQuery);
        // Return simple array of strings
        res.json(result.rows.map(r => r.test));
    } catch (err) {
        console.error('Error fetching lab tests:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id/card', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM medical_cards WHERE user_id = $1', [req.params.id]);
        const card = result.rows[0];

        if (!card) {
            return res.json(null);
        }

        let spentAmount = 0;
        let recentTransactions = [];

        // If card exists, fetch transactions based on emp_no
        if (card.emp_no) {
            console.log(`[MEDICAL_CARD] Fetching history for EmpNo: ${card.emp_no}`);

            // Calculate total spent amount
            const spentResult = await pool.query(
                'SELECT SUM(medicine_amount) as total FROM treatment2 WHERE emp_no = $1',
                [card.emp_no]
            );
            spentAmount = parseFloat(spentResult.rows[0].total || 0);
            console.log(`[MEDICAL_CARD] Total spent: ${spentAmount}`);

            // Fetch recent transactions (last 20)
            const transactionsResult = await pool.query(`
                SELECT serial_no, visit_date, hospital_name, medicine_amount, description, treatment
                FROM treatment2
                WHERE emp_no = $1
                ORDER BY visit_date DESC
                LIMIT 20
            `, [card.emp_no]);
            recentTransactions = transactionsResult.rows;
            console.log(`[MEDICAL_CARD] Found ${recentTransactions.length} transactions.`);
        }

        // Calculate remaining balance
        const totalLimit = parseFloat(card.total_limit || 100000);
        const remainingBalance = totalLimit - spentAmount;

        res.json({
            ...card,
            total_limit: totalLimit,
            spent_amount: spentAmount,
            remaining_balance: remainingBalance,
            transactions: recentTransactions
        });

    } catch (err) {
        console.error('[MEDICAL_CARD_GET_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/:id/card', async (req, res) => {
    const { id } = req.params;
    const {
        card_no, participant_name, emp_no, cnic, customer_no, dob, valid_upto, branch,
        benefit_covered, hospitalization, room_limit, normal_delivery, c_section_limit, total_limit
    } = req.body;

    try {
        const userId = parseInt(id);
        if (isNaN(userId)) {
            console.error(`[MEDICAL_CARD] Invalid user ID received: ${id}`);
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        console.log(`[MEDICAL_CARD] Attempting save for user ${userId}`);

        const query = `
            INSERT INTO medical_cards (
                user_id, card_no, participant_name, emp_no, cnic, customer_no, dob, valid_upto, branch,
                benefit_covered, hospitalization, room_limit, normal_delivery, c_section_limit, total_limit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (user_id) DO UPDATE SET
                card_no = EXCLUDED.card_no,
                participant_name = EXCLUDED.participant_name,
                emp_no = EXCLUDED.emp_no,
                cnic = EXCLUDED.cnic,
                customer_no = EXCLUDED.customer_no,
                dob = EXCLUDED.dob,
                valid_upto = EXCLUDED.valid_upto,
                branch = EXCLUDED.branch,
                benefit_covered = EXCLUDED.benefit_covered,
                hospitalization = EXCLUDED.hospitalization,
                room_limit = EXCLUDED.room_limit,
                normal_delivery = EXCLUDED.normal_delivery,
                c_section_limit = EXCLUDED.c_section_limit,
                total_limit = EXCLUDED.total_limit
            RETURNING *
        `;

        const params = [
            userId,
            card_no || null,
            participant_name || null,
            emp_no || null,
            cnic || null,
            customer_no || null,
            (dob && dob !== '') ? dob : null,
            (valid_upto && valid_upto !== '') ? valid_upto : null,
            branch || null,
            benefit_covered || null,
            hospitalization || null,
            room_limit || null,
            normal_delivery || null,
            c_section_limit || null,
            total_limit || 100000
        ];

        const result = await pool.query(query, params);
        console.log(`[MEDICAL_CARD] Save successful for user ${userId}`);
        res.json({ success: true, card: result.rows[0] });
    } catch (err) {
        console.error('[MEDICAL_CARD_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id/card', async (req, res) => {
    try {
        await pool.query('DELETE FROM medical_cards WHERE user_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat Endpoints
app.get('/api/chat/users', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT u.id, u.full_name, u.email
            FROM users u
            JOIN chat_messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
            WHERE u.role != 'admin'
            ORDER BY u.id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/chat/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT * FROM chat_messages
            WHERE (sender_id = $1 AND receiver_id IS NULL)
               OR (sender_id IS NULL AND receiver_id = $1)
               OR (sender_id = $1 AND receiver_id IN (SELECT id FROM users WHERE role = 'admin'))
               OR (sender_id IN (SELECT id FROM users WHERE role = 'admin') AND receiver_id = $1)
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/chat/send', async (req, res) => {
    const { senderId, receiverId, message, isAdminMessage } = req.body;
    try {
        const query = `
            INSERT INTO chat_messages (sender_id, receiver_id, message, is_admin_message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [senderId, receiverId, message, isAdminMessage]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// DASHBOARD & ANALYTICS API
// ============================================================================

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        console.log('[DASHBOARD] Fetching stats...');
        const patientsCount = await pool.query('SELECT COUNT(*) FROM registration');
        const medicineCount = await pool.query('SELECT COUNT(*) FROM treatment2 WHERE treatment = $1 OR medicine_amount > 0', ['medicine']);
        const hospitalCount = await pool.query('SELECT COUNT(*) FROM treatment2 WHERE hospital_name IS NOT NULL AND hospital_name != $1', ['']);
        const labCount = await pool.query('SELECT COUNT(*) FROM treatment2 WHERE lab_name IS NOT NULL AND lab_name != $1', ['']);

        console.log(`[DASHBOARD] Counts - Patients: ${patientsCount.rows[0].count}, Medicine: ${medicineCount.rows[0].count}`);

        // Fetch global recent activities for admin
        const recentActivities = await pool.query('SELECT * FROM treatment2 ORDER BY visit_date DESC LIMIT 10');

        const responseData = {
            patients: parseInt(patientsCount.rows[0].count),
            medicine: parseInt(medicineCount.rows[0].count),
            hospital: parseInt(hospitalCount.rows[0].count),
            lab: parseInt(labCount.rows[0].count),
            recentActivities: recentActivities.rows
        };

        console.log('[DASHBOARD] Sending response:', JSON.stringify(responseData).substring(0, 100) + '...');
        res.json(responseData);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/user/:empNo', async (req, res) => {
    const { empNo } = req.params;
    try {
        const myVisits = await pool.query('SELECT COUNT(*) FROM treatment2 WHERE emp_no = $1', [empNo]);
        const mySpent = await pool.query('SELECT SUM(medicine_amount) FROM treatment2 WHERE emp_no = $1', [empNo]);
        const recentVisits = await pool.query('SELECT * FROM treatment2 WHERE emp_no = $1 ORDER BY visit_date DESC LIMIT 5', [empNo]);
        const cardStatus = await pool.query('SELECT id FROM medical_cards WHERE emp_no = $1', [empNo]);

        res.json({
            visits: myVisits.rows[0].count,
            spent: mySpent.rows[0].sum || 0,
            recentVisits: recentVisits.rows,
            hasCard: cardStatus.rows.length > 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// MEDICINE REPOSITORY API
// ============================================================================

app.get('/api/medicines', async (req, res) => {
    const { search, limit = 10 } = req.query;
    try {
        let query = 'SELECT * FROM medicines';
        const params = [];

        if (search) {
            query += ' WHERE name ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY name ASC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/medicines/bulk', async (req, res) => {
    const { medicines } = req.body; // Expecting array of {name, price, category}
    if (!Array.isArray(medicines)) {
        return res.status(400).json({ error: 'Medicines must be an array' });
    }

    try {
        for (const med of medicines) {
            await pool.query(
                'INSERT INTO medicines (name, price, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, category = EXCLUDED.category',
                [med.name, med.price || 0, med.category || null]
            );
        }
        res.json({ success: true, count: medicines.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tables', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manual Database Initialization (Call this once after deployment)
app.post('/api/setup/init-db', async (req, res) => {
    try {
        await initSchema();
        res.json({ success: true, message: 'Database schema initialized successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Schema Init Failed', message: err.message });
    }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await pool.query(
            'INSERT INTO otp_verifications (email, code, expires_at) VALUES ($1, $2, $3)',
            [email, otpCode, expiresAt]
        );

        // Send Email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'KWSC Signup OTP',
                text: `Your OTP for KWSC signup is: ${otpCode}. It will expire in 10 minutes.`,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                        <h2 style="color: #2563eb;">KWSC Verification</h2>
                        <p>Hello,</p>
                        <p>Your verification code for KWSC signup is:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; margin: 20px 0;">${otpCode}</div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                      </div>`
            };
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'OTP sent to your email' });
        } else {
            // Simulator Fallback
            console.log(`\n--- [SIMULATED EMAIL] ---`);
            console.log(`To: ${email}`);
            console.log(`OTP Code: ${otpCode}`);
            console.log(`--------------------------\n`);
            res.json({ success: true, message: 'OTP simulated (Check server console) - Please set EMAIL_USER/PASS in .env for real emails' });
        }
    } catch (err) {
        console.error('Email Error:', err);
        res.status(500).json({ error: 'Failed to send OTP email' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, code } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
            [email, code]
        );

        if (result.rows.length > 0) {
            const otpId = result.rows[0].id;
            await pool.query('UPDATE otp_verifications SET verified = TRUE WHERE id = $1', [otpId]);
            res.json({ success: true, message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ error: 'Invalid or expired OTP' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { email, password, fullName, empNo, otpCode } = req.body;
    try {
        // Verify OTP logic
        const otpCheck = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1 AND code = $2 AND verified = TRUE ORDER BY created_at DESC LIMIT 1',
            [email, otpCode]
        );

        if (otpCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Email not verified or OTP expired' });
        }

        const result = await pool.query(
            'INSERT INTO users (email, password, full_name, emp_no, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, password, fullName, empNo, 'user']
        );

        // Create notification for admin
        await pool.query(
            'INSERT INTO notifications (type, title, message, status) VALUES ($1, $2, $3, $4)',
            ['new_user', 'New User Registered', `New user ${fullName || email} has signed up.`, 'unread']
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Create login notification for admin (if user is not admin themselves)
            if (user.role !== 'admin') {
                await pool.query(
                    'INSERT INTO notifications (type, title, message, status, metadata) VALUES ($1, $2, $3, $4, $5)',
                    ['user_login', 'User Logged In', `${user.full_name || user.email} just logged into the system.`, 'unread', JSON.stringify({ userId: user.id })]
                );
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    role: user.role,
                    empNo: user.emp_no,
                    permissions: user.permissions
                }
            });
        } else {
            // Fallback for initial admin if no users exist
            if (email === 'admin@kwsc.com' && password === 'Admin') {
                // Ensure admin exists in DB
                const checkAdmin = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                let adminUser;
                if (checkAdmin.rows.length === 0) {
                    const insertAdmin = await pool.query(
                        'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
                        [email, 'Admin', 'KWSC Admin', 'admin']
                    );
                    adminUser = insertAdmin.rows[0];
                } else {
                    adminUser = checkAdmin.rows[0];
                }

                return res.json({
                    success: true,
                    user: {
                        id: adminUser.id,
                        email: adminUser.email,
                        name: adminUser.full_name,
                        role: adminUser.role,
                        empNo: adminUser.emp_no,
                        permissions: adminUser.permissions || []
                    }
                });
            }
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== CARD SCANNER API ====================
// Card Balance Lookup (for QR Scanner)
app.get('/api/cards/scan/:identifier', async (req, res) => {
    const { identifier } = req.params; // Can be card_no or emp_no
    try {
        // First, try to find the card
        const cardQuery = `
            SELECT 
                c.card_no,
                c.participant_name,
                c.emp_no,
                c.cnic,
                c.customer_no,
                c.dob,
                c.valid_upto,
                c.branch,
                c.benefit_covered,
                c.hospitalization,
                c.room_limit,
                c.normal_delivery,
                c.c_section_limit,
                c.total_limit,
                c.spent_amount,
                c.remaining_balance
            FROM cards c
            WHERE c.card_no = $1 OR c.emp_no = $1
            LIMIT 1
        `;

        const cardResult = await pool.query(cardQuery, [identifier]);

        if (cardResult.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        const card = cardResult.rows[0];

        // Get treatment history for this employee
        const treatmentQuery = `
            SELECT 
                Treatment as treatment_type,
                Visit_Date as visit_date,
                Medicine_amount as amount,
                Lab_name as lab_name,
                Hospital_name as hospital_name
            FROM Treatment2
            WHERE Emp_no = $1
            ORDER BY Visit_Date DESC
            LIMIT 10
        `;

        const treatmentResult = await pool.query(treatmentQuery, [card.emp_no]);

        // Calculate realtime spent amount from treatment records
        const totalSpentQuery = `
            SELECT COALESCE(SUM(CAST(NULLIF(regexp_replace(Medicine_amount, '[^0-9.]', '', 'g'), '') AS DECIMAL)), 0) as total_spent
            FROM Treatment2
            WHERE Emp_no = $1
        `;

        const spentResult = await pool.query(totalSpentQuery, [card.emp_no]);
        const actualSpent = parseFloat(spentResult.rows[0].total_spent) || 0;
        const totalLimit = parseFloat(card.total_limit) || 0;
        const remaining = totalLimit - actualSpent;

        res.json({
            success: true,
            card: {
                cardNo: card.card_no,
                participantName: card.participant_name,
                empNo: card.emp_no,
                cnic: card.cnic,
                customerNo: card.customer_no,
                dob: card.dob,
                validUpto: card.valid_upto,
                branch: card.branch,
                benefitCovered: card.benefit_covered,
                hospitalization: card.hospitalization,
                roomLimit: card.room_limit,
                normalDelivery: card.normal_delivery,
                cSectionLimit: card.c_section_limit,
                totalLimit: totalLimit,
                spentAmount: actualSpent,
                remainingBalance: remaining,
                lastUpdate: new Date().toISOString()
            },
            recentTreatments: treatmentResult.rows.map(t => ({
                type: t.treatment_type,
                date: t.visit_date,
                amount: parseFloat(t.amount) || 0,
                labName: t.lab_name,
                hospitalName: t.hospital_name
            }))
        });
    } catch (err) {
        console.error('Card scan error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== USER ROUTES ====================
// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.email, u.full_name, u.role, u.permissions, u.emp_no,
                CASE WHEN mc.id IS NOT NULL THEN TRUE ELSE FALSE END as has_medical_card
            FROM users u
            LEFT JOIN medical_cards mc ON u.id = mc.user_id
            ORDER BY u.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await pool.query('UPDATE Users SET Role = $1 WHERE Id = $2', [role, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// TREATMENT WORKFLOW ENDPOINTS
// ============================================================================

// Validate Employee Cycle & Fetch Details
app.post('/api/treatment/validate-cycle', async (req, res) => {
    const { empNo, id, visitDate } = req.body;

    try {
        const date = new Date(visitDate || new Date());
        const day = date.getDate();
        const cycleNo = day <= 15 ? '1' : '2';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const allowMonth = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;

        // Fetch additional details from Registration table
        let result;
        if (id) {
            result = await pool.query('SELECT * FROM Registration WHERE Id = $1', [id]);
        } else if (empNo) {
            // First try searching by Emp_no
            result = await pool.query('SELECT * FROM Registration WHERE Emp_no = $1', [empNo]);

            // Fallback: If not found and input is numeric, try searching by ID
            if (result.rows.length === 0 && empNo && !isNaN(empNo)) {
                result = await pool.query('SELECT * FROM Registration WHERE Id = $1', [parseInt(empNo)]);
            }
        } else {
            return res.status(400).json({ error: 'Either Employee No or ID is required' });
        }

        const employeeDetails = result.rows[0] || null;
        console.log(`[VALIDATE CYCLE] Found employee:`, employeeDetails);

        // Fetch Medical Card if exists
        let medicalCard = null;
        if (employeeDetails && employeeDetails.emp_no) {
            const cardRes = await pool.query('SELECT card_no FROM medical_cards WHERE emp_no = $1', [employeeDetails.emp_no]);
            if (cardRes.rows.length > 0) {
                medicalCard = cardRes.rows[0];
            }
        }

        res.json({
            allowed: true,
            valid: true,
            cycleNo,
            allowMonth,
            employee: employeeDetails ? {
                id: employeeDetails.id ? employeeDetails.id.toString() : '',
                empNo: employeeDetails.emp_no || '',
                name: employeeDetails.emp_name || 'Patient',
                bookNo: employeeDetails.book_no || '',
                patientNic: employeeDetails.patient_nic || '',
                patientType: employeeDetails.patient_type || 'Self',
                cardNo: medicalCard ? medicalCard.card_no : '',
            } : null,
            message: employeeDetails
                ? `Employee ${employeeDetails.emp_name} validated for Cycle ${cycleNo} of ${allowMonth}`
                : `Employee ${empNo} validated (New Record) for Cycle ${cycleNo} of ${allowMonth}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Treatment Records
app.get('/api/treatment/records', async (req, res) => {
    try {
        const { type, page = 1, limit = 50, empNo, startDate, endDate } = req.query;

        let query = `
            SELECT 
                Serial_no AS "Serial_no", Emp_no AS "Emp_no", Emp_name AS "Emp_name", Book_no AS "Book_no",
                Visit_Date AS "Visit_Date", Patient_name AS "Patient_name", Qr_code AS "Qr_code",
                Treatment AS "Treatment", Store AS "Store", Allow_month AS "Allow_month", 
                Cycle_no AS "Cycle_no", Lab_name AS "Lab_name", Hospital_name AS "Hospital_name", 
                Opd_Ipd AS "Opd_Ipd", Medicine_amount::FLOAT AS "Medicine_amount",
                Medicine1 AS "Medicine1", Price1::FLOAT AS "Price1",
                Medicine2 AS "Medicine2", Price2::FLOAT AS "Price2",
                Medicine3 AS "Medicine3", Price3::FLOAT AS "Price3",
                Medicine4 AS "Medicine4", Price4::FLOAT AS "Price4",
                Medicine5 AS "Medicine5", Price5::FLOAT AS "Price5",
                Medicine6 AS "Medicine6", Price6::FLOAT AS "Price6",
                Medicine7 AS "Medicine7", Price7::FLOAT AS "Price7",
                Medicine8 AS "Medicine8", Price8::FLOAT AS "Price8",
                Medicine9 AS "Medicine9", Price9::FLOAT AS "Price9",
                Medicine10 AS "Medicine10", Price10::FLOAT AS "Price10"
            FROM Treatment2 WHERE 1=1`;
        let params = [];
        let paramIndex = 1;

        if (type) {
            query += ` AND Treatment = $${paramIndex++}`;
            params.push(type);
        }
        if (empNo) {
            query += ` AND Emp_no = $${paramIndex++}`;
            params.push(empNo);
        }
        if (startDate) {
            query += ` AND Visit_Date >= $${paramIndex++}`;
            params.push(new Date(startDate));
        }
        if (endDate) {
            query += ` AND Visit_Date <= $${paramIndex++}`;
            params.push(new Date(endDate));
        }

        query += ' ORDER BY Serial_no DESC';
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Record
app.get('/api/treatment/records/:serialNo', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                Serial_no AS "Serial_no", Emp_no AS "Emp_no", Emp_name AS "Emp_name", Book_no AS "Book_no",
                Visit_Date AS "Visit_Date", Patient_name AS "Patient_name", Qr_code AS "Qr_code",
                Treatment AS "Treatment", Store AS "Store", Allow_month AS "Allow_month", 
                Cycle_no AS "Cycle_no", Lab_name AS "Lab_name", Hospital_name AS "Hospital_name", 
                Opd_Ipd AS "Opd_Ipd", Medicine_amount::FLOAT AS "Medicine_amount",
                Medicine1 AS "Medicine1", Price1::FLOAT AS "Price1",
                Medicine2 AS "Medicine2", Price2::FLOAT AS "Price2",
                Medicine3 AS "Medicine3", Price3::FLOAT AS "Price3",
                Medicine4 AS "Medicine4", Price4::FLOAT AS "Price4",
                Medicine5 AS "Medicine5", Price5::FLOAT AS "Price5",
                Medicine6 AS "Medicine6", Price6::FLOAT AS "Price6",
                Medicine7 AS "Medicine7", Price7::FLOAT AS "Price7",
                Medicine8 AS "Medicine8", Price8::FLOAT AS "Price8",
                Medicine9 AS "Medicine9", Price9::FLOAT AS "Price9",
                Medicine10 AS "Medicine10", Price10::FLOAT AS "Price10"
            FROM Treatment2 WHERE Serial_no = $1`, [req.params.serialNo]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Commit Treatment Session
app.post('/api/treatment/commit', async (req, res) => {
    const {
        treatmentType, employee, items, labName, hospitalName, hospitalType,
        bookNo, patientType, patientNic, reference, vendor,
        store, invoiceNo, description, medicineAmount
    } = req.body;

    try {
        const date = new Date();
        const day = date.getDate();
        const cycleNo = day <= 15 ? '1' : '2';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const allowMonth = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;

        const qrData = `${employee.empNo}|${employee.name}|${date.toISOString().split('T')[0]}`;
        const qrCode = await QRCode.toDataURL(qrData);

        const insertQuery = `
            INSERT INTO Treatment2 (
                Treatment, Emp_no, Emp_name, Visit_Date, Patient_name, Qr_code,
                Medicine1, Price1, Medicine2, Price2, Medicine3, Price3, Medicine4, Price4, Medicine5, Price5,
                Medicine6, Price6, Medicine7, Price7, Medicine8, Price8, Medicine9, Price9, Medicine10, Price10,
                Lab_name, Hospital_name, Opd_Ipd, Allow_month, Cycle_no,
                Book_no, Patient_type, Patient_nic, Refrence, Vendor,
                Store, Invoice_no, Description, Medicine_amount, Patient
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31,
                $32, $33, $34, $35, $36,
                $37, $38, $39, $40, $41
            ) RETURNING Serial_no
        `;

        const values = [
            treatmentType, employee.empNo, employee.name, date, employee.name, qrCode,
            items[0]?.name || '', items[0]?.price || 0,
            items[1]?.name || '', items[1]?.price || 0,
            items[2]?.name || '', items[2]?.price || 0,
            items[3]?.name || '', items[3]?.price || 0,
            items[4]?.name || '', items[4]?.price || 0,
            items[5]?.name || '', items[5]?.price || 0,
            items[6]?.name || '', items[6]?.price || 0,
            items[7]?.name || '', items[7]?.price || 0,
            items[8]?.name || '', items[8]?.price || 0,
            items[9]?.name || '', items[9]?.price || 0,
            labName || '', hospitalName || '', hospitalType || '', allowMonth, cycleNo,
            bookNo || '', patientType || 'Self', patientNic || '', reference || '', vendor || '',
            store || '', invoiceNo || '', description || '', medicineAmount || 0, patientType || 'Self'
        ];

        const result = await pool.query(insertQuery, values);
        const serialNo = result.rows[0].Serial_no;

        // Create notification for admin
        await pool.query(
            'INSERT INTO notifications (type, title, message, status) VALUES ($1, $2, $3, $4)',
            ['new_record', 'New Treatment Record', `${treatmentType} record added for ${employee.name} (Emp: ${employee.empNo})`, 'unread']
        );

        res.json({
            success: true,
            qrCode,
            cycleNo,
            allowMonth,
            message: 'Treatment record saved successfully',
            serialNo
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// PATIENTS ENDPOINTS
// ============================================================================

// Get All Patients (Registration)
app.get('/api/patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Registration ORDER BY Id DESC LIMIT 100');
        res.json(result.rows.map(row => ({
            id: row.id.toString(),
            empNo: row.emp_no,
            name: row.emp_name,
            bookNo: row.book_no,
            cnic: row.patient_nic,
            phone: row.phone,
            patientType: row.patient_type,
            rfid_tag: row.rfid_tag,
            custom_fields: row.custom_fields
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create/Register Patient
app.post('/api/patients', async (req, res) => {
    const { empNo, name, bookNo, cnic, phone, patientType, custom_fields } = req.body;
    try {
        const query = `
            INSERT INTO Registration (Emp_no, Emp_name, Book_no, Patient_nic, Phone, Patient_type, Custom_fields)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (Emp_no) DO UPDATE SET
                Emp_name = EXCLUDED.Emp_name,
                Book_no = EXCLUDED.Book_no,
                Patient_nic = EXCLUDED.Patient_nic,
                Phone = EXCLUDED.Phone,
                Patient_type = EXCLUDED.Patient_type,
                Custom_fields = EXCLUDED.Custom_fields
            RETURNING Id
        `;
        const result = await pool.query(query, [empNo, name, bookNo, cnic, phone, patientType, JSON.stringify(custom_fields)]);

        // Create notification for admin
        await pool.query(
            'INSERT INTO notifications (type, title, message, status) VALUES ($1, $2, $3, $4)',
            ['new_patient', 'New Patient Registered', `${name} (Emp No: ${empNo}) has been registered in the system.`, 'unread']
        );

        res.json({ success: true, id: result.rows[0].id, message: 'Patient registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Registration WHERE Id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const row = result.rows[0];
        res.json({
            id: row.id.toString(),
            empNo: row.emp_no,
            name: row.emp_name,
            bookNo: row.book_no,
            cnic: row.patient_nic,
            phone: row.phone,
            patientType: row.patient_type,
            rfid_tag: row.rfid_tag,
            custom_fields: row.custom_fields
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Employees (Paginated)
app.get('/api/employees', async (req, res) => {
    try {
        const { search, limit = 20, offset = 0 } = req.query;
        let query = 'SELECT * FROM Registration';
        let countQuery = 'SELECT COUNT(*) FROM Registration';
        const params = [];

        if (search) {
            query += ' WHERE Emp_no ILIKE $1 OR Emp_name ILIKE $1 OR Patient_nic ILIKE $1';
            countQuery += ' WHERE Emp_no ILIKE $1 OR Emp_name ILIKE $1 OR Patient_nic ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY Id DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

        const employeesResult = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);
        const totalResult = await pool.query(countQuery, params);

        res.json({
            employees: employeesResult.rows.map(row => ({
                emp_no: row.emp_no,
                emp_name: row.emp_name,
                nic: row.patient_nic,
                phone: row.phone,
                patient_type: row.patient_type,
                status: 'Active', // Default status for registration
                ...row.custom_fields // Spread custom fields
            })),
            total: parseInt(totalResult.rows[0].count)
        });
    } catch (err) {
        console.error('[EMPLOYEES ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients/:id/link-card', async (req, res) => {
    try {
        const { rfidTag } = req.body;
        await pool.query('UPDATE Registration SET RFID_Tag = $1 WHERE Id = $2', [rfidTag, req.params.id]);
        res.json({ success: true, message: 'RFID card linked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/by-tag/:tag', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Registration WHERE RFID_Tag = $1', [req.params.tag]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No patient found with this RFID tag' });
        }
        const row = result.rows[0];
        res.json({
            id: row.id.toString(),
            empNo: row.emp_no,
            name: row.emp_name,
            bookNo: row.book_no,
            cnic: row.patient_nic,
            phone: row.phone,
            patientType: row.patient_type,
            rfid_tag: row.rfid_tag,
            custom_fields: row.custom_fields
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auto-initialize legacy schema on startup
const initSchema = async () => {
    try {
        console.log('🔄 Initializing database schema...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                permissions JSONB DEFAULT '[]',
                emp_no TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS registration (
                id SERIAL PRIMARY KEY,
                emp_no TEXT UNIQUE,
                emp_name TEXT,
                book_no TEXT,
                patient_nic TEXT,
                phone TEXT,
                patient_type TEXT,
                rfid_tag TEXT,
                custom_fields JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type TEXT,
                title TEXT,
                message TEXT,
                status TEXT DEFAULT 'unread',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Ensure treatment2 exists
            CREATE TABLE IF NOT EXISTS treatment2 (
                serial_no SERIAL PRIMARY KEY,
                treatment TEXT,
                emp_no TEXT,
                emp_name TEXT,
                visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                patient_name TEXT,
                qr_code TEXT,
                medicine_amount DECIMAL(10,2),
                medicine1 TEXT, price1 DECIMAL(10,2),
                medicine2 TEXT, price2 DECIMAL(10,2),
                medicine3 TEXT, price3 DECIMAL(10,2),
                medicine4 TEXT, price4 DECIMAL(10,2),
                medicine5 TEXT, price5 DECIMAL(10,2),
                medicine6 TEXT, price6 DECIMAL(10,2),
                medicine7 TEXT, price7 DECIMAL(10,2),
                medicine8 TEXT, price8 DECIMAL(10,2),
                medicine9 TEXT, price9 DECIMAL(10,2),
                medicine10 TEXT, price10 DECIMAL(10,2),
                lab_name TEXT,
                hospital_name TEXT,
                hospital_type TEXT,
                opd_ipd TEXT,
                allow_month TEXT,
                cycle_no TEXT,
                store TEXT,
                book_no TEXT,
                invoice_no TEXT,
                description TEXT,
                patient_type TEXT,
                patient_nic TEXT,
                refrence TEXT,
                vendor TEXT,
                patient TEXT
            );

            CREATE TABLE IF NOT EXISTS medical_cards (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                card_no TEXT,
                participant_name TEXT,
                emp_no TEXT,
                cnic TEXT,
                customer_no TEXT,
                dob DATE,
                valid_upto DATE,
                branch TEXT,
                benefit_covered TEXT,
                hospitalization TEXT,
                room_limit TEXT,
                normal_delivery TEXT,
                c_section_limit TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS medicines (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                price DECIMAL(10,2) DEFAULT 0,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);

        // Run migrations for existing tables
        const migrationQuery = `
            DO $$ 
            BEGIN 
                -- treatment2 additions
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='book_no') THEN
                    ALTER TABLE treatment2 ADD COLUMN book_no TEXT;
                END IF;

                -- Add medicine columns
                FOR i IN 1..10 LOOP
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='medicine' || i) THEN
                        EXECUTE 'ALTER TABLE treatment2 ADD COLUMN medicine' || i || ' TEXT';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='price' || i) THEN
                        EXECUTE 'ALTER TABLE treatment2 ADD COLUMN price' || i || ' DECIMAL(10,2)';
                    END IF;
                END LOOP;

                -- Add other missing columns
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='patient_type') THEN
                    ALTER TABLE treatment2 ADD COLUMN patient_type TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='patient_nic') THEN
                    ALTER TABLE treatment2 ADD COLUMN patient_nic TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='refrence') THEN
                    ALTER TABLE treatment2 ADD COLUMN refrence TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='vendor') THEN
                    ALTER TABLE treatment2 ADD COLUMN vendor TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment2' AND column_name='patient') THEN
                    ALTER TABLE treatment2 ADD COLUMN patient TEXT;
                END IF;

                -- registration additions
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='registration' AND column_name='emp_no') THEN
                    ALTER TABLE registration ADD COLUMN emp_no TEXT;
                END IF;
                -- notifications additions
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='metadata') THEN
                    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
                END IF;

                -- medical_cards additions
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_cards' AND column_name='total_limit') THEN
                    ALTER TABLE medical_cards ADD COLUMN total_limit DECIMAL(12,2) DEFAULT 100000.00;
                END IF;
            END $$;
        `;
        await pool.query(migrationQuery);

        console.log('✅ Database schema initialized and migrated.');
    } catch (err) {
        console.error('❌ Schema Initialization Failed:', err.message);
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled System Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        path: req.url
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Database: PostgreSQL via Supabase');
        await initSchema();
    });
} else {
    // For Vercel, don't block the startup with schema init
    console.log('Server loaded as module (Vercel mode)');
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL is missing!');
    }

    // Automatic schema init is disabled for Vercel to prevent timeouts.
    // Use POST /api/setup/init-db to initialize manually.
}
