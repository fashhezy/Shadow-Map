const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'app', '(dashboard)');

const replacements = [
  { regex: /border-white\/15/g, replacement: 'border-border' },
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/5/g, replacement: 'border-border' },
  { regex: /border-white\/20/g, replacement: 'border-border' },
  { regex: /bg-black\/20/g, replacement: 'bg-background' },
  { regex: /bg-black\/40/g, replacement: 'bg-muted' },
  { regex: /bg-black\/10/g, replacement: 'bg-accent' },
  { regex: /bg-white\/5/g, replacement: 'bg-accent' },
  { regex: /bg-white\/10/g, replacement: 'bg-muted' },
  { regex: /divide-white\/5/g, replacement: 'divide-border' },
  { regex: /divide-white\/10/g, replacement: 'divide-border' },
  { regex: /bg-\[#0F172A\]/g, replacement: 'bg-background' },
  { regex: /bg-\[#1e293b\]\/50/g, replacement: 'bg-background' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Refactoring complete.');
