async function testOTP() {
    try {
        console.log('Testing Send OTP...');
        const sendRes = await fetch('http://localhost:5000/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '03001234567' })
        });
        const sendData = await sendRes.json();
        console.log('Send OTP Response:', sendData);

        if (sendData.success) {
            console.log('Success! Now check database for code (manual step for now)');
        }
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}
testOTP();
