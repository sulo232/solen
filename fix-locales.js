const fs = require('fs');
const path = require('path');

// 1. Fix NextIntl Namespaces
function getAllFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      getAllFiles(filepath, ext, fileList);
    } else if (filepath.endsWith(ext)) {
      fileList.push(filepath);
    }
  }
  return fileList;
}

const tsxFiles = [...getAllFiles('components', '.tsx'), ...getAllFiles('app', '.tsx')];
const namespaces = new Set();

// Extract all useTranslations('namespace') calls
for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match single or double quotes
  const matches = content.matchAll(/useTranslations\((['"])([^'"]+)\1\)/g);
  for (const match of matches) {
    namespaces.add(match[2]);
  }
  
  // also match getTranslations
  const tMatches = content.matchAll(/getTranslations\((['"])([^'"]+)\1\)/g);
  for (const match of tMatches) {
    namespaces.add(match[2]);
  }
}

function ensurePathExists(obj, pathStr) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (typeof current[part] !== 'object' || current[part] === null) {
      if (typeof current[part] === 'string') return;
      current[part] = i === parts.length - 1 ? { DUMMY: 'TODO' } : {};
    }
    current = current[part];
  }
}

const locales = ['de', 'en', 'fr', 'it'];
for (const locale of locales) {
  const msgPath = path.join('messages', `${locale}.json`);
  if (!fs.existsSync(msgPath)) continue;
  const msgs = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
  
  for (const ns of namespaces) {
    ensurePathExists(msgs, ns);
  }
  
  fs.writeFileSync(msgPath, JSON.stringify(msgs, null, 2));
}
console.log('NextIntl namespaces ensured.');
