import fs from 'fs';

const content = fs.readFileSync('c:/Users/Deepak/Desktop/kravy-3/context/LanguageContext.tsx', 'utf8');

const regex = /([a-z]{2}):\s*{([\s\S]*?)}/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const lang = match[1];
    const block = match[2];
    const keys = block.match(/([a-z_]+):/g);
    if (keys) {
        const seen = new Set();
        keys.forEach(k => {
            const key = k.slice(0, -1);
            if (seen.has(key)) {
                console.log(`Duplicate key in ${lang}: ${key}`);
            }
            seen.add(key);
        });
    }
}
