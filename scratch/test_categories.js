const fetch = require('node-fetch');

const BACKEND_URL = "https://billing.kravy.in";

async function testEndpoints() {
    const urls = [
        `${BACKEND_URL}/api/menu/categories`,
        `${BACKEND_URL}/api/categories`,
        `${BACKEND_URL}/api/menu/view`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url);
            console.log(`GET ${url} -> Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`Response snippet: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`GET ${url} -> Error: ${e.message}`);
        }
    }
}

testEndpoints();
