const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update GET card endpoint
const oldGetCard = /app\.get\('\/api\/users\/:id\/card', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newGetCard = `app.get('/api/users/:id/card', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM medical_cards WHERE user_id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.json(null);

        const card = result.rows[0];
        
        // Calculate spent amount from treatment2
        const spentRes = await pool.query(
            'SELECT SUM(medicine_amount) as total_spent FROM treatment2 WHERE emp_no = $1',
            [card.emp_no]
        );
        
        const spentAmount = parseFloat(spentRes.rows[0].total_spent || 0);
        const totalLimit = parseFloat(card.total_limit || 100000.00);
        const remainingBalance = totalLimit - spentAmount;

        res.json({
            ...card,
            total_limit: totalLimit,
            spent_amount: spentAmount,
            remaining_balance: remainingBalance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});`;

// 2. Update POST card endpoint
const oldPostCard = /app\.post\('\/api\/users\/:id\/card', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newPostCard = `app.post('/api/users/:id/card', async (req, res) => {
    const { id } = req.params;
    const {
        card_no, participant_name, emp_no, cnic, customer_no, dob, valid_upto, branch,
        benefit_covered, hospitalization, room_limit, normal_delivery, c_section_limit, total_limit
    } = req.body;

    try {
        const userId = parseInt(id);
        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

        const query = \`
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
        \`;

        const params = [
            userId, card_no || null, participant_name || null, emp_no || null, cnic || null,
            customer_no || null, dob || null, valid_upto || null, branch || null,
            benefit_covered || null, hospitalization || null, room_limit || null,
            normal_delivery || null, c_section_limit || null, total_limit || 100000.00
        ];

        const result = await pool.query(query, params);
        res.json({ success: true, card: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});`;

// 3. Update Login endpoint
const oldLogin = /app\.post\('\/api\/auth\/login', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newLogin = \`app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Send Security Notification Email
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'HealFlow Security Alert: New Login',
                    html: \\\`<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                            <h2 style="color: #2563eb;">Login Security Alert</h2>
                            <p>Hello <b>\\\${user.full_name || 'User'}</b>,</p>
                            <p>Your HealFlow Account was just logged into.</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                <b>Time:</b> \\\${new Date().toLocaleString()}<br>
                                <b>Location:</b> (HealFlow Medical Management System)
                            </div>
                            <p>If this was not you, please contact the administrator immediately.</p>
                          </div>\\\`
                };
                transporter.sendMail(mailOptions).catch(e => console.error('Login Email Fail:', e.message));
            }

            // Create login notification for admin
            if (user.role !== 'admin') {
                await pool.query(
                    'INSERT INTO notifications (type, title, message, status, metadata) VALUES ($1, $2, $3, $4, $5)',
                    ['user_login', 'User Logged In', \\\`\\\${user.full_name || user.email} just logged into the system.\\\`, 'unread', JSON.stringify({ userId: user.id })]
                );
            }

            res.json({ success: true, user: user });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});\`;

content = content.replace(oldGetCard, newGetCard);
content = content.replace(oldPostCard, newPostCard);
content = content.replace(oldLogin, newLogin);

fs.writeFileSync(filePath, content);
console.log('Backend Updated with Notifications and Balance tracking!');
