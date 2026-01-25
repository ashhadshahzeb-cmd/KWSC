const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

const otpEndpoints = `
app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    try {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await pool.query(
            'INSERT INTO otp_verifications (phone, code, expires_at) VALUES ($1, $2, $3)',
            [phone, otpCode, expiresAt]
        );

        // Simulation: Log to console (For Free Version)
        console.log(\`\\n--- [SIMULATED SMS] ---\`);
        console.log(\`To: \${phone}\`);
        console.log(\`OTP Code: \${otpCode}\`);
        console.log(\`------------------------\\n\`);

        res.json({ success: true, message: 'OTP sent successfully (Check server console)' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { phone, code } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
            [phone, code]
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
`;

// Insert OTP endpoints before signup
if (!content.includes('/api/auth/send-otp')) {
    content = content.replace("app.post('/api/auth/signup'", otpEndpoints + "\napp.post('/api/auth/signup'");
}

// Update signup logic
const oldSignupStart = "app.post('/api/auth/signup', async (req, res) => {";
const newSignupLogic = `app.post('/api/auth/signup', async (req, res) => {
    const { email, password, fullName, empNo, phone, otpCode } = req.body;
    try {
        // Verify OTP if phone is provided
        if (phone && otpCode) {
            const otpCheck = await pool.query(
                'SELECT * FROM otp_verifications WHERE phone = $1 AND code = $2 AND verified = TRUE ORDER BY created_at DESC LIMIT 1',
                [phone, otpCode]
            );

            if (otpCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Phone number not verified or OTP expired' });
            }
        } else if (phone) {
            return res.status(400).json({ error: 'OTP code is required for phone verification' });
        }

        const result = await pool.query(
            'INSERT INTO users (email, password, full_name, emp_no, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [email, password, fullName, empNo, phone, 'user']
        );`;

if (!content.includes('phone, otpCode } = req.body;')) {
    // Find the original signup block and replace the start
    const originalSignupBlockStart = /app\.post\('\/api\/auth\/signup', async \(req, res\) => \{[\s\S]*?const result = await pool\.query\([\s\S]*?\[email, password, fullName, empNo, 'user'\]\s*\);/;
    content = content.replace(originalSignupBlockStart, newSignupLogic);
}

fs.writeFileSync(filePath, content);
console.log('File patched with OTP endpoints!');
