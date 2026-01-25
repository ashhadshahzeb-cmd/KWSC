const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testConnection() {
    console.log('Testing SMTP Connection...');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // Try sending a real test mail
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'SMTP Test',
            text: 'If you see this, email sending works!'
        });
        console.log('✅ Test Mail Sent:', info.messageId);
    } catch (err) {
        console.error('❌ SMTP Connection Failed:', err);
    }
}

testConnection();
