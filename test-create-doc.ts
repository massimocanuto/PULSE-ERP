import 'dotenv/config';

async function testCreateDoc() {
    try {
        const response = await fetch('http://localhost:5000/api/office/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: questo test non ha un cookie di sessione, quindi potrebbe fallire per autenticazione
            },
            body: JSON.stringify({
                title: 'Test Document',
                type: 'xlsx'
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testCreateDoc();
