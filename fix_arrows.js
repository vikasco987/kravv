const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('./components').concat(walk('./app'));
let changedFiles = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Reverse the regex damage
    content = content.replace(/= delaysContentTouches=\{false\} keyboardShouldPersistTaps="handled">/g, '=>');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});
console.log('Fixed ' + changedFiles + ' files');
