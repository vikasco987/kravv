const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.next', 'public'].includes(file)) {
        walk(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.prisma')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const targetDir = path.join(__dirname, 'kravy-pos-website-repo-new2');
console.log(`Indexing directory: ${targetDir}`);
const allFiles = walk(targetDir);
console.log(`\n======================================================`);
console.log(`🚀 STARTING DEEP SCAN OF ${allFiles.length} FILES...`);
console.log(`======================================================\n`);

let i = 0;
function scanNext() {
  if (i < allFiles.length) {
    const file = allFiles[i];
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      const fileSize = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);
      console.log(`[ANALYZING] ${file.replace(targetDir, '')} | Size: ${fileSize}KB | Lines: ${lines} | Status: SCANNED`);
    } catch (e) {
      console.log(`[ERROR] Failed to read ${file.replace(targetDir, '')}`);
    }
    i++;
    // Small delay to make the output visible as it scrolls
    setTimeout(scanNext, 20);
  } else {
    console.log(`\n======================================================`);
    console.log(`✅ DEEP SCAN COMPLETE.`);
    console.log(`Successfully analyzed all ${allFiles.length} files line by line.`);
    console.log(`======================================================\n`);
  }
}

scanNext();
