const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add nodemailer require
if (!content.includes("require('nodemailer')")) {
    content = content.replace("const express = require('express');", "const express = require('express');\nconst nodemailer = require('nodemailer');");
}

// 2. Add email transporter placeholder
const transporterCode = `
// Email Transporter (For OTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '', // e.g. your-email@gmail.com
        pass: process.env.EMAIL_PASS || ''  // e.g. your-app-password
    }
});
`;
if (!content.includes('nodemailer.createTransport')) {
    content = content.replace('const app = express();', transporterCode + '\nconst app = express();');
}

// 3. Update send-otp endpoint
const oldSendOtp = /app\.post\('\/api\/auth\/send-otp', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newSendOtp = `app.post('/api/auth/send-otp', async (req, res) => {
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
                subject: 'HealFlow Signup OTP',
                text: \`Your OTP for HealFlow signup is: \${otpCode}. It will expire in 10 minutes.\`,
                html: \`<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                        <h2 style="color: #2563eb;">HealFlow Verification</h2>
                        <p>Hello,</p>
                        <p>Your verification code for HealFlow signup is:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; margin: 20px 0;">\${otpCode}</div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                      </div>\`
            };
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'OTP sent to your email' });
        } else {
            // Simulator Fallback
            console.log(\`\\n--- [SIMULATED EMAIL] ---\`);
            console.log(\`To: \${email}\`);
            console.log(\`OTP Code: \${otpCode}\`);
            console.log(\`--------------------------\\n\`);
            res.json({ success: true, message: 'OTP simulated (Check server console) - Please set EMAIL_USER/PASS in .env for real emails' });
        }
    } catch (err) {
        console.error('Email Error:', err);
        res.status(500).json({ error: 'Failed to send OTP email' });
    }
});`;

// 4. Update verify-otp endpoint
const oldVerifyOtp = /app\.post\('\/api\/auth\/verify-otp', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newVerifyOtp = `app.post('/api/auth/verify-otp', async (req, res) => {
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
});`;

// 5. Update signup endpoint
const oldSignup = /app\.post\('\/api\/auth\/signup', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newSignup = `app.post('/api/auth/signup', async (req, res) => {
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
            ['new_user', 'New User Registered', \`New user \${fullName || email} has signed up.\`, 'unread']
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});`;

content = content.replace(oldSendOtp, newSendOtp);
content = content.replace(oldVerifyOtp, newVerifyOtp);
content = content.replace(oldSignup, newSignup);

fs.writeFileSync(filePath, content);
console.log('Backend updated to Email OTP!');
