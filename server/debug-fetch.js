async function debugFetch() {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/1Xb-O8ywI8pHbNxXMJd0wXcV7OPptRhcidjCguafqnCw/export?format=csv';
    try {
        console.log('Fetching CSV...');
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            console.error('Fetch failed with status:', response.status);
            return;
        }
        const text = await response.text();
        console.log('CSV Head (first 200 chars):');
        console.log(text.substring(0, 200));
        console.log('\nCSV Tail (last 200 chars):');
        console.log(text.substring(text.length - 200));
        console.log('\nTotal length:', text.length);

        const lines = text.split(/\r?\n/);
        console.log('Total lines:', lines.length);
        console.log('Header line:', lines[0]);
    } catch (err) {
        console.error('Debug failed:', err.message);
    }
}

debugFetch();
