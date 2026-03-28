const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex1 = /const\s+t\s*=\s*useTranslations\(\s*([^)]+)\s*\)\s*;/g;
      const regex2 = /const\s+t\s*=\s*useTranslations\(\s*([^)]+)\s*\)\s+as\s+any\s*;/g; // Skip already cast

      if (content.match(regex1)) {
        // Find things that don't have "as any"
        const before = content;
        content = content.replace(regex1, (match, p1) => {
          if (match.includes('as any')) return match;
          return `const t = useTranslations(${p1}) as any;`;
        });
        
        if (content !== before) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

processDirectory('./components');
processDirectory('./app');
processDirectory('./lib');
