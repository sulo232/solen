const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['app', 'components'];
const EXTENSIONS = ['.tsx', '.ts', '.css'];

const REPLACEMENTS = [
  // T1: rounded-button banned -> replaced with rounded-btn (which resolves to 99px usually, but let's carefully check if it exists in layout or just use rounded-btn)
  { regex: /\brounded-button\b/g, replacement: 'rounded-btn' },
  // T2: rounded-card banned -> replaced with explicit radius. We'll use rounded-[12px] as default V3.
  { regex: /\brounded-card\b/g, replacement: 'rounded-[12px]' },
  // T3: shadow-card banned -> replaced with inline warm shadows. We'll use shadow-warm-md or shadow-warm-sm
  { regex: /\bshadow-card\b/g, replacement: 'shadow-warm-md' },
  // T6: hover:bg-s-coral/90 -> hover:brightness-[1.06]
  { regex: /hover:bg-s-coral\/90/g, replacement: 'hover:brightness-[1.06]' },
  { regex: /hover:bg-s-coral-hover/g, replacement: 'hover:brightness-[1.06]' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (EXTENSIONS.some(ext => file.endsWith(ext))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const rule of REPLACEMENTS) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replacement);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

TARGET_DIRS.forEach(dir => {
  const fullDirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDirPath)) {
    processDirectory(fullDirPath);
  }
});

console.log('Lint fixing completed.');
