const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/3/card',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('API Response Keys:', Object.keys(json));
            if (json.transactions) {
                console.log('✅ Transactions field PRESENT');
                console.log(`Count: ${json.transactions.length}`);
            } else {
                console.log('❌ Transactions field MISSING');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
