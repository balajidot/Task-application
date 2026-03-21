const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'App.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Simple regex to extract rule blocks
// This doesn't handle nested media queries perfectly but is good for top-level deduplication
const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;

const ruleMap = new Map(); // body -> [selectors]

let match;
while ((match = ruleRegex.exec(css)) !== null) {
  let selector = match[1].trim();
  let body = match[2].trim()
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .sort() // Sort properties and values to find identical logic regardless of order
    .join(';');

  if (!ruleMap.has(body)) {
    ruleMap.set(body, []);
  }
  ruleMap.get(body).push(selector);
}

const duplicates = [];
for (const [body, selectors] of ruleMap.entries()) {
  if (selectors.length > 1) {
    // Only report if there are actually multiple distinct class selectors or similar
    // (Ignoring cases where it's just the same selector appearing twice if that happens)
    const uniqueSelectors = [...new Set(selectors)];
    if (uniqueSelectors.length > 1) {
      duplicates.push({
        body,
        selectors: uniqueSelectors
      });
    }
  }
}

// Sort by number of properties to find high-value targets
duplicates.sort((a, b) => b.body.split(';').length - a.body.split(';').length);

const output = {
  totalRules: ruleMap.size,
  duplicateGroups: duplicates.length,
  groups: duplicates
};

fs.writeFileSync('duplicate_report.json', JSON.stringify(output, null, 2));
console.log('Audit complete. Check duplicate_report.json');
