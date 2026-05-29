const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.expo' || file === '.git' || file === 'assets') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push({ path: file.replace(__dirname + '\\', ''), size: stat.size });
            }
        }
    });
    return results;
}

const files = walk(__dirname);
console.log(`Found ${files.length} files.`);
files.forEach(f => console.log(`${f.path} (${f.size} bytes)`));
