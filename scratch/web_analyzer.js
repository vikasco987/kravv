const fs = require('fs');
const path = require('path');

const dirsToScan = ['src', 'prisma'];
const rootDir = 'c:\\Users\\RentoBees\\Desktop\\kravv\\scratch\\kravy-pos-website-target';

let results = {
  totalFiles: 0,
  totalLines: 0,
  componentsFound: 0,
  todosFound: 0,
  complexFiles: [],
  fileStats: []
};

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.prisma')) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lineCount = lines.length;

    results.totalFiles++;
    results.totalLines += lineCount;

    let todos = (content.match(/TODO|FIXME/gi) || []).length;
    results.todosFound += todos;

    let components = (content.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+[A-Z][a-zA-Z0-9]*)/g) || []).length;
    results.componentsFound += components;

    if (lineCount > 300) {
      results.complexFiles.push({
        path: filePath.replace(rootDir, ''),
        lines: lineCount,
        todos
      });
    }

    results.fileStats.push({
      path: filePath.replace(rootDir, ''),
      lines: lineCount,
      components,
      todos
    });

  } catch (err) {
    console.error('Error reading', filePath, err);
  }
}

for (const dir of dirsToScan) {
  walkDir(path.join(rootDir, dir));
}

// Sort fileStats by lines descending
results.fileStats.sort((a, b) => b.lines - a.lines);
results.complexFiles.sort((a, b) => b.lines - a.lines);

fs.writeFileSync(path.join('c:\\Users\\RentoBees\\Desktop\\kravv\\scratch', 'web_analysis_results.json'), JSON.stringify(results, null, 2));
console.log('Analysis complete. Results saved to scratch/web_analysis_results.json');
