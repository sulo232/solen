#!/usr/bin/env node

/**
 * I18n Audit Script
 *
 * Searches for common hardcoded German words in .tsx files that should be
 * wrapped in translation calls.
 *
 * Usage: node scripts/audit-i18n.js
 */

const fs = require('fs');
const path = require('path');

// Common German words that should always be translated
const GERMAN_KEYWORDS = [
  'buchen',
  'suchen',
  'kunden',
  'Startseite',
  'anmelden',
  'abmelden',
  'buchung',
  'favoriten',
  'profil',
  'nachrichten',
  'dashboard',
  'entdecken',
  'salon',
  'bewertungen',
  'termine',
  'verfügbar',
  'speichern',
  'bearbeiten',
  'löschen',
  'bestätigen',
  'abbrechen',
  'schliessen',
  'öffnen',
];

// Directories to scan
const SCAN_DIRS = [
  'app',
  'components',
];

// Files/dirs to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.d.ts',
  '.json',
  'CLAUDE.md',
  'README.md',
];

let violations = [];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath) {
  if (shouldSkip(filePath)) return;
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip lines that are already using translation functions
    if (line.includes('t(') || line.includes('useTranslations') || line.includes('getTranslations')) {
      return;
    }

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return;
    }

    // Check for hardcoded German keywords
    GERMAN_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`["'\`].*${keyword}.*["'\`]`, 'i');
      if (regex.test(line)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          keyword,
        });
      }
    });
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  });
}

// Main execution
console.log('🔍 Scanning for hardcoded German text...\n');

SCAN_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

// Report results
if (violations.length === 0) {
  console.log('✅ No hardcoded German text found!\n');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${violations.length} potential hardcoded German strings:\n`);

  violations.forEach(v => {
    console.log(`${v.file}:${v.line}`);
    console.log(`  Keyword: "${v.keyword}"`);
    console.log(`  Line: ${v.content}`);
    console.log('');
  });

  console.log(`\n⚠️  Total violations: ${violations.length}`);
  console.log('Please wrap these strings in translation calls using `useTranslations()` or `getTranslations()`.\n');

  // Don't fail the build, just warn
  process.exit(0);
}
